# Stream Protocol Fixtures

Stream protocol fixtures cover:

- ordered JSONL events parse
- duplicate sequence numbers are rejected
- unresolved child references can buffer
- invalid events emit diagnostics
- `done` triggers full verification
