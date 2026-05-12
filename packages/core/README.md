# @wasser-ui/core

Core registry, protocol, verification, patch, streaming, and safety primitives.

Core includes:

- `defineWasserComponent`
- `createWasserRegistry`
- `mergeWasserRegistries`
- registry lookup, listing, profile selection, diagnostics, and prompt-safe
  summaries
- `parseSchemaUIDocument`
- `parseSchemaUIPatch`
- `parseSchemaUIStreamEvent`
- `normalizeSchemaUIDocument`
- `verifyDocument`
- `VerifiedSchemaUI`
- `applyPatch`
- `validatePatch`
- `createPatchHistory`
- `parseStreamEvent`
- `createStreamState`
- `applyStreamEvent`
- `finalizeStreamState`

Core must not contain Wasser-owned visual component definitions. Component
definitions belong in application registries or adapter packages.
