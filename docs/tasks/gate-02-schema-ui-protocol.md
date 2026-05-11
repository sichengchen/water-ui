# Gate 2 Task: Schema UI Protocol

Objective: parse and normalize Water document, patch, and stream protocols.

Inputs:

- Unknown raw input
- JSON document fixtures
- JSON patch fixtures
- JSONL stream fixtures

Outputs:

- Parsed protocol objects
- Structured diagnostics

Public API:

- `parseSchemaUIDocument`
- `parseSchemaUIPatch`
- `parseSchemaUIStreamEvent`
- `normalizeSchemaUIDocument`

Forbidden behavior:

- Do not verify registry component existence in the parser.
- Do not render.
- Do not throw for normal invalid input.

Acceptance tests:

- Accept valid `water.ui.v1` documents.
- Reject invalid versions.
- Reject invalid shapes.
- Parse semantic patches.
- Parse JSONL stream events.
- Emit stable diagnostics.
