// @ts-nocheck
import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { renderApplication } from "@angular/platform-server";
import { expect, test } from "vite-plus/test";
import {
  applyStreamEvent,
  createStreamState,
  createWasserRegistry,
  verifyDocument,
} from "@wasser-ui/core";
import { provideWasserRuntime, wasserComponent } from "../src/index.ts";
import { TestHostComponent, setRenderRequest } from "../src/testing-host.ts";
import {
  TestLayoutComponent,
  TestPageComponent,
  TestTextComponent,
} from "../src/testing-components.ts";

test("renders the verified root node through a registry render binding", async () => {
  const registry = createWasserRegistry({
    components: {
      Page: {
        description: "Page root.",
        render: ({ nodeId }) => wasserComponent(TestPageComponent, { nodeId }),
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

  const html = await renderWasser({ kind: "renderer", ui, registry });

  expect(html).toContain('<main data-node="page">Dashboard</main>');
});

test("renders recursive children, named slots, node, slot, and stream renderers", async () => {
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
        render: ({ children, slots }) =>
          wasserComponent(TestLayoutComponent, {
            children,
            header: slots.header,
          }),
      },
      Text: {
        description: "Text node.",
        render: ({ props }) => wasserComponent(TestTextComponent, { label: String(props.label) }),
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

  const rootHtml = await renderWasser({ kind: "renderer", ui, registry });
  const nodeHtml = await renderWasser({ kind: "node", ui, nodeId: "title", registry });
  const slotHtml = await renderWasser({
    kind: "slot",
    ui,
    nodeId: "layout",
    name: "header",
    registry,
  });

  expect(rootHtml).toContain("<section>");
  expect(rootHtml).toContain("<header>");
  expect(rootHtml).toContain("<p>Customers</p>");
  expect(rootHtml).toContain("<div>");
  expect(rootHtml).toContain("<p>Ready</p>");
  expect(nodeHtml).toContain("<p>Customers</p>");
  expect(slotHtml).toContain("<p>Customers</p>");
});

test("renders verified stream state and binds runtime data, actions, and telemetry", async () => {
  let actionContext;
  let tableContext;
  let buttonContext;
  const events = [];
  const registry = createWasserRegistry({
    components: {
      App: {
        description: "App shell.",
        children: "nodes",
        render: ({ children }) => wasserComponent(TestLayoutComponent, { children }),
      },
      CustomerTable: {
        description: "Customer table.",
        render: (context) => {
          tableContext = context;
          const rows = context.bindings.data["queries.customers.data"];
          return wasserComponent(TestTextComponent, { label: rows.join(", ") });
        },
      },
      ExportButton: {
        description: "Export button.",
        render: (context) => {
          buttonContext = context;
          return wasserComponent(TestTextComponent, {
            label: String(typeof context.bindings.actions.exportCustomers === "function"),
          });
        },
      },
    },
  });
  const runtime = {
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
  let stream = createStreamState();
  stream = applyStreamEvent(
    stream,
    {
      seq: 1,
      kind: "node.upsert",
      id: "app",
      type: "App",
    },
    { registry },
  ).state;

  const html = await renderWasser({ kind: "renderer", ui, registry, runtime });
  const streamHtml = await renderWasser({ kind: "stream", stream, registry });

  expect(html).toContain("<p>Ada, Grace</p>");
  expect(html).toContain("<p>true</p>");
  expect(streamHtml).toContain("<section>");
  expect(streamHtml).toContain("<header>");
  expect(streamHtml).toContain("<div>");
  expect(tableContext.bindings.actions.exportCustomers).toBeUndefined();
  expect(buttonContext.bindings.actions.exportCustomers({ format: "csv" })).toBe("done");
  expect(actionContext).toEqual(
    expect.objectContaining({
      actionId: "exportCustomers",
      nodeId: "button",
    }),
  );
  expect(events.map((event) => event.kind)).toEqual([
    "renderer.node.render",
    "renderer.node.render",
    "renderer.node.render",
    "runtime.action.invoke",
  ]);
});

test("applies permission guards and renders safe fallbacks", async () => {
  let called = false;
  const registry = createWasserRegistry({
    components: {
      AdminPanel: {
        description: "Admin panel.",
        render: () => {
          called = true;
          return wasserComponent(TestTextComponent, { label: "Admin" });
        },
      },
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
  const diagnostics = [];

  const deniedHtml = await renderWasser({
    kind: "renderer",
    ui,
    registry,
    runtime: {
      permissions: () => false,
    },
    onDiagnostics: (next) => diagnostics.push(next),
  });
  const rawHtml = await renderWasser({
    kind: "renderer",
    ui: {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "metric",
      nodes: {
        metric: {
          type: "Metric",
        },
      },
    },
    registry,
  });

  expect(called).toBe(false);
  expect(deniedHtml).toContain('data-wasser-fallback="permission_denied"');
  expect(deniedHtml).toContain('data-wasser-node-id="admin"');
  expect(diagnostics[0][0]).toEqual(
    expect.objectContaining({
      code: "permission_denied",
      nodeId: "admin",
    }),
  );
  expect(rawHtml).toContain('data-wasser-fallback="invalid_renderer_input"');
});

function renderWasser(request) {
  setRenderRequest(request);
  return renderApplication(
    (context) =>
      bootstrapApplication(
        TestHostComponent,
        {
          providers: [
            provideWasserRuntime({
              runtime: request.runtime ?? {},
              registry: request.registry,
            }),
          ],
        },
        context,
      ),
    {
      document: "<html><body><test-app-shell></test-app-shell></body></html>",
    },
  );
}

function expectVerified(result) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected verified UI.");
  }

  return result.ui;
}
