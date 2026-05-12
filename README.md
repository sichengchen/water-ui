# Wasser UI

![https://img.shields.io/npm/v/@wasser-ui/core](https://www.npmjs.com/package/@wasser-ui/core)

Wasser UI is a generative UI toolkit for agent-driven applications.

Applications expose their own components through a Wasser UI registry. Wasser UI
uses that registry to compile prompts, parse model output, verify Schema UI,
render verified UI, apply patches, and consume streaming UI updates.

## Packages

Install the framework
renderer your application uses:

```sh
npm install @wasser-ui/core@alpha @wasser-ui/runtime@alpha @wasser-ui/prompt@alpha @wasser-ui/react@alpha
```

Optional packages:

```sh
npm install @wasser-ui/vue@alpha
npm install @wasser-ui/svelte@alpha
npm install @wasser-ui/angular@alpha
npm install @wasser-ui/adapter-shadcn@alpha
npm install @wasser-ui/devtools@alpha
```

- `@wasser-ui/core`: registries, Schema UI protocol parsing, verification,
  semantic patches, stream state, and diagnostics.
- `@wasser-ui/react`: React rendering for `VerifiedSchemaUI`, runtime binding,
  safe fallbacks, and stream rendering.
- `@wasser-ui/vue`: Vue rendering for `VerifiedSchemaUI`, runtime binding, safe
  fallbacks, and stream rendering.
- `@wasser-ui/svelte`: Svelte snippet and HTML rendering for
  `VerifiedSchemaUI`, runtime binding, safe fallbacks, and stream rendering.
- `@wasser-ui/angular`: Angular rendering for `VerifiedSchemaUI`, runtime
  binding, safe fallbacks, and stream rendering.
- `@wasser-ui/runtime`: state, query, action, mutation, permission, and runtime
  event registries.
- `@wasser-ui/prompt`: prompt compilers for document, patch, stream, and repair
  flows.
- `@wasser-ui/adapter-shadcn`: (optional) shadcn registry entries and render
  bindings.
- `@wasser-ui/devtools`: serializable inspection models for registries, Schema
  UI, verification, patches, streams, runtime events, prompts, and render
  bindings.

## How It Works

1. Define a registry of user-owned components.
2. Register runtime capabilities for data, actions, mutations, and state.
3. Compile prompts from the same registry and runtime capabilities.
4. Parse model output as a Wasser document, patch, or JSONL stream.
5. Verify the output against the registry and runtime description.
6. Render `VerifiedSchemaUI` with React, Vue, Svelte, Angular, or inspect it with
   DevTools.

Raw model output is always untrusted. Rendering starts only after verification
returns a `VerifiedSchemaUI`.

## Basic Usage

```ts
import { createWasserRegistry, defineWasserComponent, verifyDocument } from "@wasser-ui/core";
import { createWasserRuntime } from "@wasser-ui/runtime";
import { compileDocumentPrompt } from "@wasser-ui/prompt";
import { z } from "zod";

const CustomerTable = defineWasserComponent({
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

const registry = createWasserRegistry({
  components: {
    CustomerTable,
  },
});

const runtime = createWasserRuntime();

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
import { WasserRenderer, WasserRuntimeProvider } from "@wasser-ui/react";

<WasserRuntimeProvider runtime={runtime} registry={registry}>
  <WasserRenderer ui={verifiedUi} />
</WasserRuntimeProvider>;
```

Vue rendering consumes the same verified UI contract:

```ts
import { h } from "vue";
import { WasserRenderer, WasserRuntimeProvider } from "@wasser-ui/vue";

h(WasserRuntimeProvider, { runtime, registry }, () => h(WasserRenderer, { ui: verifiedUi }));
```

Svelte rendering exposes snippets and server HTML helpers:

```svelte
<script lang="ts">
  import { createWasserRenderer } from "@wasser-ui/svelte";

  const renderer = createWasserRenderer({ ui: verifiedUi, runtime, registry });
</script>

{@render renderer()}
```

Angular rendering consumes the same verified UI contract:

```ts
import { provideWasserRuntime } from "@wasser-ui/angular";

bootstrapApplication(AppComponent, {
  providers: [provideWasserRuntime({ runtime, registry })],
});
```

```html
<wasser-renderer [ui]="verifiedUi" />
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
