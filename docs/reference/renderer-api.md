# Renderer API Reference

React API target:

```tsx
<WasserRuntimeProvider runtime={runtime} registry={registry}>
  <WasserRenderer ui={verifiedUi} />
</WasserRuntimeProvider>
```

Vue API target:

```ts
import { h } from "vue";

h(WasserRuntimeProvider, { runtime, registry }, () => h(WasserRenderer, { ui: verifiedUi }));
```

Svelte API target:

```svelte
<script lang="ts">
  import { createWasserRenderer } from "@wasser-ui/svelte";

  const renderer = createWasserRenderer({ ui: verifiedUi, runtime, registry });
</script>

{@render renderer()}
```

Angular API target:

```ts
import { provideWasserRuntime } from "@wasser-ui/angular";

bootstrapApplication(AppComponent, {
  providers: [provideWasserRuntime({ runtime, registry })],
});
```

```html
<wasser-renderer [ui]="verifiedUi" />
```

React and Vue renderer components:

- `WasserRenderer`
- `WasserStreamRenderer`
- `WasserRuntimeProvider`
- `NodeRenderer`
- `SlotRenderer`

Angular renderer components and helpers:

- `WasserRendererComponent`
- `WasserStreamRendererComponent`
- `NodeRendererComponent`
- `SlotRendererComponent`
- `WasserOutletComponent`
- `provideWasserRuntime`
- `wasserComponent`

Svelte renderer helpers:

- `createWasserRenderer`
- `createWasserStreamRenderer`
- `createNodeRenderer`
- `createSlotRenderer`
- `renderWasserToHtml`
- `renderWasserStreamToHtml`
- `renderWasserNodeToHtml`
- `renderWasserSlotToHtml`
- `wasserComponent`
- `wasserElement`
- `wasserRawHtml`

Renderer input is VerifiedSchemaUI.

Registry render bindings receive:

- verified props
- recursive `children`
- named `slots`
- runtime data/action `bindings`
- `renderNode` and `renderSlot` helpers

Renderer diagnostics are reported through `onDiagnostics`, and fallback output
uses safe framework elements instead of raw HTML.
