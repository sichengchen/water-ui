# @water-ui/core

Core registry, protocol, verification, patch, streaming, and safety primitives.

Current status: Gates 1, 2, 3, and 7 complete.

Implemented:

- `defineWaterComponent`
- `createWaterRegistry`
- `mergeWaterRegistries`
- registry lookup/listing
- profile-aware entry selection
- prompt-safe registry summaries
- registry diagnostics
- registry fixtures
- `parseSchemaUIDocument`
- `parseSchemaUIPatch`
- `parseSchemaUIStreamEvent`
- `normalizeSchemaUIDocument`
- protocol fixtures and diagnostics
- `verifyDocument`
- `VerifiedSchemaUI`
- `applyPatch`
- `validatePatch`
- `createPatchHistory`
- patch diagnostics
- patch history entries

Core must not contain Water-owned visual component definitions.
