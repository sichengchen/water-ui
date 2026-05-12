# RFC 010: JSONL Streaming

Wasser supports progressive generation through JSONL stream events.

Example:

```jsonl
{"seq":1,"kind":"node.upsert","id":"page","type":"AdminPage","props":{"title":"Customers"}}
{"seq":2,"kind":"node.upsert","id":"table","type":"CustomerTable","props":{"dataRef":"queries.customers.data","columns":[{"key":"name","label":"Name"}]}}
{"seq":3,"kind":"child.append","parent":"page","child":"table"}
{"seq":4,"kind":"done"}
```

Streaming rules:

- Every event has `seq`.
- Duplicate sequence numbers are rejected or ignored deterministically.
- Events are validated before commit where possible.
- Unknown component types are rejected.
- Invalid props are rejected or quarantined.
- Unresolved child references may be buffered.
- Partial verified state may render progressively.
- Invalid events emit diagnostics, not crashes.
- Final `done` event triggers full verification.

Stream state model:

```txt
Raw stream event
  -> Parse event
  -> Validate event shape
  -> Validate registry references
  -> Apply to partial document state
  -> Verify affected node/subtree
  -> Render partial verified UI
```

The stream renderer must never render arbitrary unverified model output.
