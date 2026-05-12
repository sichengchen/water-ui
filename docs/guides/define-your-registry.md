# Define Your Registry

The registry is the source of truth for what an agent may generate.
It should describe application concepts, not low-level UI implementation
details. A good registry gives the model enough information to fill component
props correctly and gives Water enough structure to verify the result before
rendering.

Use `createWaterRegistry` with user-owned component entries:

```ts
import { createWaterRegistry } from "@water-ui/core";
import { CustomerTable } from "./components/customer-table.water";
import { ExportCustomersButton } from "./components/export-customers-button.water";
import { RevenueChart } from "./components/revenue-chart.water";

const registry = createWaterRegistry({
  components: {
    CustomerTable,
    RevenueChart,
    ExportButton,
  },
});
```

## What Belongs in a Registry

Register components that are meaningful units in the product:

- `CustomerTable`
- `RevenueChart`
- `InvoiceTimeline`
- `MeetingTaskList`
- `ExportCustomersButton`

Avoid exposing implementation pieces directly unless the agent genuinely needs
to compose them:

- raw `div`, `span`, or HTML tags
- arbitrary `className`
- raw component-library prop surfaces
- internal layout wrappers that users never think about

Water is registry-first because the registry is both the prompt contract and the
verification contract. If a component is missing from the registry, generated UI
cannot use it. If a prop is missing from the schema, generated UI cannot pass it.

## Registry Design Checklist

- Use product-specific component names when those are the application concepts.
- Keep the first version small enough to review.
- Define strict props schemas for values the agent fills.
- Use examples to show realistic generated nodes.
- Add runtime references such as `actionId`, `dataRef`, or `stateKey` only when
  the component actually needs them.
- Keep visual implementation in render bindings, application components, or
  adapter packages.

## Runtime Capabilities

The registry says which components exist. The runtime says which capabilities
exist at render or action time:

```ts
import { createWaterRuntime } from "@water-ui/runtime";

const runtime = createWaterRuntime();

runtime.queries.register({
  id: "customers",
  dataRef: "queries.customers.data",
  handler: async () => api.customers.list(),
});

runtime.actions.register({
  id: "exportCustomers",
  label: "Export customers",
  handler: async () => api.customers.export(),
});
```

Pass the same registry and runtime description to prompt compilation and
verification:

```ts
const prompt = compileDocumentPrompt({
  registry,
  runtime: runtime.describe(),
  userIntent: "Show active customers and export controls.",
});

const verification = verifyDocument(modelOutput, {
  registry,
  runtime: runtime.describe(),
});
```

This keeps generation and verification aligned. The model sees the same
component and runtime vocabulary that Water later enforces.

## When to Split a Registry

Keep one registry per application surface when the available components differ
by context. For example, an admin dashboard and a public onboarding flow may
have different registries even if they share the same React app.

Use adapter packages for reusable component-library mappings, and merge them
with application-specific components at the boundary:

```ts
const registry = createWaterRegistry({
  components: {
    ...shadcnComponents,
    CustomerTable,
    RevenueChart,
  },
});
```

## Related Reference

- [Registry API](../reference/registry-api.md)
- [Runtime API](../reference/runtime-api.md)
- [Prompt API](../reference/prompt-api.md)
