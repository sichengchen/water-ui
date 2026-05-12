# Water UI

Water UI is a registry-first generative UI toolkit for agent-driven
applications.

Applications expose their own components through a Water registry. Water uses
that registry to compile prompts, parse model output, verify Schema UI, render
only verified UI, apply semantic patches, and consume streaming UI updates.

Water core is component-library-neutral. Visual components belong in application
registries or adapter packages such as `@water-ui/adapter-shadcn`, not in
`@water-ui/core`.

## Packages

- `@water-ui/core`: registries, Schema UI protocol parsing, verification,
  semantic patches, stream state, and diagnostics.
- `@water-ui/react`: React rendering for `VerifiedSchemaUI`, runtime binding,
  safe fallbacks, and stream rendering.
- `@water-ui/runtime`: state, query, action, mutation, permission, and runtime
  event registries.
- `@water-ui/prompt`: prompt compilers for document, patch, stream, and repair
  flows.
- `@water-ui/adapter-shadcn`: optional shadcn registry entries and render
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
6. Render `VerifiedSchemaUI` with React or inspect it with DevTools.

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

## shadcn Adapter

Use `@water-ui/adapter-shadcn` when an application wants standard shadcn-backed
entries in its registry:

```ts
import { createWaterRegistry } from "@water-ui/core";
import { shadcnComponents } from "@water-ui/adapter-shadcn";

const registry = createWaterRegistry({
  components: {
    ...shadcnComponents,
    CustomerTable,
  },
});
```

Project-local shadcn components can be bound with `createShadcnComponents`.

## Documentation

- [Guides](./docs/guides/README.md): task-focused usage guides.
- [Reference](./docs/reference/README.md): public API and protocol references.
- [Fixtures](./docs/fixtures/README.md): protocol, registry, and verification
  fixtures.
- [RFCs](./docs/rfc/README.md): architecture notes and design rationale.
- [Goldens](./goldens/): golden fixtures for registries, documents, patches,
  streams, and prompts.

## Development

This repository uses Vite+ through the `vp` CLI.

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
