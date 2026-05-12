# RFC 011: Prompt Compiler

The prompt compiler converts the registry and runtime capabilities into agent
instructions.

Input sources:

- Component registry
- Runtime registry
- Current UI document
- Output mode
- Target profile
- User intent
- Few-shot examples
- Safety policy
- Token budget

Output forms:

- System prompt
- Document-generation prompt
- Patch prompt
- Stream prompt
- Repair prompt
- Allowed component list
- Allowed prop schemas
- Allowed action IDs
- Allowed query refs
- Allowed state keys
- Forbidden behavior list
- Examples

The generated system prompt tells the agent:

- Only output Wasser Schema UI.
- Do not output JSX.
- Do not output JavaScript.
- Do not invent component types.
- Do not invent action IDs.
- Do not invent query refs.
- Do not invent state keys.
- Use only registered components.
- Use only props allowed by each component schema.
- Use stable node IDs.
- For edits, output semantic patches instead of full regeneration when possible.
- For streaming, output valid JSONL stream events.

The prompt is generated from the exact registry used for verification.
