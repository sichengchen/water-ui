# Debug Validation Errors

Diagnostics should be structured enough for developers and repair prompts.

Diagnostic fields:

- `code`
- `severity`
- `nodeId`
- `path`
- `message`
- `suggestions`
- `allowedValues`

Diagnostics must answer:

- What failed?
- Where did it fail?
- Which registry or runtime capability was involved?
- What can the agent use instead?
