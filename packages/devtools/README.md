# @water-ui/devtools

DevTools package.

Gate: 10.

Responsibilities:

- registry inspector
- Schema UI inspector
- VerifiedSchemaUI inspector
- validation viewer
- patch history viewer
- stream event viewer
- runtime event viewer
- prompt viewer
- render binding viewer

## Usage

```ts
import { createDevToolsInspection } from "@water-ui/devtools";

const inspection = createDevToolsInspection({
  registry,
  rawSchemaUI,
  verifiedUI,
  diagnostics,
  patchHistory,
  streamState,
  runtimeEvents,
  prompts: {
    system,
  },
  renderTraces,
});
```

The package returns serializable panel models that can be rendered by any
application shell. Inspectors do not mutate runtime state.

Public APIs:

- `createDevToolsInspection`
- `inspectRegistry`
- `inspectSchemaUI`
- `inspectVerifiedSchemaUI`
- `inspectDiagnostics`
- `inspectPatchHistory`
- `inspectStream`
- `inspectRuntimeEvents`
- `inspectPrompts`
- `inspectRenderBindings`
- `createDebugEventBus`
