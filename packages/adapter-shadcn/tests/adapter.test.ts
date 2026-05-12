import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { createWasserRegistry, summarizeWasserRegistry, verifyDocument } from "@wasser-ui/core";
import { WasserRenderer, WasserRuntimeProvider } from "@wasser-ui/react";
import {
  createShadcnAdapterConfig,
  createShadcnComponents,
  createShadcnRegistryIndex,
  defineShadcnRegistryItem,
  getShadcnCatalogEntry,
  getShadcnImportPath,
  resolveShadcnRegistryTarget,
  shadcnComponentCatalog,
  shadcnComponents,
} from "../src/index.ts";
import type { WasserRenderDiagnostic } from "@wasser-ui/react";
import type { ShadcnGenericRenderProps } from "../src/index.ts";

test("merges shadcn entries with user registry entries", () => {
  const registry = createWasserRegistry({
    components: {
      ...shadcnComponents,
      CustomerTable: {
        description: "User-owned customer table.",
      },
    },
  });

  expect(registry.ok).toBe(true);
  expect(Object.keys(registry.components)).toEqual([
    ...shadcnComponentCatalog.map((entry) => entry.type),
    "CustomerTable",
  ]);
  expect(registry.components.Accordion?.metadata?.shadcn).toEqual(
    expect.objectContaining({
      module: "accordion",
      registryDependencies: ["accordion"],
    }),
  );
});

test("validates shadcn component props", () => {
  const registry = createWasserRegistry({ components: shadcnComponents });
  const result = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
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
  const registry = createWasserRegistry({ components });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
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
  const diagnostics: Array<readonly WasserRenderDiagnostic[]> = [];

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      {
        registry,
        runtime: {
          runAction: () => "done",
        },
      },
      createElement(WasserRenderer, {
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

test("renders generic shadcn catalog entries through project component bindings", () => {
  const components = createShadcnComponents({
    components: {
      Accordion: ({ children, ...props }: ShadcnGenericRenderProps) =>
        createElement(
          "section",
          {
            "data-accordion": props["data-shadcn-component"],
            "data-type": props.type,
          },
          children,
        ),
      Badge: ({ children }) => createElement("span", null, children),
    },
  });
  const registry = createWasserRegistry({ components });
  const ui = expectVerified(
    verifyDocument(
      {
        kind: "wasser.ui.document",
        version: "wasser.ui.v1",
        root: "accordion",
        nodes: {
          accordion: {
            type: "Accordion",
            props: {
              type: "single",
            },
            children: ["badge"],
          },
          badge: {
            type: "Badge",
            props: {
              label: "Open",
            },
          },
        },
      },
      {
        registry,
      },
    ),
  );

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      { registry, runtime: {} },
      createElement(WasserRenderer, { ui }),
    ),
  );

  expect(html).toBe(
    '<section data-accordion="accordion" data-type="single"><span>Open</span></section>',
  );
});

test("generates prompt summaries for shadcn entries", () => {
  const registry = createWasserRegistry({ components: shadcnComponents });
  const summary = summarizeWasserRegistry(registry);

  expect(summary.componentCount).toBe(shadcnComponentCatalog.length);
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
      expect.objectContaining({
        type: "Sidebar",
        profile: ["shadcn", "shadcn:layout"],
      }),
    ]),
  );
});

test("supports project-local shadcn import aliases and registry targets", () => {
  const config = createShadcnAdapterConfig({
    aliases: {
      components: "@/components",
      hooks: "@/hooks/",
      lib: "@/lib/",
      ui: "@/components/ui/",
    },
  });

  expect(getShadcnImportPath(config, "button")).toBe("@/components/ui/button");
  expect(getShadcnImportPath(config, "card")).toBe("@/components/ui/card");
  expect(getShadcnImportPath(config, "alert-dialog")).toBe("@/components/ui/alert-dialog");
  expect(getShadcnImportPath(config, "calendar")).toBe("@/components/ui/calendar");
  expect(resolveShadcnRegistryTarget(config, "@ui/ai/prompt-input.tsx")).toBe(
    "@/components/ui/ai/prompt-input.tsx",
  );
  expect(resolveShadcnRegistryTarget(config, "@lib/format-date.ts")).toBe("@/lib/format-date.ts");
  expect(resolveShadcnRegistryTarget(config, "@foo/bar.ts")).toBe("foo/bar.ts");
});

test("defines shadcn registry item and index metadata", () => {
  const item = defineShadcnRegistryItem({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "customer-card",
    type: "registry:block",
    title: "Customer Card",
    registryDependencies: ["card", "badge", "@acme/customer-avatar"],
    dependencies: ["date-fns"],
    files: [
      {
        path: "registry/customer-card/customer-card.tsx",
        type: "registry:component",
        target: "@components/customer-card.tsx",
      },
    ],
    cssVars: {
      theme: {
        "font-heading": "Inter, sans-serif",
      },
    },
    css: {
      "@utility text-balance": {
        "text-wrap": "balance",
      },
    },
    envVars: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
    docs: "Install the registry dependencies before rendering this item.",
    categories: ["customers"],
  });
  const index = createShadcnRegistryIndex({
    name: "wasser-ui",
    homepage: "https://wasser-ui.test",
    items: [item],
  });

  expect(Object.isFrozen(item.registryDependencies)).toBe(true);
  expect(index).toEqual({
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "wasser-ui",
    homepage: "https://wasser-ui.test",
    items: [item],
  });
  expect(getShadcnCatalogEntry("DataTable")).toEqual(
    expect.objectContaining({
      module: "data-table",
    }),
  );
});

function expectVerified(result: ReturnType<typeof verifyDocument>) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected verified UI: ${JSON.stringify(result.diagnostics)}`);
  }

  return result.ui;
}
