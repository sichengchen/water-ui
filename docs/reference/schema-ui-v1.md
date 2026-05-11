# Schema UI v1

Status: implemented in Gate 2.

Schema UI v1 is the model-facing protocol for Water UI. It supports full
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
water.ui.v1
```

Document kind:

```txt
water.ui.document
```

Patch kind:

```txt
water.ui.patch
```

Fixture coverage:

- `docs/fixtures/protocol/documents/`
- `docs/fixtures/protocol/patches/`
- `docs/fixtures/protocol/streams/`
