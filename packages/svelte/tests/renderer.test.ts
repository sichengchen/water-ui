import { expect, test } from "vite-plus/test";
import {
  applyStreamEvent,
  createStreamState,
  createWaterRegistry,
  verifyDocument,
} from "@water-ui/core";
import {
  renderWaterNodeToHtml,
  renderWaterSlotToHtml,
  renderWaterStreamToHtml,
  renderWaterToHtml,
  waterElement,
} from "../src/index.ts";
import type {
  WaterActionContext,
  WaterRenderBinding,
  WaterRenderContext,
  WaterRenderDiagnostic,
  WaterRuntime,
  WaterRuntimeEvent,
} from "../src/index.ts";

test("renders the verified root node through a registry render binding", () => {
  const registry = createWaterRegistry({
    components: {
      Page: {
        description: "Page root.",
        render: (({ nodeId }) =>
          waterElement("main", { "data-node": nodeId }, "Dashboard")) satisfies WaterRenderBinding,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "page",
        nodes: {
          page: {
            type: "Page",
          },
        },
      },
      { registry },
    ),
  );

  const html = renderWaterToHtml({ ui, registry });

  expect(html).toBe('<main data-node="page">Dashboard</main>');
});

test("renders recursive children and named slots", () => {
  const registry = createWaterRegistry({
    components: {
      Layout: {
        description: "Layout with header and body.",
        children: "nodes",
        slots: {
          header: {
            multiple: false,
          },
        },
        render: (({ children, slots }) =>
          waterElement("section", undefined, [
            waterElement("header", undefined, slots.header),
            waterElement("div", undefined, children),
          ])) satisfies WaterRenderBinding,
      },
      Text: {
        description: "Text node.",
        render: (({ props }) =>
          waterElement("p", undefined, String(props.label))) satisfies WaterRenderBinding<{
          label: string;
        }>,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "layout",
        nodes: {
          layout: {
            type: "Layout",
            children: ["body"],
            slots: {
              header: "title",
            },
          },
          title: {
            type: "Text",
            props: {
              label: "Customers",
            },
          },
          body: {
            type: "Text",
            props: {
              label: "Ready",
            },
          },
        },
      },
      { registry },
    ),
  );

  const html = renderWaterToHtml({ ui, registry });

  expect(html).toBe("<section><header><p>Customers</p></header><div><p>Ready</p></div></section>");
});

test("exposes node, slot, and stream renderer functions", () => {
  const registry = createWaterRegistry({
    components: {
      Layout: {
        description: "Layout with slots.",
        slots: {
          header: {},
        },
        render: (({ slots }) =>
          waterElement("section", undefined, slots.header)) satisfies WaterRenderBinding,
      },
      Text: {
        description: "Text node.",
        render: (({ props }) =>
          waterElement("p", undefined, String(props.label))) satisfies WaterRenderBinding<{
          label: string;
        }>,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "layout",
        nodes: {
          layout: {
            type: "Layout",
            slots: {
              header: "title",
            },
          },
          title: {
            type: "Text",
            props: {
              label: "Customers",
            },
          },
        },
      },
      { registry },
    ),
  );

  const nodeHtml = renderWaterNodeToHtml({ ui, registry, nodeId: "title" });
  const slotHtml = renderWaterSlotToHtml({ ui, registry, nodeId: "layout", name: "header" });
  const streamHtml = renderWaterStreamToHtml({ ui, registry });

  expect(nodeHtml).toBe("<p>Customers</p>");
  expect(slotHtml).toBe("<p>Customers</p>");
  expect(streamHtml).toBe("<section><p>Customers</p></section>");
});

test("renders verified stream state through renderWaterStreamToHtml", () => {
  const registry = createWaterRegistry({
    components: {
      Page: {
        description: "Page shell.",
        children: "nodes",
        render: (({ children }) =>
          waterElement("main", undefined, children)) satisfies WaterRenderBinding,
      },
      Text: {
        description: "Text node.",
        render: (({ props }) =>
          waterElement("p", undefined, String(props.label))) satisfies WaterRenderBinding<{
          label: string;
        }>,
      },
    },
  });
  let stream = createStreamState();
  stream = applyStreamEvent(
    stream,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "Page",
    },
    { registry },
  ).state;
  stream = applyStreamEvent(
    stream,
    {
      seq: 2,
      kind: "node.upsert",
      id: "text",
      type: "Text",
      props: {
        label: "Streaming",
      },
    },
    { registry },
  ).state;
  stream = applyStreamEvent(
    stream,
    {
      seq: 3,
      kind: "child.append",
      parent: "page",
      child: "text",
    },
    { registry },
  ).state;

  const html = renderWaterStreamToHtml({ stream, registry });

  expect(html).toBe("<main><p>Streaming</p></main>");
});

test("binds runtime data, actions, and telemetry into render context", () => {
  let actionContext: WaterActionContext | undefined;
  let tableContext: WaterRenderContext | undefined;
  let buttonContext: WaterRenderContext | undefined;
  const events: WaterRuntimeEvent[] = [];
  const registry = createWaterRegistry({
    components: {
      App: {
        description: "App shell.",
        children: "nodes",
        render: (({ children }) =>
          waterElement("div", undefined, children)) satisfies WaterRenderBinding,
      },
      CustomerTable: {
        description: "Customer table.",
        render: ((context) => {
          tableContext = context;
          const rows = context.bindings.data["queries.customers.data"] as string[];
          return waterElement(
            "table",
            undefined,
            waterElement("caption", undefined, rows.join(", ")),
          );
        }) satisfies WaterRenderBinding,
      },
      ExportButton: {
        description: "Export button.",
        render: ((context) => {
          buttonContext = context;
          return waterElement(
            "button",
            {
              "data-bound": String(typeof context.bindings.actions.exportCustomers === "function"),
            },
            "Export",
          );
        }) satisfies WaterRenderBinding,
      },
    },
  });
  const runtime: WaterRuntime = {
    resolveData: (dataRef) => {
      expect(dataRef).toBe("queries.customers.data");
      return ["Ada", "Grace"];
    },
    runAction: (_actionId, _payload, context) => {
      actionContext = context;
      return "done";
    },
    telemetry: (event) => events.push(event),
  };
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "app",
        nodes: {
          app: {
            type: "App",
            children: ["table", "button"],
          },
          table: {
            type: "CustomerTable",
            props: {
              dataRef: "queries.customers.data",
            },
          },
          button: {
            type: "ExportButton",
            props: {
              actionId: "exportCustomers",
            },
          },
        },
      },
      {
        registry,
        runtime: {
          actions: ["exportCustomers"],
          dataRefs: ["queries.customers.data"],
        },
      },
    ),
  );

  const html = renderWaterToHtml({ ui, registry, runtime });

  expect(html).toBe(
    '<div><table><caption>Ada, Grace</caption></table><button data-bound="true">Export</button></div>',
  );
  expect(tableContext?.bindings.actions.exportCustomers).toBeUndefined();
  expect(buttonContext?.bindings.actions.exportCustomers?.({ format: "csv" })).toBe("done");
  expect(actionContext).toEqual(
    expect.objectContaining({
      actionId: "exportCustomers",
      nodeId: "button",
    }),
  );
  expect(events).toEqual([
    {
      kind: "renderer.node.render",
      nodeId: "app",
      componentType: "App",
    },
    {
      kind: "renderer.node.render",
      nodeId: "table",
      componentType: "CustomerTable",
    },
    {
      kind: "renderer.node.render",
      nodeId: "button",
      componentType: "ExportButton",
    },
    {
      kind: "runtime.action.invoke",
      actionId: "exportCustomers",
      nodeId: "button",
      componentType: "ExportButton",
    },
  ]);
});

