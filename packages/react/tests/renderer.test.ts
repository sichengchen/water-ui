import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import {
  applyStreamEvent,
  createStreamState,
  createWasserRegistry,
  verifyDocument,
} from "@wasser-ui/core";
import {
  NodeRenderer,
  SlotRenderer,
  WasserRenderer,
  WasserRuntimeProvider,
  WasserStreamRenderer,
} from "../src/index.ts";
import type {
  WasserActionContext,
  WasserRenderBinding,
  WasserRenderContext,
  WasserRenderDiagnostic,
  WasserRuntime,
  WasserRuntimeEvent,
} from "../src/index.ts";

test("renders the verified root node through a registry render binding", () => {
  const registry = createWasserRegistry({
    components: {
      Page: {
        description: "Page root.",
        render: (({ nodeId }) =>
          createElement(
            "main",
            { "data-node": nodeId },
            "Dashboard",
          )) satisfies WasserRenderBinding,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(WasserRenderer, { ui }),
    ),
  );

  expect(html).toBe('<main data-node="page">Dashboard</main>');
});

test("renders recursive children and named slots", () => {
  const registry = createWasserRegistry({
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
          createElement(
            "section",
            null,
            createElement("header", null, slots.header),
            createElement("div", null, children),
          )) satisfies WasserRenderBinding,
      },
      Text: {
        description: "Text node.",
        render: (({ props }) =>
          createElement("p", null, String(props.label))) satisfies WasserRenderBinding<{
          label: string;
        }>,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(WasserRenderer, { ui }),
    ),
  );

  expect(html).toBe("<section><header><p>Customers</p></header><div><p>Ready</p></div></section>");
});

test("exposes node, slot, and stream renderer components", () => {
  const registry = createWasserRegistry({
    components: {
      Layout: {
        description: "Layout with slots.",
        slots: {
          header: {},
        },
        render: (({ slots }) =>
          createElement("section", null, slots.header)) satisfies WasserRenderBinding,
      },
      Text: {
        description: "Text node.",
        render: (({ props }) =>
          createElement("p", null, String(props.label))) satisfies WasserRenderBinding<{
          label: string;
        }>,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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

  const nodeHtml = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(NodeRenderer, { ui, nodeId: "title" }),
    ),
  );
  const slotHtml = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(SlotRenderer, { ui, nodeId: "layout", name: "header" }),
    ),
  );
  const streamHtml = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(WasserStreamRenderer, { ui }),
    ),
  );

  expect(nodeHtml).toBe("<p>Customers</p>");
  expect(slotHtml).toBe("<p>Customers</p>");
  expect(streamHtml).toBe("<section><p>Customers</p></section>");
});

test("renders verified stream state through WasserStreamRenderer", () => {
  const registry = createWasserRegistry({
    components: {
      Page: {
        description: "Page shell.",
        children: "nodes",
        render: (({ children }) =>
          createElement("main", null, children)) satisfies WasserRenderBinding,
      },
      Text: {
        description: "Text node.",
        render: (({ props }) =>
          createElement("p", null, String(props.label))) satisfies WasserRenderBinding<{
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

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(WasserStreamRenderer, { stream }),
    ),
  );

  expect(html).toBe("<main><p>Streaming</p></main>");
});

test("binds runtime data, actions, and telemetry into render context", () => {
  let actionContext: WasserActionContext | undefined;
  let tableContext: WasserRenderContext | undefined;
  let buttonContext: WasserRenderContext | undefined;
  const events: WasserRuntimeEvent[] = [];
  const registry = createWasserRegistry({
    components: {
      App: {
        description: "App shell.",
        children: "nodes",
        render: (({ children }) =>
          createElement("div", null, children)) satisfies WasserRenderBinding,
      },
      CustomerTable: {
        description: "Customer table.",
        render: ((context) => {
          tableContext = context;
          const rows = context.bindings.data["queries.customers.data"] as string[];
          return createElement("table", null, createElement("caption", null, rows.join(", ")));
        }) satisfies WasserRenderBinding,
      },
      ExportButton: {
        description: "Export button.",
        render: ((context) => {
          buttonContext = context;
          return createElement(
            "button",
            {
              "data-bound": String(typeof context.bindings.actions.exportCustomers === "function"),
            },
            "Export",
          );
        }) satisfies WasserRenderBinding,
      },
    },
  });
  const runtime: WasserRuntime = {
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
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime, registry },
      createElement(WasserRenderer, { ui }),
    ),
  );

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
  const registry = createWasserRegistry({
    components: {
      AdminPanel: {
        description: "Admin panel.",
        render: (() => {
          called = true;
          return createElement("section", null, "Admin");
        }) satisfies WasserRenderBinding,
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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
  const diagnostics: Array<readonly WasserRenderDiagnostic[]> = [];

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      {
        runtime: {
          permissions: () => false,
        },
        registry,
      },
      createElement(WasserRenderer, {
        ui,
        onDiagnostics: (next) => {
          diagnostics.push(next);
        },
      }),
    ),
  );

  expect(called).toBe(false);
  expect(html).toBe(
    '<span data-wasser-fallback="permission_denied" data-wasser-node-id="admin" data-wasser-component-type="AdminPanel"></span>',
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
  const registry = createWasserRegistry({
    components: {
      Metric: {
        description: "Metric without a render binding.",
      },
    },
  });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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
  const missingBindingDiagnostics: Array<readonly WasserRenderDiagnostic[]> = [];

  const missingBindingHtml = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(WasserRenderer, {
        ui,
        onDiagnostics: (next) => missingBindingDiagnostics.push(next),
      }),
    ),
  );

  expect(missingBindingHtml).toBe(
    '<span data-wasser-fallback="missing_render_binding" data-wasser-node-id="metric" data-wasser-component-type="Metric"></span>',
  );
  expect(missingBindingDiagnostics[0]?.[0]?.code).toBe("missing_render_binding");

  const rawDiagnostics: Array<readonly WasserRenderDiagnostic[]> = [];
  const rawHtml = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { runtime: {}, registry },
      createElement(WasserRenderer, {
        ui: {
          kind: "wasser.ui.document",
          version: "wasser.ui.v1",
          root: "metric",
          nodes: {
            metric: {
              type: "Metric",
            },
          },
        } as never,
        onDiagnostics: (next) => rawDiagnostics.push(next),
      }),
    ),
  );

  expect(rawHtml).toBe('<span data-wasser-fallback="invalid_renderer_input"></span>');
  expect(rawDiagnostics[0]?.[0]?.code).toBe("invalid_renderer_input");
});

function expectVerified(result: ReturnType<typeof verifyDocument>) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected verified UI.");
  }

  return result.ui;
}
