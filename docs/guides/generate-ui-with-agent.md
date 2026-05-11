# Generate UI With an Agent

Generation flow:

1. Developer defines a registry.
2. Water compiles the system prompt from that registry.
3. Agent outputs a full `water.ui.document`.
4. Water parses and verifies the document.
5. Water returns VerifiedSchemaUI on success.
6. Renderer renders VerifiedSchemaUI.

The prompt must instruct the agent to:

- Output Water Schema UI only.
- Use only registered components.
- Use only allowed props.
- Use stable node IDs.
- Avoid JSX, JavaScript, imports, network calls, and model-defined actions.
