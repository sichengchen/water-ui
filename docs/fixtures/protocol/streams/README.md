# Stream Protocol Fixtures

Gate 2 and Gate 8 stream fixtures prove:

- ordered JSONL events parse
- duplicate sequence numbers are rejected
- unresolved child references can buffer
- invalid events emit diagnostics
- `done` triggers full verification
