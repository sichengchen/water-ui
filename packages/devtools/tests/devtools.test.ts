import { expect, test } from "vite-plus/test";
import { z } from "zod";
import {
  applyPatch,
  applyStreamEvent,
  createPatchHistory,
  createStreamState,
  createWaterRegistry,
  verifyDocument,
} from "@water-ui/core";
import { compileSystemPrompt } from "@water-ui/prompt";
import { createWaterRuntime } from "@water-ui/runtime";
import {
  createDebugEventBus,
  createDevToolsInspection,
  inspectDiagnostics,
  inspectPatchHistory,
  inspectPrompts,
  inspectRegistry,
  inspectRenderBindings,
  inspectRuntimeEvents,
  inspectSchemaUI,
  inspectStream,
  inspectVerifiedSchemaUI,
} from "../src/index.ts";

const registry = createWaterRegistry({
  components: {
    Page: {
      description: "Page shell.",
      children: "nodes",
      render: () => null,
    },
    CustomerTable: {
      description: "Displays customers.",
      children: "none",
      propsSchema: z.object({ dataRef: z.string() }).strict(),
      prompt: {
        props: [
          {
            name: "dataRef",
            description: "Customer data ref.",
            required: true,
            allowedValues: ["queries.customers.data"],
          },
        ],
      },
    },
    ExportButton: {
      description: "Exports customers.",
      children: "none",
      prompt: {
        props: [
          {
            name: "actionId",
            description: "Export action ID.",
            required: true,
            allowedValues: ["exportCustomers"],
          },
        ],
      },
      render: () => null,
    },
  },
});

const runtimeDescription = {
  actions: ["exportCustomers"],
  dataRefs: ["queries.customers.data"],
};

const rawDocument = {
  kind: "water.ui.document",
  version: "water.ui.v1",
  root: "page",
  nodes: {
    page: {
      type: "Page",
      children: ["table"],
    },
    table: {
      type: "CustomerTable",
      props: {
        dataRef: "queries.customers.data",
      },
    },
  },
};

test("inspects registry entries and render binding availability", () => {
  const panel = inspectRegistry(registry);

  expect(panel.id).toBe("registry");
  expect(panel.rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "Page",
        hasRenderBinding: true,
      }),
      expect.objectContaining({
        type: "CustomerTable",
        hasPropsSummary: true,
        hasRenderBinding: false,
      }),
    ]),
  );
});

test("inspects raw and verified UI documents", () => {
  const verified = expectVerified(
    verifyDocument(rawDocument, { registry, runtime: runtimeDescription }),
  );

  const rawPanel = inspectSchemaUI(rawDocument);
  const verifiedPanel = inspectVerifiedSchemaUI(verified);

  expect(rawPanel.summary).toContain("2 raw nodes");
  expect(rawPanel.rows[0]).toEqual(expect.objectContaining({ reachable: true }));
  expect(verifiedPanel.summary).toContain("2 verified nodes");
  expect(verifiedPanel.rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        nodeId: "table",
        verified: true,
      }),
    ]),
  );
});

test("inspects validation diagnostics", () => {
  const result = verifyDocument(
    {
      kind: "water.ui.document",
      version: "water.ui.v1",
      root: "missing",
      nodes: {
        page: {
          type: "Unknown",
        },
      },
    },
    { registry, runtime: runtimeDescription },
  );
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("Expected diagnostics.");
  }

  const panel = inspectDiagnostics(result.diagnostics);

  expect(panel.severity).toBe("error");
  expect(panel.rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "invalid_document_root_reference",
      }),
    ]),
  );
});

