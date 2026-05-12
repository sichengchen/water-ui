# Use the shadcn Adapter

The shadcn adapter provides optional registry entries and render bindings.

Use it when an application wants generated UI to compose standard shadcn-backed
components while Water core remains component-library-neutral.

## Merge Adapter Entries

```ts
import { createWaterRegistry } from "@water-ui/core";
import { shadcnComponents } from "@water-ui/adapter-shadcn";

const registry = createWaterRegistry({
  components: {
    ...shadcnComponents,
    CustomerTable,
    RevenueChart,
  },
});
```

## Rules

- shadcn entries live in `@water-ui/adapter-shadcn`.
- User entries live in the application registry.
- Water core does not import shadcn.
- Prompt summaries are generated from the merged registry.

## Bind Project-Local Components

To use project-local shadcn source components, pass them to the binding factory:

```ts
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShadcnComponents } from "@water-ui/adapter-shadcn";

const shadcnComponents = createShadcnComponents({
  components: {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  },
});
```

This keeps imports controlled by the application. The adapter describes the
Water contract and calls the bound components at render time.

## Import Alias Helpers

The adapter also exposes import alias helpers for tools that need to describe
where project-local shadcn modules live:

```ts
import {
  createShadcnAdapterConfig,
  getShadcnImportPath,
  resolveShadcnRegistryTarget,
} from "@water-ui/adapter-shadcn";

const config = createShadcnAdapterConfig({
  aliases: {
    components: "@/components",
    hooks: "@/hooks",
    lib: "@/lib",
    ui: "@/components/ui",
  },
});

getShadcnImportPath(config, "button"); // "@/components/ui/button"
getShadcnImportPath(config, "alert-dialog"); // "@/components/ui/alert-dialog"
resolveShadcnRegistryTarget(config, "@ui/ai/prompt-input.tsx");
// "@/components/ui/ai/prompt-input.tsx"
```

## Component Coverage

`shadcnComponents` includes registry entries for the full shadcn/ui catalog.
Components with Water-specific behavior, such as `Button`, `Card`, `Alert`,
`Input`, and `Badge`, keep strict prop validation. Other shadcn entries accept
project-local props and render through the component binding passed to
`createShadcnComponents`.

## Registry Publishing Metadata

For shadcn registry publishing metadata, use `defineShadcnRegistryItem` and
`createShadcnRegistryIndex`. These helpers model the current shadcn
`registry-item.json` and `registry.json` fields, including `files`,
`registryDependencies`, `dependencies`, `devDependencies`, `cssVars`, `css`,
`envVars`, `docs`, `categories`, and `meta`.

## Practical Guidance

Use shadcn entries for general UI primitives and application entries for domain
objects. For example, prefer a product-level `CustomerTable` entry over asking
the agent to assemble a table from low-level cells for every response.

Generated UI should stay close to the user intent. The application can still use
normal React and shadcn outside the generated Water subtree.

## Related Reference

- [Registry API](../reference/registry-api.md)
- [Renderer API](../reference/renderer-api.md)
- [Create a Custom Adapter](./create-a-custom-adapter.md)
