# RFC 009: Semantic Patch

Semantic patches modify existing verified UI.

Patch shape:

```json
{
  "kind": "wasser.ui.patch",
  "version": "wasser.ui.v1",
  "target": "page_1",
  "ops": [
    {
      "op": "upsertNode",
      "id": "status_filter",
      "node": {
        "type": "StatusFilter",
        "props": {
          "stateKey": "filters.status"
        }
      }
    },
    {
      "op": "insertChildBefore",
      "parent": "page_1",
      "before": "table_1",
      "child": "status_filter"
    }
  ]
}
```

Recommended operations:

- `upsertNode`
- `removeNode`
- `replaceNode`
- `updateProps`
- `appendChild`
- `prependChild`
- `insertChildBefore`
- `insertChildAfter`
- `removeChild`
- `moveNode`
- `replaceChildren`
- `setSlot`
- `unsetSlot`

Patch validation:

- Validate operation shape.
- Validate target node exists.
- Validate inserted node type is registered.
- Validate props against registry.
- Validate affected subtree.
- Validate full document after patch when needed.
- Emit diagnostics.
- Return a new VerifiedSchemaUI.