test("applies permission guards before calling render bindings", () => {
  let called = false;
  const registry = createWaterRegistry({
    components: {
      AdminPanel: {
        description: "Admin panel.",
        render: (() => {
          called = true;
          return waterElement("section", undefined, "Admin");
        }) satisfies WaterRenderBinding,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "admin",
        nodes: {
          admin: {
            type: "AdminPanel",
            props: {
              permission: "admin.view",
            },
          },
        },
      },
      { registry },
    ),
  );
  const diagnostics: Array<readonly WaterRenderDiagnostic[]> = [];

  const html = renderWaterToHtml({
    ui,
    registry,
    runtime: {
      permissions: () => false,
    },
    onDiagnostics: (next) => diagnostics.push(next),
  });

  expect(called).toBe(false);
  expect(html).toBe(
    '<span data-water-fallback="permission_denied" data-water-node-id="admin" data-water-component-type="AdminPanel"></span>',
  );
  expect(diagnostics[0]).toEqual([
    expect.objectContaining({
      code: "permission_denied",
      nodeId: "admin",
      componentType: "AdminPanel",
    }),
  ]);
});

test("renders safe fallbacks for missing render bindings and raw schema input", () => {
  const registry = createWaterRegistry({
    components: {
      Metric: {
        description: "Metric without a render binding.",
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "metric",
        nodes: {
          metric: {
            type: "Metric",
          },
        },
      },
      { registry },
    ),
  );
  const missingBindingDiagnostics: Array<readonly WaterRenderDiagnostic[]> = [];

  const missingBindingHtml = renderWaterToHtml({
    ui,
    registry,
    onDiagnostics: (next) => missingBindingDiagnostics.push(next),
  });

  expect(missingBindingHtml).toBe(
    '<span data-water-fallback="missing_render_binding" data-water-node-id="metric" data-water-component-type="Metric"></span>',
  );
  expect(missingBindingDiagnostics[0]?.[0]?.code).toBe("missing_render_binding");

  const rawDiagnostics: Array<readonly WaterRenderDiagnostic[]> = [];
  const rawHtml = renderWaterToHtml({
    ui: {
      kind: "water.ui.document",
      version: "water.ui.v1",
      root: "metric",
      nodes: {
        metric: {
          type: "Metric",
        },
      },
    } as never,
    registry,
    onDiagnostics: (next) => rawDiagnostics.push(next),
  });

  expect(rawHtml).toBe('<span data-water-fallback="invalid_renderer_input"></span>');
  expect(rawDiagnostics[0]?.[0]?.code).toBe("invalid_renderer_input");
});

test("escapes text and attributes by default", () => {
  const registry = createWaterRegistry({
    components: {
      Message: {
        description: "Message.",
        render: (({ props }) =>
          waterElement(
            "p",
            { title: String(props.title) },
            String(props.body),
          )) satisfies WaterRenderBinding<{
          body: string;
          title: string;
        }>,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "message",
        nodes: {
          message: {
            type: "Message",
            props: {
              title: '"quoted"',
              body: "<script>alert(1)</script>",
            },
          },
        },
      },
      { registry },
    ),
  );

  const html = renderWaterToHtml({ ui, registry });

  expect(html).toBe('<p title="&quot;quoted&quot;">&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

function expectVerified(result: ReturnType<typeof verifyDocument>) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected verified UI.");
  }

  return result.ui;
}
