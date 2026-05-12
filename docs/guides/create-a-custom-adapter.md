# Create a Custom Adapter

Adapters package component registry entries, render bindings, examples, and
configuration helpers for a component library or design system.

Adapter responsibilities:

- Define registry entries.
- Validate adapter-specific props through schemas.
- Provide render bindings.
- Provide prompt examples.
- Avoid leaking adapter assumptions into Water core.

Adapter packages follow the same registry contract as user application
registries. MUI, AntD, Chakra, internal design systems, and product-specific
registries are all adapter candidates.

## Package Shape

A typical adapter exports:

- registry entries for the component library
- a factory for binding project-local components
- prompt examples and prop summaries
- optional config helpers for import aliases or registry publishing metadata

Example package surface:

```ts
export {
  createAcmeComponents,
  acmeComponents,
  createAcmeAdapterConfig,
  getAcmeImportPath,
} from "./adapter";
```

## Define an Adapter Entry

```tsx
import { defineWaterComponent } from "@water-ui/core";
import { z } from "zod";
import type { WaterRenderBinding } from "@water-ui/react";

const badgePropsSchema = z
  .object({
    label: z.string(),
    tone: z.enum(["neutral", "success", "warning", "danger"]).optional(),
  })
  .strict();

type BadgeProps = z.infer<typeof badgePropsSchema>;

export function createAcmeComponents(bindings: { Badge: React.ComponentType<BadgeProps> }) {
  const Badge = defineWaterComponent<BadgeProps>({
    description: "Status badge with a short label and semantic tone.",
    propsSchema: badgePropsSchema,
    children: "none",
    prompt: {
      props: [
        {
          name: "label",
          description: "Short badge text.",
          required: true,
        },
        {
          name: "tone",
          description: "Semantic badge tone.",
          required: false,
          allowedValues: ["neutral", "success", "warning", "danger"],
        },
      ],
    },
    render: (({ props }) => <bindings.Badge {...props} />) satisfies WaterRenderBinding<BadgeProps>,
  });

  return { Badge };
}
```

The adapter defines the Water contract. The application supplies the actual
visual component implementation when needed.

## Default Bindings

If the adapter package directly depends on a component library, it can export a
ready-to-use registry fragment:

```ts
import { Badge } from "@acme/ui";

export const acmeComponents = createAcmeComponents({ Badge });
```

For source-component systems such as shadcn, prefer a factory so applications
can bind their local files.

## Adapter Boundaries

Keep these concerns in the adapter:

- component-library prop validation
- render bindings to the library
- examples that map product intent to library components
- config helpers for aliases or registry metadata

Keep these concerns out of the adapter:

- application-specific runtime IDs
- product data schemas
- product permission policy
- Water core behavior

## Validation

Adapter tests should verify:

- registry summaries contain useful prompt metadata
- valid nodes verify
- invalid props fail with diagnostics
- render bindings produce expected React output
- factory bindings work with project-local components

## Related Reference

- [Registry API](../reference/registry-api.md)
- [Renderer API](../reference/renderer-api.md)
- [Use the shadcn Adapter](./use-the-shadcn-adapter.md)
