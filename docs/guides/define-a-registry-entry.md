# Define a Registry Entry

A registry entry describes one component the agent may use.

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

Example:

```ts
const CustomerTable = defineWaterComponent({
  description: "Displays customers with status, revenue, and account owner.",
  propsSchema: CustomerTablePropsSchema,
  children: "none",
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

The entry describes what is allowed. The verifier enforces it.
