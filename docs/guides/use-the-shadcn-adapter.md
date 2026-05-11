# Use the shadcn Adapter

Status: planned for Gate 5.

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
