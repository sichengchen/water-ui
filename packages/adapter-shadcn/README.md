# @wasser-ui/adapter-shadcn

Optional shadcn registry adapter for Wasser UI.

This package provides:

- shadcn component registry entries for the full shadcn/ui catalog
- shadcn render bindings
- shadcn prompt examples
- shadcn fallback components
- shadcn import alias helpers
- shadcn registry item and registry index metadata helpers

shadcn is an adapter, not the Wasser core abstraction.

## Usage

```ts
import { createWasserRegistry } from "@wasser-ui/core";
import { shadcnComponents } from "@wasser-ui/adapter-shadcn";

const registry = createWasserRegistry({
  components: {
    ...shadcnComponents,
    CustomerTable,
  },
});
```

For project-local shadcn components, bind the adapter to the host app modules:

```ts
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { createShadcnComponents } from "@wasser-ui/adapter-shadcn";

const shadcnComponents = createShadcnComponents({
  components: {
    Accordion,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  },
});
```

The adapter includes generic Wasser registry entries for every shadcn/ui catalog
component, including components such as `Accordion`, `Dialog`, `Sidebar`,
`Chart`, `Table`, `Calendar`, `Command`, `ToggleGroup`, and `DataTable`.
Specialized entries such as `Button`, `Card`, `Alert`, `Input`, and `Badge`
keep tighter prop validation and Wasser runtime behavior.

## Registry metadata

Use the registry metadata helpers when publishing shadcn-compatible registry
items:

```ts
import { createShadcnRegistryIndex, defineShadcnRegistryItem } from "@wasser-ui/adapter-shadcn";

const item = defineShadcnRegistryItem({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "customer-card",
  type: "registry:block",
  registryDependencies: ["card", "badge"],
  files: [
    {
      path: "registry/customer-card/customer-card.tsx",
      type: "registry:component",
      target: "@components/customer-card.tsx",
    },
  ],
});

const registry = createShadcnRegistryIndex({
  name: "wasser-ui",
  homepage: "https://example.com",
  items: [item],
});
```

For tools that need to resolve registry file targets against `components.json`
aliases, use `resolveShadcnRegistryTarget`:

```ts
import { createShadcnAdapterConfig, resolveShadcnRegistryTarget } from "@wasser-ui/adapter-shadcn";

const config = createShadcnAdapterConfig({
  aliases: {
    components: "@/components",
    hooks: "@/hooks",
    lib: "@/lib",
    ui: "@/components/ui",
  },
});

resolveShadcnRegistryTarget(config, "@ui/ai/prompt-input.tsx");
// "@/components/ui/ai/prompt-input.tsx"
```
