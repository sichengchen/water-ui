# Register Actions

The model may reference actions. The application implements actions.
Actions are runtime capabilities, not model-defined behavior. A generated node
may carry an `actionId`, but the handler, permissions, payload validation, and
side effects live in application code.

## Register the Runtime Action

```ts
import { createWasserRuntime } from "@wasser-ui/runtime";
import { z } from "zod";

const runtime = createWasserRuntime({
  permissions: {
    canRunAction: ({ risk }) => risk !== "destructive",
  },
});

runtime.actions.register({
  id: "exportCustomers",
  label: "Export customers",
  risk: "low",
  inputSchema: z.object({}).optional(),
  handler: async () => {
    return api.customers.export();
  },
});
```

## Expose the Action Through a Component

The registry entry should describe the prop that carries the action reference:

```ts
const ExportButton = defineWasserComponent({
  description: "Button that exports the current customer list.",
  propsSchema: z
    .object({
      label: z.string(),
      actionId: z.literal("exportCustomers"),
    })
    .strict(),
  children: "none",
  prompt: {
    props: [
      {
        name: "label",
        description: "Button label.",
        required: true,
      },
      {
        name: "actionId",
        description: "Customer export action.",
        required: true,
        allowedValues: ["exportCustomers"],
      },
    ],
  },
});
```

Generated Schema UI can then reference the registered action:

```json
{
  "type": "ExportButton",
  "props": {
    "label": "Export customers",
    "actionId": "exportCustomers"
  }
}
```

Unknown actions are blocked by verification or runtime guards.

## Invoke the Action From a Render Binding

Render bindings receive action bindings after Wasser resolves runtime
references:

```tsx
const renderExportButton = (({ props, bindings }) => {
  return <Button onClick={() => bindings.actions[props.actionId]?.({})}>{props.label}</Button>;
}) satisfies WasserRenderBinding<ExportButtonProps>;
```

The renderer checks that referenced actions exist in the current runtime. The
handler still controls the actual side effect.

## Direct Execution

```ts
await runtime.runAction("exportCustomers", {});
```

The runtime emits `runtime.action.run` for successful actions and
`runtime.block` for unknown or permission-denied actions.

## Permissions and Risk

Use action metadata and runtime permissions for sensitive operations:

```ts
const runtime = createWasserRuntime({
  permissions: {
    canRunAction: ({ risk }) => risk !== "destructive",
  },
});

runtime.actions.register({
  id: "deleteCustomer",
  label: "Delete customer",
  risk: "destructive",
  inputSchema: z.object({ customerId: z.string() }),
  handler: async ({ customerId }) => api.customers.delete(customerId),
});
```

Use a confirmation UI in application code before invoking destructive actions.
Wasser verifies references; it does not decide product policy by itself.

## Checklist

- Register every action the model may reference.
- Validate action payloads with `inputSchema`.
- Use narrow `allowedValues` in prompt metadata when a component supports a
  fixed action.
- Keep side effects inside runtime handlers.
- Treat destructive actions as a separate product flow with explicit user
  confirmation.

## Related Reference

- [Runtime API](../reference/runtime-api.md)
- [Renderer API](../reference/renderer-api.md)
- [Diagnostics](../reference/diagnostics.md)
