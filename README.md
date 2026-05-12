# Water UI

Water UI is a generative UI toolkit for agent-driven applications.

Applications expose their own components through a Water UI registry. Water UI
uses that registry to compile prompts, parse model output, verify Schema UI,
render verified UI, apply patches, and consume streaming UI updates.

## Packages

- `@water-ui/core`: registries, Schema UI protocol parsing, verification,
  semantic patches, stream state, and diagnostics.
- `@water-ui/react`: React rendering for `VerifiedSchemaUI`, runtime binding,
  safe fallbacks, and stream rendering.
- `@water-ui/vue`: Vue rendering for `VerifiedSchemaUI`, runtime binding, safe
  fallbacks, and stream rendering.
- `@water-ui/svelte`: Svelte snippet and HTML rendering for
  `VerifiedSchemaUI`, runtime binding, safe fallbacks, and stream rendering.
- `@water-ui/runtime`: state, query, action, mutation, permission, and runtime
  event registries.
- `@water-ui/prompt`: prompt compilers for document, patch, stream, and repair
  flows.
- `@water-ui/adapter-shadcn`: (optional) shadcn registry entries and render
  bindings.
- `@water-ui/devtools`: serializable inspection models for registries, Schema
  UI, verification, patches, streams, runtime events, prompts, and render
  bindings.
- `@water-ui/cli`: command-line package entry point.

## How It Works

1. Define a registry of user-owned components.
2. Register runtime capabilities for data, actions, mutations, and state.
3. Compile prompts from the same registry and runtime capabilities.
4. Parse model output as a Water document, patch, or JSONL stream.
5. Verify the output against the registry and runtime description.
6. Render `VerifiedSchemaUI` with React, Vue, Svelte, or inspect it with
   DevTools.

Raw model output is always untrusted. Rendering starts only after verification
returns a `VerifiedSchemaUI`.

## Basic Usage

```ts
import { createWaterRegistry, defineWaterComponent, verifyDocument } from "@water-ui/core";
import { createWaterRuntime } from "@water-ui/runtime";
import { compileDocumentPrompt } from "@water-ui/prompt";
import { z } from "zod";

const CustomerTable = defineWaterComponent({
  description: "Displays customers with status, revenue, and owner.",
  propsSchema: z
    .object({
      dataRef: z.literal("queries.customers.data"),
    })
    .strict(),
  children: "none",
  prompt: {
    props: [
      {
        name: "dataRef",
        description: "Registered customer query data reference.",
        required: true,
        allowedValues: ["queries.customers.data"],
      },
    ],
  },
});

const registry = createWaterRegistry({
  components: {
    CustomerTable,
  },
});

const runtime = createWaterRuntime();

runtime.queries.register({
  id: "customers",
  dataRef: "queries.customers.data",
  handler: async () => api.customers.list(),
});

const prompt = compileDocumentPrompt({
  registry,
  runtime: runtime.describe(),
  userIntent: "Show the customer list.",
});

const result = verifyDocument(modelOutput, {
  registry,
  runtime: runtime.describe(),
});

if (result.ok) {
  render(result.ui);
} else {
  showDiagnostics(result.diagnostics);
}
```

React rendering consumes verified UI:

```tsx
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/react";

<WaterRuntimeProvider runtime={runtime} registry={registry}>
  <WaterRenderer ui={verifiedUi} />
</WaterRuntimeProvider>;
```

Vue rendering consumes the same verified UI contract:

```ts
import { h } from "vue";
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/vue";

h(WaterRuntimeProvider, { runtime, registry }, () => h(WaterRenderer, { ui: verifiedUi }));
```

Svelte rendering exposes snippets and server HTML helpers:

```svelte
<script lang="ts">
  import { createWaterRenderer } from "@water-ui/svelte";

  const renderer = createWaterRenderer({ ui: verifiedUi, runtime, registry });
</script>

{@render renderer()}
```

## Documentation

- [Guides](./docs/guides/README.md): task-focused usage guides.
- [Reference](./docs/reference/README.md): public API and protocol references.

## Development

```bash
vp install
vp check
vp test
vp run -r build
```

The root `ready` script runs check, tests, and builds:

```bash
vp run ready
```
