# Gate 7 Task: Semantic Patch

Objective: apply registry-verified semantic patches to existing UI.

Inputs:

- VerifiedSchemaUI
- SchemaUIPatch
- Component registry
- Runtime capability description

Outputs:

- New VerifiedSchemaUI
- Patch diagnostics
- Patch history entry

Public API:

- `applyPatch`
- `validatePatch`
- `createPatchHistory`

Forbidden behavior:

- Do not mutate input documents.
- Do not commit invalid operations.
- Do not skip verification of inserted or affected nodes.

Acceptance tests:

- Apply `upsertNode`.
- Apply `removeNode`.
- Apply `updateProps`.
- Apply child insertion operations.
- Apply `moveNode`.
- Reject unregistered inserted nodes.
- Validate full document after patch when needed.
