# Registry API Reference

Package: `@wasser-ui/core`

Public exports:

- `defineWasserComponent`
- `createWasserRegistry`
- `mergeWasserRegistries`
- `getWasserComponent`
- `listWasserComponents`
- `selectWasserRegistryEntries`
- `summarizeWasserRegistry`
- `serializePromptSafeRegistryDescription`

Registry contract:

- Input components may be keyed object entries or entry arrays.
- Component `propsSchema` values are Zod schemas.
- Duplicate component types produce diagnostics.
- Keyed entries with a mismatched declared `type` produce diagnostics.
- Missing descriptions produce diagnostics.
- Invalid children and slot policies produce diagnostics.
- Empty component types produce diagnostics.
- Registry summaries exclude render bindings and raw schema objects.
- Registry summaries may include prompt-safe prop hints, notes, examples, and
  anti-examples.
- Empty registries are valid and prove core has no Wasser-owned visual
  components.

Registry diagnostic codes:

- `duplicate_component_type`
- `empty_component_type`
- `invalid_component_entry`
- `component_type_mismatch`
- `missing_component_description`
- `invalid_children_policy`
- `invalid_slot_policy`
