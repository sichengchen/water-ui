# Gate 1 Task: Registry API

Status: completed

Objective: create the registry foundation that every later gate consumes.

Inputs:

- Component registry definitions
- Adapter registry presets
- Optional profile selector

Outputs:

- Water registry object
- Registry diagnostics
- Prompt-safe registry summaries

Public API:

- `defineWaterComponent`
- `createWaterRegistry`
- `mergeWaterRegistries`
- `getWaterComponent`
- `listWaterComponents`
- `selectWaterRegistryEntries`
- `summarizeWaterRegistry`
- `serializePromptSafeRegistryDescription`

Forbidden behavior:

- Do not define Water-owned visual components in core.
- Do not import React.
- Do not import shadcn.
- Do not call render functions during registry creation.

Acceptance tests:

- [x] Can create a registry.
- [x] Can define frozen registry entries.
- [x] Can merge presets in stable order.
- [x] Can detect duplicate types.
- [x] Can detect mismatched keyed component types.
- [x] Can report invalid entries without throwing.
- [x] Can summarize prompt-safe entries.
- [x] Can select by profile.
- [x] Empty core registry has zero components.

Implemented files:

- `packages/core/src/index.ts`
- `packages/core/fixtures/registry.ts`
- `packages/core/tests/registry.test.ts`
