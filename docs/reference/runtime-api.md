# Runtime API Reference

Runtime target:

```ts
type WasserRuntime = {
  state: StateRegistry;
  queries: QueryRegistry;
  mutations: MutationRegistry;
  actions: ActionRegistry;
  permissions: PermissionGuard;
  telemetry: TelemetrySink;
  events: RuntimeEventBus;
};
```

The model references runtime IDs. Application code registers and implements
runtime behavior.

## Create a Runtime

```ts
import { createWasserRuntime } from "@wasser-ui/runtime";

const runtime = createWasserRuntime({
  permissions: {
    canRunAction: ({ risk }) => risk !== "destructive",
  },
});
```

## Register Capabilities

```ts
runtime.state.register({
  key: "filters.status",
  initialValue: "all",
});

runtime.queries.register({
  id: "customers",
  dataRef: "queries.customers.data",
  handler: async () => api.customers.list(),
});

runtime.actions.register({
  id: "exportCustomers",
  risk: "low",
  handler: async () => api.customers.export(),
});

runtime.mutations.register({
  id: "deleteCustomer",
  risk: "destructive",
  handler: async ({ customerId }) => api.customers.delete(customerId),
});
```

## Verification Description

```ts
runtime.describe();
```

Returns:

```ts
{
  actions: ["exportCustomers"],
  dataRefs: ["queries.customers.data"],
  stateKeys: ["filters.status"]
}
```

Pass this to `verifyDocument` as the runtime capability description.

## Execution Boundary

Use `runtime.resolveData(dataRef)`, `runtime.runAction(actionId, payload)`, and
`runtime.runMutation(mutationId, payload)`. Unknown capabilities throw
`WasserRuntimeError` and emit `runtime.block` events.