test("inspects patch history and stream state", () => {
  const verified = expectVerified(
    verifyDocument(rawDocument, { registry, runtime: runtimeDescription }),
  );
  const history = createPatchHistory();
  const patchResult = applyPatch(
    verified,
    {
      kind: "water.ui.patch",
      version: "water.ui.v1",
      target: "page",
      ops: [
        {
          op: "upsertNode",
          id: "export",
          node: {
            type: "ExportButton",
            props: {
              actionId: "exportCustomers",
            },
          },
        },
        {
          op: "appendChild",
          parent: "page",
          child: "export",
        },
      ],
    },
    { registry, runtime: runtimeDescription, history },
  );
  expect(patchResult.ok).toBe(true);

  let stream = createStreamState();
  stream = applyStreamEvent(
    stream,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "Page",
    },
    { registry, runtime: runtimeDescription },
  ).state;
  stream = applyStreamEvent(
    stream,
    {
      seq: 2,
      kind: "child.append",
      parent: "page",
      child: "table",
    },
    { registry, runtime: runtimeDescription },
  ).state;

  const patchPanel = inspectPatchHistory(history);
  const streamPanel = inspectStream(stream);

  expect(patchPanel.rows).toEqual([
    expect.objectContaining({
      target: "page",
      opCount: 2,
    }),
  ]);
  expect(streamPanel.rows).toEqual([
    expect.objectContaining({
      seq: 2,
      status: "buffered",
    }),
  ]);
});

test("inspects runtime events and compiled prompts", async () => {
  const runtime = createWaterRuntime();
  runtime.queries.register({
    id: "customers",
    dataRef: "queries.customers.data",
    handler: () => ["Ada"],
  });
  await runtime.resolveData("queries.customers.data");
  await expect(runtime.runAction("missingAction")).rejects.toMatchObject({
    code: "unknown_action",
  });
  const prompt = compileSystemPrompt({
    mode: "document",
    registry,
    runtime: runtime.describe(),
  });

  const runtimePanel = inspectRuntimeEvents(runtime.events.getSnapshot());
  const promptPanel = inspectPrompts({
    system: prompt,
  });

  expect(runtimePanel.summary).toContain("1 blocked");
  expect(promptPanel.rows).toEqual([
    expect.objectContaining({
      id: "system",
      includesForbiddenRules: true,
    }),
  ]);
});

test("inspects render bindings and creates full inspection snapshots", () => {
  const verified = expectVerified(
    verifyDocument(rawDocument, { registry, runtime: runtimeDescription }),
  );
  const prompt = compileSystemPrompt({ registry, runtime: runtimeDescription });

  const renderPanel = inspectRenderBindings(registry, [
    {
      nodeId: "table",
      componentType: "CustomerTable",
      binding: "missing",
      diagnosticCode: "missing_render_binding",
    },
  ]);
  const inspection = createDevToolsInspection({
    registry,
    rawSchemaUI: rawDocument,
    verifiedUI: verified,
    prompts: {
      system: prompt,
    },
    renderTraces: [
      {
        nodeId: "table",
        componentType: "CustomerTable",
        binding: "missing",
        diagnosticCode: "missing_render_binding",
      },
    ],
  });

  expect(renderPanel.rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        componentType: "CustomerTable",
        hasRenderBinding: false,
        diagnosticCode: "missing_render_binding",
      }),
    ]),
  );
  expect(Object.keys(inspection.panels)).toEqual([
    "registry",
    "schema",
    "verified",
    "validation",
    "patches",
    "streams",
    "runtime",
    "prompts",
    "render",
  ]);
  expect(inspection.debugEvents).toHaveLength(9);
});

test("debug event bus records and publishes events", () => {
  const bus = createDebugEventBus();
  const received: unknown[] = [];
  const unsubscribe = bus.subscribe((event) => received.push(event));

  bus.emit({
    kind: "devtools.event",
    source: "test",
    message: "inspected",
  });
  unsubscribe();
  bus.emit({
    kind: "devtools.event",
    source: "test",
    message: "hidden",
  });

  expect(received).toHaveLength(1);
  expect(bus.getSnapshot()).toHaveLength(2);
});

function expectVerified(result: ReturnType<typeof verifyDocument>) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.diagnostics));
  }

  return result.ui;
}
