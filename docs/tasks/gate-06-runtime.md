# Gate 6 Task: Runtime

Objective: register and guard runtime capabilities referenced by Schema UI.

Inputs:

- State definitions
- Query definitions
- Action definitions
- Mutation definitions
- Permission guard

Outputs:

- Runtime description for verification and prompts
- Runtime execution API for renderer
- Runtime event log

Public API:

- state registry
- query registry
- action registry
- mutation registry
- permission guard
- telemetry sink
- event bus

Forbidden behavior:

- Do not let model output define capabilities.
- Do not run unknown actions.
- Do not bypass permission guards.

Acceptance tests:

- Register capabilities.
- Resolve known data refs.
- Run known action IDs safely.
- Block unknown capabilities.
- Log runtime events.
