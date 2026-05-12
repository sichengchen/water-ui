# Schema UI v1

Schema UI v1 is the model-facing protocol for Wasser UI. It supports full
documents, semantic patches, and JSONL stream events.

Public parser API:

- `parseSchemaUIDocument`
- `parseSchemaUIPatch`
- `parseSchemaUIStreamEvent`
- `parseStreamEvent`
- `normalizeSchemaUIDocument`

All parsers return structured diagnostics for ordinary invalid input instead of
throwing. The parser layer validates JSON shape and protocol version only. It
does not verify component registration, props schemas, runtime references, or
node graph integrity.

Version:

```txt
wasser.ui.v1
```

Document kind:

```txt
wasser.ui.document
```

Patch kind:

```txt
wasser.ui.patch
```

Fixture coverage:

- `docs/fixtures/protocol/documents/`
- `docs/fixtures/protocol/patches/`
- `docs/fixtures/protocol/streams/`
