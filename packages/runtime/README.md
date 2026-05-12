# @wasser-ui/runtime

Runtime capability system for Wasser UI applications.

This package provides:

- state registry
- query registry
- action registry
- mutation registry
- permission guard
- telemetry sink
- runtime event log
- data binding resolver

The model references capabilities. Application code implements them.

## Usage

```ts
import { createWasserRuntime } from "@wasser-ui/runtime";

const runtime = createWasserRuntime({
  permissions: {
    canRunAction: ({ risk }) => risk !== "destructive",
  },
});

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

runtime.describe();
```

`runtime.describe()` returns the capability lists used by Wasser verification.
Unknown actions, queries, mutations, and state keys are blocked before
execution.
