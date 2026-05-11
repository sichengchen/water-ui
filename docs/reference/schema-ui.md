# Schema UI Reference

Schema UI is the model-facing JSON-compatible protocol.

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
