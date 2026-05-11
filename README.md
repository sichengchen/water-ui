# Water UI

Water UI is a registry-first Generative UI library for agent-driven applications.

Developers expose their own components through a registry. Water uses that
registry to compile prompts, verify model-generated Schema UI, render only
verified UI, and support patches and streaming updates.

Water core is component-library-neutral. shadcn is planned as the first adapter,
not the core abstraction.

## Development

- Install dependencies:

```bash
vp install
```

- Check, test, and build:

```bash
vp run ready
```

## Implementation Gates

Completed gates:

- Gate 1: Registry API
- Gate 2: Schema UI Protocol
- Gate 3: Verification
- Gate 4: React Renderer
- Gate 5: shadcn Registry Adapter
- Gate 6: Runtime
- Gate 7: Semantic Patch
- Gate 8: Streaming
- Gate 9: Prompt Compiler
- Gate 10: DevTools

Implemented now:

- `@water-ui/core`
- `defineWaterComponent`
- `createWaterRegistry`
- registry merge diagnostics
- prompt-safe registry summaries
- profile-aware registry selection
- Schema UI document parsing and normalization
- semantic patch parsing
- JSONL stream event parsing
- protocol fixtures and diagnostics
- registry-aware Schema UI verification
- VerifiedSchemaUI branding
- verification fixtures and diagnostics
- React renderer for VerifiedSchemaUI
- recursive node and slot rendering
- registry render bindings
- runtime data/action binding helpers
- render diagnostics and safe fallbacks
- optional shadcn registry entries
- shadcn render binding factory
- shadcn prompt examples
- shadcn project-local import alias helpers
- runtime state, query, action, and mutation registries
- runtime permission guard and event log
- safe data/action/mutation execution boundary
- semantic patch application
- patch diagnostics and history
- JSONL stream state engine
- progressive verified UI snapshots
- stream buffering and diagnostics
- registry/runtime prompt compiler
- document, patch, stream, and repair prompt modes
- prompt golden fixtures
- DevTools inspection panels
- debug event protocol

Intentionally not implemented yet:

- eval harness
