# RFC 005: Component Registry

The component registry is developer-defined.

It describes what agents may use and how Water should verify, render, stream,
patch, and prompt that UI.

Registry entries may include:

- type
- description
- props schema
- children policy
- slot policy
- data binding policy
- action binding policy
- state binding policy
- prompt examples
- anti-examples
- risk metadata
- render function
- adapter binding
- fallback behavior

Minimal example:

```ts
const registry = createWaterRegistry({
  components: {
    CustomerTable: defineWaterComponent({
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
      render: ({ props, runtime }) => {
        return (
          <CustomerTable
            data={runtime.resolve(props.dataRef)}
            columns={props.columns}
          />
        );
      },
    }),
  },
});
```

Water core owns registry mechanics. User applications and adapters own component
definitions.
