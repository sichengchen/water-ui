# RFC 002: Registry-First Architecture

The registry is the source of truth for what agents may generate and what Water
may render.

High-level flow:

```txt
Developer-defined Component Registry
  -> Water Prompt Compiler
  -> Agent outputs Schema UI
  -> Water Verifier
  -> VerifiedSchemaUI
  -> Water Renderer / Stream Renderer
  -> Application React Components
```

Water core does not define Button, Card, Table, Dialog, Page, or any other
visual component. Those definitions belong to user application registries or
adapter packages.

Core layers:

- Registry layer: component entries, examples, policies, summaries
- Protocol layer: documents, patches, JSONL stream events
- Verification layer: protocol shape, registry references, props, slots,
  children, runtime references
- Verified UI layer: rendering boundary
- Patch layer: semantic UI operations
- Streaming layer: progressive verified state
- Runtime layer: state, queries, mutations, actions, permissions, telemetry
- Renderer layer: React rendering of verified UI
- Prompt layer: registry and runtime capability instructions
- DevTools layer: explainability and inspection

The first implementation gate is the registry API because every later gate
depends on it.
