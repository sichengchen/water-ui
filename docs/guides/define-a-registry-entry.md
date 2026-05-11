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
import { z } from "zod";

const CustomerTablePropsSchema = z
  .object({
    dataRef: z.string(),
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
