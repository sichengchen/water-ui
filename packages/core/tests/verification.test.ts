import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { z } from "zod";
import {
  assertVerifiedSchemaUI,
  createWasserRegistry,
  isVerifiedSchemaUI,
  verifyDocument,
} from "../src/index.ts";
import type {
  RuntimeCapabilityDescription,
  VerificationResult,
  WasserRegistryInput,
} from "../src/index.ts";

const fixtureRoot = new URL("../../../docs/fixtures/verification/", import.meta.url);

const registry = createWasserRegistry({
  components: {
    AdminPage: {
      description: "Page shell for admin workflows.",
      children: {
        kind: "nodes",
        min: 1,
      },
      slots: {
        toolbar: {
          required: true,
          multiple: false,
        },
      },
    },
    CustomerTable: {
      description: "Displays customers with configured columns.",
      children: "none",
      propsSchema: z
        .object({
          dataRef: z.string(),
          columns: z.array(
            z.object({
              key: z.string(),
              label: z.string(),
            }),
          ),
        })
        .strict(),
    },
    ExportButton: {
      description: "Runs a registered export action.",
      children: "none",
      propsSchema: z
        .object({
          actionId: z.literal("exportCustomers"),
        })
        .strict(),
    },
    StatusFilter: {
      description: "Binds a status value to runtime state.",
      children: "none",
      propsSchema: z
        .object({
          stateKey: z.string(),
        })
        .strict(),
    },
    DisplaySettings: {
      description: "Stores display settings parsed by Zod.",
      children: "none",
      propsSchema: z
        .object({
          pageSize: z.coerce.number().int().positive(),
        })
        .strict(),
    },
  },
});

const runtime: RuntimeCapabilityDescription = {
  actions: ["exportCustomers"],
  dataRefs: ["queries.customers.data"],
  stateKeys: ["filters.status"],
};

test("returns VerifiedSchemaUI for valid registry and runtime references", () => {
  const source = JSON.parse(readFixture("documents/admin-page.valid.json")) as unknown;
  const result = verifyDocument(source, { registry, runtime });
  const ui = expectVerified(result);

  expect(isVerifiedSchemaUI(ui)).toBe(true);
  expect(Object.isFrozen(ui)).toBe(true);
  expect(ui.root).toBe("page");
  expect(result.diagnostics).toEqual([]);
  expect(source).toEqual(JSON.parse(readFixture("documents/admin-page.valid.json")));
});

test("assertVerifiedSchemaUI narrows branded documents", () => {
  const result = verifyDocument(readFixture("documents/admin-page.valid.json"), {
    registry,
    runtime,
  });
  const ui = expectVerified(result);

  assertVerifiedSchemaUI(ui);
  expect(() => assertVerifiedSchemaUI({})).toThrow("Expected VerifiedSchemaUI.");
});

test("verifies root, child references, slot references, cycles, and orphans", () => {
  const result = verifyDocument(readFixture("documents/invalid-graph.invalid.json"), {
    registry,
    runtime,
  });

  expect(result.ok).toBe(false);
  expect(result.diagnostics.map(({ code, path }) => ({ code, path }))).toEqual([
    {
      code: "invalid_node_reference",
      path: "$.nodes.page.children[1]",
    },
    {
      code: "invalid_node_reference",
      path: "$.nodes.page.slots.toolbar",
    },
    {
      code: "cycle_detected",
      path: "$.nodes.cycle.children[0]",
    },
    {
      code: "unreachable_node",
      path: "$.nodes.orphan",
    },
  ]);
});

test("rejects unknown component types", () => {
  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "root",
      nodes: {
        root: {
          type: "MissingComponent",
        },
      },
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: "unknown_component_type",
      path: "$.nodes.root.type",
      componentType: "MissingComponent",
    }),
  ]);
});

test("validates props against registry schemas", () => {
  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "table",
      nodes: {
        table: {
          type: "CustomerTable",
          props: {
            dataRef: "queries.customers.data",
            columns: [{ key: "name" }],
            extra: true,
          },
        },
      },
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics.map(({ code, path }) => ({ code, path }))).toEqual([
    {
      code: "invalid_component_props",
      path: "$.nodes.table.props.columns[0].label",
    },
    {
      code: "invalid_component_props",
      path: "$.nodes.table.props.extra",
    },
  ]);
});

test("stores Zod-parsed props in VerifiedSchemaUI", () => {
  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "settings",
      nodes: {
        settings: {
          type: "DisplaySettings",
          props: {
            pageSize: "25",
          },
        },
      },
    },
    { registry, runtime },
  );
  const ui = expectVerified(result);

  expect(ui.nodes.settings?.props).toEqual({
    pageSize: 25,
  });
});

