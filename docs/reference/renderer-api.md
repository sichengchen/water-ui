# Renderer API Reference

React API target:

```tsx
<WaterRuntimeProvider runtime={runtime} registry={registry}>
  <WaterRenderer ui={verifiedUi} />
</WaterRuntimeProvider>
```

Vue API target:

```ts
import { h } from "vue";

h(WaterRuntimeProvider, { runtime, registry }, () => h(WaterRenderer, { ui: verifiedUi }));
```

Svelte API target:

```svelte
<script lang="ts">
  import { createWaterRenderer } from "@water-ui/svelte";

  const renderer = createWaterRenderer({ ui: verifiedUi, runtime, registry });
</script>

{@render renderer()}
```

Angular API target:

```ts
import { provideWaterRuntime } from "@water-ui/angular";

bootstrapApplication(AppComponent, {
  providers: [provideWaterRuntime({ runtime, registry })],
});
```

```html
<water-renderer [ui]="verifiedUi" />
```

React and Vue renderer components:

- `WaterRenderer`
- `WaterStreamRenderer`
- `WaterRuntimeProvider`
- `NodeRenderer`
- `SlotRenderer`

Angular renderer components and helpers:

- `WaterRendererComponent`
- `WaterStreamRendererComponent`
- `NodeRendererComponent`
- `SlotRendererComponent`
- `WaterOutletComponent`
- `provideWaterRuntime`
- `waterComponent`

Svelte renderer helpers:

- `createWaterRenderer`
- `createWaterStreamRenderer`
- `createNodeRenderer`
- `createSlotRenderer`
- `renderWaterToHtml`
- `renderWaterStreamToHtml`
- `renderWaterNodeToHtml`
- `renderWaterSlotToHtml`
- `waterComponent`
- `waterElement`
- `waterRawHtml`

Renderer input is VerifiedSchemaUI.

Registry render bindings receive:

- verified props
- recursive `children`
- named `slots`
- runtime data/action `bindings`
- `renderNode` and `renderSlot` helpers

Renderer diagnostics are reported through `onDiagnostics`, and fallback output
uses safe framework elements instead of raw HTML.
