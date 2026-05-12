# RFC 016: Svelte Renderer

Svelte is a renderer target for Water.

The Svelte renderer renders only VerifiedSchemaUI:

```svelte
<script lang="ts">
  import { createWaterRenderer } from "@water-ui/svelte";

  const renderer = createWaterRenderer({ ui: verifiedUi, runtime, registry });
</script>

{@render renderer()}
```

Server rendering can use the same contract directly:

```ts
import { renderWaterToHtml } from "@water-ui/svelte";

const html = renderWaterToHtml({ ui: verifiedUi, runtime, registry });
```

Renderer responsibilities:

- Read VerifiedSchemaUI.
- Resolve the root node.
- Look up the registry entry for each node.
- Render through registry render functions or adapter bindings.
- Support app-owned Svelte components returned through `waterComponent`.
- Render children recursively.
- Render named slots.
- Resolve runtime data refs.
- Bind registered actions.
- Apply permission guards.
- Render safe fallbacks for missing runtime data.
- Emit diagnostics and telemetry.
- Escape text and attributes by default.

Renderer must not:

- Execute model-generated code.
- Import components from model output.
- Trust unverified props.
- Call arbitrary URLs.
- Accept arbitrary event handlers.
- Render raw HTML by default.
- Accept arbitrary `class` by default.
