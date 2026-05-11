# @water-ui/adapter-shadcn

Optional shadcn registry adapter.

Gate: 5.

Responsibilities:

- shadcn component registry entries
- shadcn render bindings
- shadcn prompt examples
- shadcn fallback components
- shadcn install and config helpers

shadcn is an adapter, not the Water core abstraction.

## Usage

```ts
import { createWaterRegistry } from "@water-ui/core";
import { shadcnComponents } from "@water-ui/adapter-shadcn";

const registry = createWaterRegistry({
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
