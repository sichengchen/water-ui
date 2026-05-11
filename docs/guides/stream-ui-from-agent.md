# Stream UI From an Agent

Status: planned for Gate 8.

Streaming uses ordered JSONL events.

Flow:

1. Parse each event.
2. Validate event shape.
3. Validate registry references.
4. Apply valid events to partial document state.
5. Verify affected nodes or subtrees.
6. Render partial verified state.
7. Run full verification on `done`.

Invalid events emit diagnostics and must not crash the stream.
