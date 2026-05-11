# RFC 007: shadcn Registry Adapter

The shadcn adapter contains shadcn component registry definitions and render
bindings.

Package:

```txt
@water-ui/adapter-shadcn
```

The adapter may expose:

- `shadcnComponents`
- shadcn render bindings
- shadcn prompt examples
- shadcn registry fixtures
- fallback components
- install and config helpers

Usage:

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

shadcn definitions live in the adapter. Water core has no shadcn definitions and
does not use shadcn as its identity.