test("deep-freezes verified props without freezing source input", () => {
  const source = {
    kind: "wasser.ui.document",
    version: "wasser.ui.v1",
    root: "settings",
    nodes: {
      settings: {
        type: "DisplaySettings",
        props: {
          pageSize: "25",
          nested: {
            items: ["source"],
          },
        },
      },
    },
  };
  const localRegistry = createWasserRegistry({
    components: {
      DisplaySettings: {
        description: "Stores nested display settings.",
        children: "none",
        propsSchema: z
          .object({
            pageSize: z.coerce.number().int().positive(),
            nested: z.object({
              items: z.array(z.string()),
            }),
          })
          .strict(),
      },
    },
  });
  const result = verifyDocument(source, { registry: localRegistry, runtime });
  const ui = expectVerified(result);
  const props = ui.nodes.settings?.props as {
    nested: {
      items: string[];
    };
  };

  expect(Object.isFrozen(props)).toBe(true);
  expect(Object.isFrozen(props.nested)).toBe(true);
  expect(Object.isFrozen(props.nested.items)).toBe(true);
  expect(Object.isFrozen(source.nodes.settings.props.nested.items)).toBe(false);
});

test("rejects verification when the registry has diagnostics", () => {
  const invalidRegistry = createWasserRegistry({
    components: {
      DisplaySettings: {
        description: "Valid component retained in an invalid registry.",
      },
      MissingDescription: {},
    } as unknown as WasserRegistryInput,
  });

  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "settings",
      nodes: {
        settings: {
          type: "DisplaySettings",
        },
      },
    },
    { registry: invalidRegistry, runtime },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: "missing_component_description",
      path: "$.components.MissingDescription.description",
    }),
  ]);
});

test("does not treat every ActionId/DataRef/StateKey suffix as a runtime capability", () => {
  const localRegistry = createWasserRegistry({
    components: {
      CommandPalette: {
        description: "Uses local identifiers that are not runtime capability references.",
        children: "none",
        propsSchema: z
          .object({
            primaryActionId: z.string(),
            cachedDataRef: z.string(),
            defaultStateKey: z.string(),
          })
          .strict(),
      },
    },
  });

  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "palette",
      nodes: {
        palette: {
          type: "CommandPalette",
          props: {
            primaryActionId: "local-action",
            cachedDataRef: "local-data",
            defaultStateKey: "local-state",
          },
        },
      },
    },
    { registry: localRegistry, runtime },
  );

  expect(result.ok).toBe(true);
});

test("validates action IDs, data refs, and state keys against runtime capabilities", () => {
  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "page",
      nodes: {
        page: {
          type: "AdminPage",
          children: ["table"],
          slots: {
            toolbar: "button",
          },
        },
        table: {
          type: "CustomerTable",
          props: {
            dataRef: "queries.unknown.data",
            columns: [{ key: "name", label: "Name" }],
          },
        },
        button: {
          type: "ExportButton",
          props: {
            actionId: "deleteCustomers",
          },
        },
        filter: {
          type: "StatusFilter",
          props: {
            stateKey: "filters.unknown",
          },
        },
      },
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics.map(({ code, path }) => ({ code, path }))).toEqual([
    {
      code: "unreachable_node",
      path: "$.nodes.filter",
    },
    {
      code: "invalid_component_props",
      path: "$.nodes.button.props.actionId",
    },
    {
      code: "invalid_runtime_action",
      path: "$.nodes.button.props.actionId",
    },
    {
      code: "invalid_runtime_state_key",
      path: "$.nodes.filter.props.stateKey",
    },
    {
      code: "invalid_runtime_data_ref",
      path: "$.nodes.table.props.dataRef",
    },
  ]);
});

test("returns parser diagnostics for invalid document shapes", () => {
  const result = verifyDocument(readFixture("../protocol/documents/invalid-shape.invalid.json"), {
    registry,
    runtime,
  });

  expect(result.ok).toBe(false);
  expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
    "invalid_document_root",
    "invalid_node_type",
    "invalid_node_children",
  ]);
});

function readFixture(path: string): string {
  return readFileSync(new URL(path, fixtureRoot), "utf8");
}

function expectVerified(result: VerificationResult) {
  if (!result.ok) {
    throw new Error(`Expected verification success: ${JSON.stringify(result.diagnostics)}`);
  }

  return result.ui;
}
