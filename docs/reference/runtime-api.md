# Runtime API Reference

Status: planned for Gate 6.

Runtime target:

```ts
type WaterRuntime = {
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
