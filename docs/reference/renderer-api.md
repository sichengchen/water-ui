# Renderer API Reference

Status: implemented in Gate 4.

React API target:

```tsx
<WaterRuntimeProvider runtime={runtime} registry={registry}>
  <WaterRenderer ui={verifiedUi} />
</WaterRuntimeProvider>
```

Renderer components:

- `WaterRenderer`
- `WaterStreamRenderer`
- `WaterRuntimeProvider`
- `NodeRenderer`
- `SlotRenderer`

Renderer input is VerifiedSchemaUI.

Registry render bindings receive:

- verified props
- recursive `children`
- named `slots`
- runtime data/action `bindings`
- `renderNode` and `renderSlot` helpers

Renderer diagnostics are reported through `onDiagnostics`, and fallback output
uses safe React elements instead of raw HTML.
