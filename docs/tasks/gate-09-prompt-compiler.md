# Gate 9 Task: Prompt Compiler

Objective: generate agent prompts from the same registry and runtime capabilities
used for verification.

Inputs:

- Component registry
- Runtime description
- Current UI document
- Output mode
- Profile
- Diagnostics for repair mode

Outputs:

- System prompt
- Document prompt
- Patch prompt
- Stream prompt
- Repair prompt

Public API:

- `compileSystemPrompt`
- `compileDocumentPrompt`
- `compilePatchPrompt`
- `compileStreamPrompt`
- `compileRepairPrompt`

Forbidden behavior:

- Do not hand-author prompts that drift from the registry.
- Do not include render functions.
- Do not expose raw unsafe internals.

Acceptance tests:

- Include allowed components.
- Include allowed actions and queries.
- Select entries by profile.
- Include forbidden behavior rules.
- Generate repair prompt from diagnostics.
- Snapshot prompt fixtures.
