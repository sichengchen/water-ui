import { expect, test } from "vite-plus/test";
import { z } from "zod";
import { createWasserRuntime, WasserRuntimeError } from "../src/index.ts";
import type { RuntimeEventRecord } from "../src/index.ts";

test("registers capabilities and exposes verification descriptions", () => {
  const runtime = createWasserRuntime();

  runtime.state.register({
    key: "filters.status",
    initialValue: "all",
    schema: z.enum(["all", "active", "inactive"]),
  });
  runtime.queries.register({
    id: "customers",
    dataRef: "queries.customers.data",
    outputSchema: z.array(z.object({ name: z.string() })),
    handler: () => [{ name: "Ada" }],
  });
  runtime.actions.register({
    id: "exportCustomers",
    risk: "low",
    handler: () => "ok",
  });
  runtime.mutations.register({
    id: "deleteCustomer",
    risk: "destructive",
    handler: () => ({ deleted: true }),
  });

  expect(runtime.describe()).toEqual({
    actions: ["exportCustomers"],
    dataRefs: ["queries.customers.data"],
    stateKeys: ["filters.status"],
  });
  expect(runtime.mutations.ids()).toEqual(["deleteCustomer"]);
});

test("resolves known data refs through registered queries", async () => {
  const runtime = createWasserRuntime();

  runtime.queries.register({
    id: "customers",
    dataRef: "queries.customers.data",
    inputSchema: z.undefined(),
    outputSchema: z.array(z.string()),
    handler: () => ["Ada", "Grace"],
  });

  await expect(runtime.resolveData("queries.customers.data")).resolves.toEqual(["Ada", "Grace"]);
  expect(runtime.events.getSnapshot().map((event) => event.kind)).toEqual([
    "runtime.capability.register",
    "runtime.permission.decision",
    "runtime.query.resolve",
  ]);
});

test("runs known action IDs safely with permission guard and schema validation", async () => {
  const events: RuntimeEventRecord[] = [];
  const runtime = createWasserRuntime({
    telemetry: (event) => events.push(event),
    permissions: {
      canRunAction: ({ risk }) => risk !== "destructive",
    },
  });

  runtime.actions.register({
    id: "exportCustomers",
    risk: "low",
    inputSchema: z.object({ format: z.enum(["csv", "json"]) }),
    outputSchema: z.object({ queued: z.boolean() }),
    handler: ({ format }) => ({ queued: format === "csv" }),
  });
  runtime.actions.register({
    id: "deleteCustomers",
    risk: "destructive",
    handler: () => "deleted",
  });

  await expect(runtime.runAction("exportCustomers", { format: "csv" })).resolves.toEqual({
    queued: true,
  });
  await expect(runtime.runAction("deleteCustomers")).rejects.toMatchObject({
    code: "permission_denied",
    id: "deleteCustomers",
  });
  expect(events.map((event) => event.kind)).toContain("runtime.action.run");
  expect(events.map((event) => event.kind)).toContain("runtime.block");
});

test("blocks unknown capabilities instead of running them", async () => {
  const runtime = createWasserRuntime();

  await expect(runtime.runAction("missingAction")).rejects.toBeInstanceOf(WasserRuntimeError);
  await expect(runtime.resolveData("queries.missing.data")).rejects.toMatchObject({
    code: "unknown_query",
    id: "queries.missing.data",
  });
  expect(runtime.events.getSnapshot()).toEqual([
    expect.objectContaining({
      kind: "runtime.block",
      code: "unknown_action",
      id: "missingAction",
    }),
    expect.objectContaining({
      kind: "runtime.block",
      code: "unknown_query",
      id: "queries.missing.data",
    }),
  ]);
});

test("guards state and mutation operations and logs runtime events", async () => {
  const runtime = createWasserRuntime({
    permissions: (input) => {
      if (input.kind === "mutation" && input.risk === "destructive") {
        return {
          allowed: false,
          reason: "Destructive mutations require confirmation.",
        };
      }

      return true;
    },
  });

  runtime.state.register({
    key: "filters.status",
    initialValue: "all",
    schema: z.enum(["all", "active", "inactive"]),
  });
  runtime.mutations.register({
    id: "deleteCustomer",
    risk: "destructive",
    handler: () => ({ deleted: true }),
  });

  await expect(runtime.state.set("filters.status", "active")).resolves.toBe("active");
  expect(runtime.state.get("filters.status")).toBe("active");
  await expect(runtime.mutations.run("deleteCustomer")).rejects.toMatchObject({
    code: "permission_denied",
    id: "deleteCustomer",
  });
  expect(runtime.events.getSnapshot().map((event) => event.kind)).toEqual([
    "runtime.capability.register",
    "runtime.capability.register",
    "runtime.permission.decision",
    "runtime.state.set",
    "runtime.permission.decision",
    "runtime.block",
  ]);
});
