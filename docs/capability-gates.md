# Capability Gates

Water uses capability gates instead of a date-based roadmap.

Each gate requires:

- Contract
- Fixtures
- Implementation tasks
- Acceptance tests
- Failure cases
- Diagnostics
- Agent instructions

## Gate 1: Registry API

Status: completed

Acceptance criteria:

- [x] Can create a component registry.
- [x] Can define registry entries.
- [x] Can merge registry presets.
- [x] Can validate duplicate type names.
- [x] Can expose registry summaries.
- [x] Can select registry entries by profile.
- [x] Can serialize prompt-safe registry descriptions.
- [x] Core includes no Water-owned visual component definitions.

Deliverables:

- `@water-ui/core` registry API
- `defineWaterComponent`
- `createWaterRegistry`
- registry merge utilities
- registry fixtures
- registry diagnostics

Completion evidence:

- implementation: `packages/core/src/index.ts`
- fixtures: `packages/core/fixtures/registry.ts`
- tests: `packages/core/tests/registry.test.ts`

## Gate 2: Schema UI Protocol

Status: completed

Acceptance criteria:

- [x] Can parse `water.ui.document`.
- [x] Can parse `water.ui.patch`.
- [x] Can parse JSONL stream events.
- [x] Can reject invalid protocol versions.
- [x] Can normalize valid protocol input.
- [x] Can emit structured diagnostics.
- [x] Can run protocol fixtures in CI.

Deliverables:

- `schema_ui_v1.md`
- document fixtures
- patch fixtures
- stream fixtures
- invalid fixtures

Completion evidence:

- implementation: `packages/core/src/protocol.ts`
- fixtures: `docs/fixtures/protocol/`
- tests: `packages/core/tests/protocol.test.ts`

## Gate 3: Verification

Status: completed

Acceptance criteria:

- [x] Can verify document shape.
- [x] Can verify root and node map.
- [x] Can verify children references.
- [x] Can verify slot references.
- [x] Can reject unknown component types.
- [x] Can validate props against registry schemas.
- [x] Can validate action IDs against runtime registry.
- [x] Can validate data refs against runtime registry.
- [x] Can return VerifiedSchemaUI on success.
- [x] Can return diagnostics on failure.

Deliverables:

- verifier implementation
- VerifiedSchemaUI type
- validation fixtures
- diagnostic fixtures
- repair metadata

Completion evidence:

- implementation: `packages/core/src/verification.ts`
- fixtures: `docs/fixtures/verification/`
- tests: `packages/core/tests/verification.test.ts`

## Gate 4: React Renderer

Status: implemented

Acceptance criteria:

- [x] Can render VerifiedSchemaUI in React.
- [x] Can render recursive children.
- [x] Can render slots.
- [x] Can call registry render bindings.
- [x] Can bind runtime data.
- [x] Can bind runtime actions.
- [x] Can apply permission guard.
- [x] Can report render diagnostics.
- [x] Can render fallbacks safely.

Deliverables:

- `@water-ui/react`
- `WaterRenderer`
- `WaterStreamRenderer`
- `WaterRuntimeProvider`
- `NodeRenderer`
- `SlotRenderer`
- fallback components
- renderer tests

Completion evidence:

- implementation: `packages/react/src/index.ts`
- tests: `packages/react/tests/renderer.test.ts`

## Gate 5: shadcn Registry Adapter

Status: completed

Acceptance criteria:

- [x] Can provide shadcn registry entries.
- [x] Can render shadcn-backed nodes.
- [x] Can validate shadcn entry props.
- [x] Can generate prompt summaries for shadcn entries.
- [x] Can merge shadcn entries with user entries.
- [x] Can support project-local import aliases.
- [x] Can avoid leaking shadcn as Water core identity.

Deliverables:

- `@water-ui/adapter-shadcn`
- `shadcnComponents`
- shadcn render bindings
- shadcn prompt examples
- shadcn registry fixtures
- example app

