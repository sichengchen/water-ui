# RFC 014: Evaluation

Wasser needs an eval suite from the beginning.

Eval dimensions:

- Schema UI validity
- Registry compliance
- Unknown component rejection
- Props validation pass rate
- Runtime capability correctness
- Patch correctness
- Streaming correctness
- Repair success rate
- Unsafe output rejection
- Prompt compactness
- Rendering stability
- Developer debuggability

Task categories:

- Generate UI using only provided registry.
- Reject invented component types.
- Repair invalid props.
- Repair unknown action ID.
- Patch existing UI with registered component.
- Patch existing UI with invented component and reject it.
- Stream valid UI progressively.
- Stream invalid event and recover.
- Render same document with shadcn registry.
- Render custom app registry without shadcn.

Current golden fixture family:

- prompts
