# Stream UI From an Agent

Streaming uses ordered JSONL events.
Use streaming when the agent can produce useful verified UI before the full
document is complete, such as progressively adding list items, dashboard cards,
or sections of a page.

## Flow

1. Parse each event.
2. Validate event shape.
3. Validate registry references.
4. Apply valid events to partial document state.
5. Verify affected nodes or subtrees.
6. Render partial verified state.
7. Run full verification on `done`.

Invalid events emit diagnostics and must not crash the stream.

## Event Shape

Each stream event is one JSON object per line:

```jsonl
{"seq":1,"kind":"node.upsert","id":"task_list","type":"TaskList","props":{"tasks":[{"id":"task-copy","title":"Finalize copy","tags":["Copy","Friday"],"people":["Mina"],"priority":"high"}]}}
{"seq":2,"kind":"node.props.update","id":"task_list","props":{"tasks":[{"id":"task-copy","title":"Finalize copy","tags":["Copy","Friday"],"people":["Mina"],"priority":"high"},{"id":"task-staging","title":"Open staging checklist","tags":["Staging","Beta"],"people":["Dev"],"priority":"medium"}]}}
{"seq":3,"kind":"done"}
```

`seq` must be unique and ordered by the producer. The stream engine rejects
duplicates and reports diagnostics.

## Core API

```ts
import { applyStreamEvent, createStreamState, finalizeStreamState } from "@wasser-ui/core";

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
<WasserStreamRenderer stream={stream} registry={registry} />
```

Wasser buffers unresolved relationship events, rejects duplicate sequence numbers,
rejects invalid component events, and exposes only verified partial UI snapshots.
The `done` event triggers full-document verification.

## React Rendering

```tsx
import { WasserRuntimeProvider, WasserStreamRenderer } from "@wasser-ui/react";

<WasserRuntimeProvider registry={registry} runtime={runtime}>
  <WasserStreamRenderer stream={stream} fallback={null} />
</WasserRuntimeProvider>;
```

`WasserStreamRenderer` renders `stream.ui` when the current partial state verifies.
If the stream has not produced a valid reachable root yet, it renders the
fallback.

## Prompt Compilation

Use the stream prompt compiler for streaming agents:

```ts
import { compileStreamPrompt } from "@wasser-ui/prompt";

const prompt = compileStreamPrompt({
  registry,
  runtime: runtime.describe(),
  userIntent: "Turn this meeting note into a todo list.",
});
```

The registry entry should describe the positive event pattern the component
expects. For a list component, that usually means upserting the root node and
then updating the list props as items arrive.

## Diagnostics Strategy

For user-facing streaming UI:

- keep the last verified UI on screen when a later event fails
- log or inspect warning diagnostics for buffered references
- stop or repair the stream on error diagnostics
- run `finalizeStreamState` if the provider closes without a `done` event

## Related Reference

- [Schema UI v1](../reference/schema-ui-v1.md)
- [Renderer API](../reference/renderer-api.md)
- [Diagnostics](../reference/diagnostics.md)