Completion evidence:

- implementation: `packages/adapter-shadcn/src/index.ts`
- tests: `packages/adapter-shadcn/tests/adapter.test.ts`

## Gate 6: Runtime

Status: completed

Acceptance criteria:

- [x] Can register state.
- [x] Can register queries.
- [x] Can register actions.
- [x] Can register mutations.
- [x] Can enforce permission guard.
- [x] Can resolve dataRef.
- [x] Can run actionId safely.
- [x] Can log runtime events.
- [x] Can block unknown capabilities.

Deliverables:

- `@water-ui/runtime`
- `runtime_contract_v1.md`
- state/query/action/mutation registries
- permission model
- runtime tests

Completion evidence:

- implementation: `packages/runtime/src/index.ts`
- tests: `packages/runtime/tests/runtime.test.ts`

## Gate 7: Semantic Patch

Status: completed

Acceptance criteria:

- [x] Can apply `upsertNode`.
- [x] Can apply `removeNode`.
- [x] Can apply `updateProps`.
- [x] Can apply `insertChildBefore` and `insertChildAfter`.
- [x] Can apply `moveNode`.
- [x] Can validate patch operations against registry.
- [x] Can validate document after patch.
- [x] Can produce patch diagnostics.
- [x] Can support repair loops.

Deliverables:

- `patch_protocol_v1.md`
- patch engine
- patch fixtures
- patch diagnostics
- patch history API

Completion evidence:

- implementation: `packages/core/src/patch.ts`
- tests: `packages/core/tests/patch.test.ts`

## Gate 8: Streaming

Status: completed

Acceptance criteria:

- [x] Can consume ordered JSONL stream events.
- [x] Can verify events against registry.
- [x] Can handle partial documents.
- [x] Can render progressive verified UI.
- [x] Can buffer unresolved child references.
- [x] Can reject duplicate sequence numbers.
- [x] Can recover from invalid events.
- [x] Can finalize document on done.

Deliverables:

- `stream_protocol_v1.md`
- stream parser
- stream state engine
- `WaterStreamRenderer`
- stream fixtures
- stream diagnostics

Completion evidence:

- implementation: `packages/core/src/stream.ts`
- renderer integration: `packages/react/src/index.ts`
- tests: `packages/core/tests/stream.test.ts`, `packages/react/tests/renderer.test.ts`

## Gate 9: Prompt Compiler

Status: completed

Acceptance criteria:

- [x] Can compile registry into compact system prompt.
- [x] Can select registry entries by profile.
- [x] Can include allowed actions and queries.
- [x] Can generate document-mode instructions.
- [x] Can generate patch-mode instructions.
- [x] Can generate stream-mode instructions.
- [x] Can generate repair prompts from diagnostics.
- [x] Can evaluate model outputs against fixtures.

Deliverables:

- `@water-ui/prompt`
- `prompt_compiler_v1.md`
- profile definitions
- repair prompt templates
- prompt fixtures
- eval harness

Completion evidence:

- implementation: `packages/prompt/src/index.ts`
- tests: `packages/prompt/tests/prompt.test.ts`
- fixtures: `goldens/prompts/custom-admin.system.txt`, `goldens/prompts/repair-invalid-props.txt`

## Gate 10: DevTools

Status: completed

Acceptance criteria:

- [x] Can inspect registry.
- [x] Can inspect raw Schema UI.
- [x] Can inspect VerifiedSchemaUI.
- [x] Can inspect validation errors.
- [x] Can inspect patches.
- [x] Can inspect stream events.
- [x] Can inspect runtime events.
- [x] Can inspect compiled prompts.
- [x] Can inspect render bindings.

Deliverables:

- `@water-ui/devtools`
- DevTools UI
- debug event protocol
- inspection API
- example integration

Completion evidence:

- implementation: `packages/devtools/src/index.ts`
- tests: `packages/devtools/tests/devtools.test.ts`
