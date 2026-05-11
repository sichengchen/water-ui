# @water-ui/core

Core registry, protocol, verification, patch, streaming, and safety primitives.

Core includes:

- `defineWaterComponent`
- `createWaterRegistry`
- `mergeWaterRegistries`
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

Core must not contain Water-owned visual component definitions. Component
definitions belong in application registries or adapter packages.
