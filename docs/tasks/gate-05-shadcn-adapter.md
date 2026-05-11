# Gate 5 Task: shadcn Registry Adapter

Objective: provide optional shadcn registry entries and render bindings.

Inputs:

- shadcn component modules
- Water registry API
- Adapter fixtures

Outputs:

- `shadcnComponents`
- shadcn render bindings
- shadcn prompt examples

Public API:

- `shadcnComponents`
- adapter config helpers

Forbidden behavior:

- Do not put shadcn entries in Water core.
- Do not make shadcn required.
- Do not leak shadcn prop assumptions into core APIs.

Acceptance tests:

- Merge shadcn entries with user entries.
- Validate shadcn props.
- Render shadcn-backed nodes.
- Generate prompt summaries.
- Support project-local import aliases.
