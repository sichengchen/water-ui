import { expect, test } from "vite-plus/test";
import { z } from "zod";
import {
  applyPatch,
  createPatchHistory,
  createWaterRegistry,
  verifyDocument,
} from "../src/index.ts";
import type { VerificationResult } from "../src/index.ts";

const registry = createWaterRegistry({
  components: {
    Page: {
      description: "Page container.",
      children: "nodes",
    },
    Table: {
      description: "Data table.",
      children: "none",
      propsSchema: z
        .object({
          dataRef: z.string(),
          density: z.enum(["compact", "comfortable"]).optional(),
        })
        .strict(),
    },
    Filter: {
      description: "State-backed filter.",
      children: "none",
      propsSchema: z
        .object({
          stateKey: z.string(),
        })
        .strict(),
    },
    Panel: {
      description: "Panel with slots.",
      children: "nodes",
      slots: {
        header: {},
      },
    },
    Text: {
      description: "Text node.",
      children: "none",
      propsSchema: z.object({ label: z.string() }).strict(),
    },
  },
});

const runtime = {
  dataRefs: ["queries.customers.data"],
  stateKeys: ["filters.status"],
};

test("applies upsertNode and child insertion operations", () => {
  const ui = createBaseUI();
  const result = applyPatch(
    ui,
    {
      kind: "water.ui.patch",
      version: "water.ui.v1",
      target: "page",
      ops: [
        {
          op: "upsertNode",
          id: "filter",
          node: {
            type: "Filter",
            props: {
              stateKey: "filters.status",
            },
          },
        },
        {
          op: "insertChildBefore",
          parent: "page",
          before: "table",
          child: "filter",
        },
      ],
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.diagnostics));
  }
  expect(result.ui.nodes.page?.children).toEqual(["filter", "table"]);
  expect(ui.nodes.page?.children).toEqual(["table"]);
});

test("applies updateProps, moveNode, removeNode, and replaceChildren", () => {
  const initial = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "page",
        nodes: {
          page: {
            type: "Page",
            children: ["table", "filter", "text"],
          },
          table: {
            type: "Table",
            props: {
              dataRef: "queries.customers.data",
            },
          },
          filter: {
            type: "Filter",
            props: {
              stateKey: "filters.status",
            },
          },
          text: {
            type: "Text",
            props: {
              label: "Orphan",
            },
          },
        },
      },
      { registry, runtime },
    ),
  );

  const result = applyPatch(
    initial,
    {
      kind: "water.ui.patch",
      version: "water.ui.v1",
      target: "page",
      ops: [
        {
          op: "updateProps",
          id: "table",
          props: {
            density: "compact",
          },
        },
        {
          op: "moveNode",
          id: "filter",
          parent: "page",
          before: "table",
        },
        {
          op: "removeNode",
          id: "text",
        },
        {
          op: "replaceChildren",
          parent: "page",
          children: ["filter", "table"],
        },
      ],
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.diagnostics));
  }
  expect(result.ui.nodes.page?.children).toEqual(["filter", "table"]);
  expect(result.ui.nodes.table?.props).toEqual({
    dataRef: "queries.customers.data",
    density: "compact",
  });
  expect(result.ui.nodes.text).toBeUndefined();
});

test("applies slot operations and records patch history", () => {
  const history = createPatchHistory();
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "panel",
        nodes: {
          panel: {
            type: "Panel",
            children: ["body", "title"],
          },
          body: {
            type: "Text",
            props: {
              label: "Body",
            },
          },
          title: {
            type: "Text",
            props: {
              label: "Title",
            },
          },
        },
      },
      { registry, runtime },
    ),
  );

  const result = applyPatch(
    ui,
    {
      kind: "water.ui.patch",
      version: "water.ui.v1",
      target: "panel",
      ops: [
        {
          op: "setSlot",
          id: "panel",
          slot: "header",
          value: "title",
        },
        {
          op: "unsetSlot",
          id: "panel",
          slot: "header",
        },
      ],
    },
    { registry, runtime, history },
  );

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.diagnostics));
  }
  expect(result.ui.nodes.panel?.slots).toEqual({});
  expect(history.list()).toHaveLength(1);
  expect(history.list()[0]?.index).toBe(0);
});

test("rejects unregistered inserted nodes through full verification", () => {
  const result = applyPatch(
    createBaseUI(),
    {
      kind: "water.ui.patch",
      version: "water.ui.v1",
      target: "page",
      ops: [
        {
          op: "upsertNode",
          id: "chart",
          node: {
            type: "Chart",
          },
        },
        {
          op: "appendChild",
          parent: "page",
          child: "chart",
        },
      ],
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: "unknown_component_type",
      nodeId: "chart",
    }),
  ]);
});

test("rejects invalid operation references before commit", () => {
  const result = applyPatch(
    createBaseUI(),
    {
      kind: "water.ui.patch",
      version: "water.ui.v1",
      target: "page",
      ops: [
        {
          op: "appendChild",
          parent: "page",
          child: "missing",
        },
      ],
    },
    { registry, runtime },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: "invalid_patch_child_reference",
      nodeId: "missing",
    }),
  ]);
});

function createBaseUI() {
  return expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "page",
        nodes: {
          page: {
            type: "Page",
            children: ["table"],
          },
          table: {
            type: "Table",
            props: {
              dataRef: "queries.customers.data",
            },
          },
        },
      },
      { registry, runtime },
    ),
  );
}

function expectVerified(result: VerificationResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.diagnostics));
  }

  return result.ui;
}
