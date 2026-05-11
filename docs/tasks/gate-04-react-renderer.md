# Gate 4 Task: React Renderer

Objective: render VerifiedSchemaUI through registry render bindings.

Inputs:

- VerifiedSchemaUI
- Component registry
- WaterRuntime

Outputs:

- React element tree
- Render diagnostics
- Runtime telemetry events

Public API:

- `WaterRuntimeProvider`
- `WaterRenderer`
- `WaterStreamRenderer`
- `NodeRenderer`
- `SlotRenderer`

Forbidden behavior:

- Do not render raw Schema UI.
- Do not execute model-generated code.
- Do not import components from model output.
- Do not accept arbitrary event handlers.
- Do not render raw HTML by default.

Acceptance tests:

- Render root node.
- Render recursive children.
- Render slots.
- Call registry render binding.
- Bind runtime data and actions.
- Apply permission guard.
- Render fallbacks safely.
