# @water-ui/svelte

Svelte renderer package for `VerifiedSchemaUI`.

This package provides:

- `createWaterRenderer`
- `createWaterStreamRenderer`
- `createNodeRenderer`
- `createSlotRenderer`
- `createWaterRuntime`
- `renderWaterToHtml`
- `waterComponent`
- `waterElement`
- `waterRawHtml`
- recursive node and slot rendering
- runtime data and action binding
- Svelte component bindings for app-owned components
- render diagnostics
- safe fallback rendering

`@water-ui/svelte` renders verified UI only. Pass raw model output through
`@water-ui/core` verification before rendering.
