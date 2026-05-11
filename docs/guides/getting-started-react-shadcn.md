# Getting Started: React + shadcn

This guide shows the React renderer with the optional shadcn adapter. shadcn
entries live outside Water core so the core package remains component-library
neutral.

Flow:

1. Define or import a component registry.
2. Add optional `shadcnComponents` from `@water-ui/adapter-shadcn`.
3. Compile a prompt from the merged registry.
4. Verify generated Schema UI.
5. Render VerifiedSchemaUI with `@water-ui/react`.

The shadcn adapter owns shadcn entries. Water core does not define `Button`,
`Card`, `Table`, `Dialog`, `Form`, or any visual component.
