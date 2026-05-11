# Getting Started: React + shadcn

Status: planned for Gates 4 and 5.

This guide exists to keep the intended first adapter path explicit without
making shadcn the Water core abstraction.

Flow:

1. Define or import a component registry.
2. Add optional `shadcnComponents` from `@water-ui/adapter-shadcn`.
3. Compile a prompt from the merged registry.
4. Verify generated Schema UI.
5. Render VerifiedSchemaUI with `@water-ui/react`.

The shadcn adapter owns shadcn entries. Water core does not define Button,
Card, Table, Dialog, Form, or any visual component.
