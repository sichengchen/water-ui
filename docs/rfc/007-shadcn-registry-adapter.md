# RFC 007: shadcn Registry Adapter

The shadcn adapter contains shadcn component registry definitions and render
bindings.

Package:

```txt
@wasser-ui/adapter-shadcn
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
import { createWasserRegistry } from "@wasser-ui/core";
import { shadcnComponents } from "@wasser-ui/adapter-shadcn";

const registry = createWasserRegistry({
  components: {
    ...shadcnComponents,
    CustomerTable,
    RevenueChart,
  },
});
```

shadcn definitions live in the adapter. Wasser core has no shadcn definitions and
does not use shadcn as its identity.
