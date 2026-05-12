# Getting Started: React + shadcn

This guide shows the React renderer with the optional shadcn adapter. shadcn
entries live outside Wasser core so the core package remains component-library
neutral.

## Install

```sh
vp add @wasser-ui/core @wasser-ui/react @wasser-ui/runtime @wasser-ui/prompt
vp add @wasser-ui/adapter-shadcn
```

Use the package manager and workspace tooling for your application. In this
repo, use `vp`.

## Flow

1. Define application components as Wasser registry entries.
2. Add optional shadcn entries from `@wasser-ui/adapter-shadcn`.
3. Compile a prompt from the merged registry.
4. Verify generated Schema UI.
5. Render VerifiedSchemaUI with `@wasser-ui/react`.

## Create a Registry

```ts
import { createWasserRegistry, defineWasserComponent } from "@wasser-ui/core";
import { shadcnComponents } from "@wasser-ui/adapter-shadcn";
import { z } from "zod";

const CustomerSummary = defineWasserComponent({
  description: "Shows customer count, active accounts, and revenue summary.",
  propsSchema: z
    .object({
      title: z.string(),
      dataRef: z.literal("queries.customerSummary.data"),
    })
    .strict(),
  children: "none",
});

export const registry = createWasserRegistry({
  components: {
    ...shadcnComponents,
    CustomerSummary,
  },
});
```

The shadcn adapter owns shadcn entries. Wasser core does not define `Button`,
`Card`, `Table`, `Dialog`, `Form`, or any visual component.

## Render Verified UI

```tsx
import { WasserRenderer, WasserRuntimeProvider } from "@wasser-ui/react";

export function GeneratedPanel({ ui, runtime }) {
  return (
    <WasserRuntimeProvider registry={registry} runtime={runtime}>
      <WasserRenderer ui={ui} />
    </WasserRuntimeProvider>
  );
}
```

## Use Project-Local shadcn Components

Applications that use shadcn source components can bind their local components
through the adapter factory:

```ts
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShadcnComponents } from "@wasser-ui/adapter-shadcn";

const shadcnComponents = createShadcnComponents({
  components: {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  },
});
```

## Practical Starting Point

Start with one product-specific component and one generated flow. For example,
the meeting actions example exposes a `TaskList` component and lets Wasser
generate only the todo list. The notebook and assistant shell are normal React
UI; the generated output stays focused and easy to verify.

See [examples/meeting-note-react](../../examples/meeting-note-react).

## Related Guides

- [Define Your Registry](./define-your-registry.md)
- [Generate UI With an Agent](./generate-ui-with-agent.md)
- [Use the shadcn Adapter](./use-the-shadcn-adapter.md)
