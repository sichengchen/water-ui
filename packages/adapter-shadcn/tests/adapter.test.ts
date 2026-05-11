import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { createWaterRegistry, summarizeWaterRegistry, verifyDocument } from "@water-ui/core";
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/react";
import {
  createShadcnAdapterConfig,
  createShadcnComponents,
  getShadcnImportPath,
  shadcnComponents,
} from "../src/index.ts";
import type { WaterRenderDiagnostic } from "@water-ui/react";

test("merges shadcn entries with user registry entries", () => {
  const registry = createWaterRegistry({
    components: {
      ...shadcnComponents,
      CustomerTable: {
        description: "User-owned customer table.",
      },
    },
  });

  expect(registry.ok).toBe(true);
  expect(Object.keys(registry.components)).toEqual([
    "Button",
    "Card",
    "Alert",
    "Input",
    "Badge",
    "CustomerTable",
  ]);
});

test("validates shadcn component props", () => {
  const registry = createWaterRegistry({ components: shadcnComponents });
  const result = verifyDocument(
    {
      kind: "water.ui.document",
      version: "water.ui.v1",
      root: "button",
      nodes: {
        button: {
          type: "Button",
          props: {
            label: "Export",
            variant: "primary",
          },
        },
      },
    },
    {
      registry,
    },
  );

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: "invalid_component_props",
      path: "$.nodes.button.props.variant",
    }),
  ]);
});

test("renders shadcn-backed nodes through project component bindings", () => {
  const components = createShadcnComponents({
    components: {
      Button: ({ children, variant, onClick }) =>
        createElement(
          "button",
          {
            "data-action": String(Boolean(onClick)),
            "data-variant": variant,
            type: "button",
          },
          children,
        ),
      Card: ({ children }) => createElement("article", { "data-card": "true" }, children),
      CardHeader: ({ children }) => createElement("div", { "data-card-header": "true" }, children),
      CardTitle: ({ children }) => createElement("h2", null, children),
      CardContent: ({ children }) =>
        createElement("div", { "data-card-content": "true" }, children),
    },
  });
  const registry = createWaterRegistry({ components });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "water.ui.document",
        version: "water.ui.v1",
        root: "card",
        nodes: {
          card: {
            type: "Card",
            props: {
              title: "Actions",
            },
            children: ["button"],
          },
          button: {
            type: "Button",
            props: {
              label: "Export customers",
              variant: "outline",
              actionId: "exportCustomers",
            },
          },
        },
      },
      {
        registry,
        runtime: {
          actions: ["exportCustomers"],
        },
      },
    ),
  );
  const diagnostics: Array<readonly WaterRenderDiagnostic[]> = [];

  const html = renderToStaticMarkup(
    createElement(
      WaterRuntimeProvider,
      {
        registry,
        runtime: {
          runAction: () => "done",
        },
      },
      createElement(WaterRenderer, {
        ui,
        onDiagnostics: (next) => diagnostics.push(next),
      }),
    ),
  );

  expect(html).toBe(
    '<article data-card="true"><div data-card-header="true"><h2>Actions</h2></div><div data-card-content="true"><button data-action="true" data-variant="outline" type="button">Export customers</button></div></article>',
  );
  expect(diagnostics[0]).toEqual([]);
});

test("generates prompt summaries for shadcn entries", () => {
  const registry = createWaterRegistry({ components: shadcnComponents });
  const summary = summarizeWaterRegistry(registry);

  expect(summary.components).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "Button",
        description: "shadcn Button for registered UI actions.",
        props: expect.arrayContaining([
          expect.objectContaining({
            name: "variant",
            allowedValues: ["default", "destructive", "outline", "secondary", "ghost", "link"],
          }),
        ]),
      }),
      expect.objectContaining({
        type: "Card",
        children: "nodes",
      }),
    ]),
  );
});

test("supports project-local shadcn import aliases", () => {
  const config = createShadcnAdapterConfig({
    aliases: {
      ui: "@/components/ui/",
    },
  });

  expect(getShadcnImportPath(config, "button")).toBe("@/components/ui/button");
  expect(getShadcnImportPath(config, "card")).toBe("@/components/ui/card");
});

function expectVerified(result: ReturnType<typeof verifyDocument>) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected verified UI: ${JSON.stringify(result.diagnostics)}`);
  }

  return result.ui;
}
