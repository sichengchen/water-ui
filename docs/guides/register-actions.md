# Register Actions

Status: available in Gate 6.

The model may reference actions. The application implements actions.

Runtime target:

```ts
import { createWaterRuntime } from "@water-ui/runtime";
import { z } from "zod";

const runtime = createWaterRuntime({
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

Schema UI reference:

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

Execution:

```ts
await runtime.runAction("exportCustomers", {});
```

The runtime emits `runtime.action.run` for successful actions and
`runtime.block` for unknown or permission-denied actions.
