# RFC 008: Runtime Contract

The runtime is the production boundary between generated UI and real
application behavior.

The model may reference runtime capabilities. The model may not define them.

Runtime shape:

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

Runtime capabilities:

- State registry
- Query registry
- Action registry
- Mutation registry
- Permission guard
- Telemetry sink
- Runtime event log
- Data binding resolver

Hard rule:

```txt
Agent output references capabilities.
Application code implements capabilities.
Water verifies and guards references.
```
