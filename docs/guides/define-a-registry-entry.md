# Define a Registry Entry

A registry entry describes one component the agent may use.
It combines three concerns:

- what the component means to the agent
- what props are valid
- how verified props render in the application

Entry fields may include:

- `description`
- `propsSchema`
- `children`
- `slots`
- `examples`
- `antiExamples`
- `risk`
- `render`
- adapter binding metadata

## Minimal Entry

```ts
import { defineWaterComponent } from "@water-ui/core";
import { z } from "zod";

const CustomerTablePropsSchema = z
  .object({
    dataRef: z.literal("queries.customers.data"),
    columns: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
      }),
    ),
  })
  .strict();

const CustomerTable = defineWaterComponent({
  description: "Displays customers with status, revenue, and account owner.",
  propsSchema: CustomerTablePropsSchema,
  children: "none",
  prompt: {
    props: [
      {
        name: "dataRef",
        description: "Customer query data reference.",
        required: true,
        allowedValues: ["queries.customers.data"],
      },
      {
        name: "columns",
        description: "Visible table columns in display order.",
        required: true,
      },
    ],
  },
  examples: [
    {
      intent: "show customers in a table",
      node: {
        type: "CustomerTable",
        props: {
          dataRef: "queries.customers.data",
          columns: [{ key: "name", label: "Name" }],
        },
      },
    },
  ],
});
```

`propsSchema` is a Zod schema. The verifier enforces it with `safeParse` and
returns diagnostics for Zod issues.

## Render Binding

React render bindings belong in application code or adapter packages. They
receive verified props, runtime bindings, children, and slots:

```tsx
import type { WaterRenderBinding } from "@water-ui/react";

const renderCustomerTable = (({ props, bindings }) => {
  const rows = customerRowsSchema.parse(bindings.data[props.dataRef]);

  return <CustomerTableView columns={props.columns} rows={rows} />;
}) satisfies WaterRenderBinding<z.infer<typeof CustomerTablePropsSchema>>;
```

Then attach the binding to the entry:

```tsx
const CustomerTable = defineWaterComponent({
  description: "Displays customers with status, revenue, and account owner.",
  propsSchema: CustomerTablePropsSchema,
  children: "none",
  render: renderCustomerTable,
});
```

For React applications, prefer `.tsx` files for render bindings that return JSX.
Use `createElement` only when a file must stay framework-neutral or cannot use
JSX syntax.

## Props That Agents Can Fill

Expose props in the language of the generated UI. For example:

- `tasks`: todo items extracted from a meeting note
- `columns`: table columns in display order
- `series`: chart data series
- `actionId`: registered action invoked by a button

Avoid asking the agent to fill props that are implementation details:

- CSS class strings
- direct event handlers
- imported component names
- data that the runtime should resolve

## Children and Slots

Use `children: "none"` for leaf components. Use node children when the agent
should compose a subtree:

```ts
const AdminPage = defineWaterComponent({
  description: "Admin page shell with a title and content sections.",
  propsSchema: z.object({ title: z.string() }).strict(),
  children: { kind: "nodes", min: 1 },
});
```

Use named slots when layout regions have distinct meaning:

```ts
const DashboardLayout = defineWaterComponent({
  description: "Dashboard layout with filters, main content, and sidebar.",
  propsSchema: z.object({ title: z.string() }).strict(),
  children: "none",
  slots: {
    filters: { description: "Filter controls." },
    main: { description: "Primary dashboard content.", required: true },
    sidebar: { description: "Supporting insights." },
  },
});
```

## Entry Checklist

- The description says what the component does, not what library implements it.
- The props schema is strict.
- Prompt props explain exactly what the agent fills.
- Examples use realistic product data.
- Runtime references use registered IDs.
- Render bindings parse runtime data before passing it to UI components.

## Related Reference

- [Registry API](../reference/registry-api.md)
- [Verified Schema UI](../reference/verified-schema-ui.md)
- [Diagnostics](../reference/diagnostics.md)
