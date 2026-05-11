# Gate 3 Task: Verification

Objective: validate Schema UI against registry and runtime descriptions.

Inputs:

- SchemaUIDocument
- Component registry
- Runtime capability description

Outputs:

- VerificationResult
- VerifiedSchemaUI on success
- Diagnostics on failure

Public API:

- `verifyDocument`
- `isVerifiedSchemaUI`
- `assertVerifiedSchemaUI`

Forbidden behavior:

- Do not mutate input documents.
- Do not call registry render functions.
- Do not execute actions, queries, or mutations.
- Do not fetch data.

Acceptance tests:

- Verify root and node map.
- Verify children and slots.
- Reject unknown component types.
- Validate props.
- Validate action IDs, data refs, and state keys.
- Return stable diagnostics with JSON paths.
