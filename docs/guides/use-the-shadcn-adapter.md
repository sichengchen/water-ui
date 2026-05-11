# Use the shadcn Adapter

The shadcn adapter provides optional registry entries and render bindings.

Usage target:

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

Rules:

- shadcn entries live in `@water-ui/adapter-shadcn`.
- User entries live in the application registry.
- Water core does not import shadcn.
- Prompt summaries are generated from the merged registry.

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

`shadcnComponents` includes registry entries for the full shadcn/ui catalog.
Components with Water-specific behavior, such as `Button`, `Card`, `Alert`,
`Input`, and `Badge`, keep strict prop validation. Other shadcn entries accept
project-local props and render through the component binding passed to
`createShadcnComponents`.

For shadcn registry publishing metadata, use `defineShadcnRegistryItem` and
`createShadcnRegistryIndex`. These helpers model the current shadcn
`registry-item.json` and `registry.json` fields, including `files`,
`registryDependencies`, `dependencies`, `devDependencies`, `cssVars`, `css`,
`envVars`, `docs`, `categories`, and `meta`.
