# Gate 8 Task: Streaming

Objective: consume JSONL stream events into partial verified UI state.

Inputs:

- Ordered or partially ordered stream events
- Component registry
- Runtime capability description

Outputs:

- Stream state
- Partial verified document state
- Stream diagnostics

Public API:

- `parseStreamEvent`
- `createStreamState`
- `applyStreamEvent`
- `finalizeStreamState`

Forbidden behavior:

- Do not render unverified stream output.
- Do not crash on invalid events.
- Do not commit unknown component types.

Acceptance tests:

- Consume ordered events.
- Reject duplicate sequence numbers.
- Buffer unresolved child references.
- Reject invalid component events.
- Recover after invalid events.
- Fully verify on `done`.
