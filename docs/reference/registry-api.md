# Registry API Reference

Package: `@water-ui/core`

Implemented Gate 1 exports:

- `defineWaterComponent`
- `createWaterRegistry`
- `mergeWaterRegistries`
- `getWaterComponent`
- `listWaterComponents`
- `selectWaterRegistryEntries`
- `summarizeWaterRegistry`
- `serializePromptSafeRegistryDescription`

Registry contract:

- Input components may be keyed object entries or entry arrays.
- Duplicate component types produce diagnostics.
- Empty component types produce diagnostics.
- Registry summaries exclude render bindings and raw schema objects.
- Empty registries are valid and prove core has no Water-owned visual
  components.
