# Stream UI From an Agent

Streaming uses ordered JSONL events.

Flow:

1. Parse each event.
2. Validate event shape.
3. Validate registry references.
4. Apply valid events to partial document state.
5. Verify affected nodes or subtrees.
6. Render partial verified state.
7. Run full verification on `done`.

Invalid events emit diagnostics and must not crash the stream.

API:

```ts
import { applyStreamEvent, createStreamState, finalizeStreamState } from "@water-ui/core";

let stream = createStreamState();

for await (const line of modelJsonlStream) {
  const result = applyStreamEvent(stream, line, {
    registry,
    runtime: runtime.describe(),
  });

  stream = result.state;

  if (result.ui) {
    render(result.ui);
  }
}

const final = finalizeStreamState(stream, {
  registry,
  runtime: runtime.describe(),
});
```

React:

```tsx
<WaterStreamRenderer stream={stream} registry={registry} />
```

Water buffers unresolved relationship events, rejects duplicate sequence numbers,
rejects invalid component events, and exposes only verified partial UI snapshots.
The `done` event triggers full-document verification.
