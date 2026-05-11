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
