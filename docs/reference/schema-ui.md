# Schema UI Reference

Schema UI is the model-facing JSON-compatible protocol.

Current protocol version: `water.ui.v1`.

Document:

```ts
type SchemaUIDocument = {
  kind: "water.ui.document";
  version: "water.ui.v1";
  root: NodeId;
  nodes: Record<NodeId, SchemaUINode>;
  meta?: DocumentMeta;
};
```

Node:

```ts
type SchemaUINode = {
  type: string;
  props?: Record<string, unknown>;
  children?: NodeId[];
  slots?: Record<string, NodeId | NodeId[]>;
};
```

Rule:

```txt
node.type is a key into the active registry.
```

Patch:

```ts
type SchemaUIPatch = {
  kind: "water.ui.patch";
  version: "water.ui.v1";
  target: NodeId;
  ops: SchemaUIPatchOperation[];
  meta?: DocumentMeta;
};
```

Supported patch operation names:

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

Stream events are newline-delimited JSON objects with a non-negative integer
`seq` and one of the supported event kinds:

- `node.upsert`
- `node.remove`
- `node.replace`
- `node.props.update`
- `child.append`
- `child.prepend`
- `child.insertBefore`
- `child.insertAfter`
- `child.remove`
- `slot.set`
- `slot.unset`
- `done`

Parser API:

- `parseSchemaUIDocument`
- `parseSchemaUIPatch`
- `parseSchemaUIStreamEvent`
- `normalizeSchemaUIDocument`
- `applyPatch`
- `validatePatch`
- `createPatchHistory`
- `parseStreamEvent`
- `createStreamState`
- `applyStreamEvent`
- `finalizeStreamState`

Parsers validate protocol shape and version only. They do not verify registry
component existence, props schemas, runtime references, or node graph integrity;
those checks belong to verification and runtime APIs.

Patch APIs apply semantic patches to `VerifiedSchemaUI`, validate operation
references, run full document verification, and return a fresh
`VerifiedSchemaUI` only on success.

Stream APIs consume JSONL stream events into stream state, buffer unresolved
references, reject invalid events, and expose only verified partial UI
snapshots.
