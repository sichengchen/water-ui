# Gate 1 Task: Registry API

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

- Can create a registry.
- Can merge presets.
- Can detect duplicate types.
- Can summarize prompt-safe entries.
- Can select by profile.
- Empty core registry has zero components.
