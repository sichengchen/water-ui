# @wasser-ui/svelte

Svelte renderer package for `VerifiedSchemaUI`.

This package provides:

- `createWasserRenderer`
- `createWasserStreamRenderer`
- `createNodeRenderer`
- `createSlotRenderer`
- `createWasserRuntime`
- `renderWasserToHtml`
- `wasserComponent`
- `wasserElement`
- `wasserRawHtml`
- recursive node and slot rendering
- runtime data and action binding
- Svelte component bindings for app-owned components
- render diagnostics
- safe fallback rendering

`@wasser-ui/svelte` renders verified UI only. Pass raw model output through
`@wasser-ui/core` verification before rendering.
