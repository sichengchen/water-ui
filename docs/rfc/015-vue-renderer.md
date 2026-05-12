# RFC 015: Vue Renderer

Vue is a renderer target for Wasser.

The Vue renderer renders only VerifiedSchemaUI:

```ts
h(WasserRuntimeProvider, { runtime, registry }, () => h(WasserRenderer, { ui: verifiedUi }));
```

Renderer responsibilities:

- Read VerifiedSchemaUI.
- Resolve the root node.
- Look up the registry entry for each node.
- Render through registry render functions or adapter bindings.
- Render children recursively.
- Render named slots.
- Resolve runtime data refs.
- Bind registered actions.
- Apply permission guards.
- Render safe fallbacks for missing runtime data.
- Emit diagnostics and telemetry.

Renderer must not:

- Execute model-generated code.
- Import components from model output.
- Trust unverified props.
- Call arbitrary URLs.
- Accept arbitrary event handlers.
- Render raw HTML by default.
- Accept arbitrary `class` by default.
