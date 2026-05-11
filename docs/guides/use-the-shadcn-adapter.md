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
import { createShadcnAdapterConfig, getShadcnImportPath } from "@water-ui/adapter-shadcn";

const config = createShadcnAdapterConfig({
  aliases: {
    ui: "@/components/ui",
  },
});

getShadcnImportPath(config, "button"); // "@/components/ui/button"
```
