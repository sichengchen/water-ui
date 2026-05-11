# Gate 10 Task: DevTools

Objective: inspect generated UI across registry, verification, runtime, prompt,
patch, stream, and render layers.

Inputs:

- Registry snapshot
- Raw Schema UI
- VerifiedSchemaUI
- Diagnostics
- Patch history
- Stream events
- Runtime events
- Prompt output
- Render binding traces

Outputs:

- DevTools inspection API
- DevTools UI
- Debug event protocol

Public API:

- inspection provider
- debug event protocol
- panel components

Forbidden behavior:

- Do not mutate runtime state from inspectors by default.
- Do not hide rejected model output.
- Do not require shadcn.

Acceptance tests:

- Inspect registry.
- Inspect raw and verified UI.
- Inspect validation errors.
- Inspect patches and streams.
- Inspect runtime events.
- Inspect compiled prompts.
- Inspect render bindings.
