# RFC 003: Schema UI Protocol

Schema UI is the model-facing output format. It is declarative,
JSON-compatible, inspectable, patchable, streamable, and safe to validate.

Initial protocol forms:

- Full UI document
- Semantic patch
- JSONL stream events

Document shape:

```ts
type SchemaUIDocument = {
  kind: "wasser.ui.document";
  version: "wasser.ui.v1";
  root: NodeId;
  nodes: Record<NodeId, SchemaUINode>;
  meta?: DocumentMeta;
};

type SchemaUINode = {
  type: string;
  props?: Record<string, unknown>;
  children?: NodeId[];
  slots?: Record<string, NodeId | NodeId[]>;
};
```

The critical rule is that `node.type` is a key into the active registry. Wasser
does not need global knowledge of what a component means. It only verifies that
the active registry permits that component, props, children, slots, and runtime
references.
