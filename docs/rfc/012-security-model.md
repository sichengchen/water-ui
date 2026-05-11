# RFC 012: Security Model

Raw model output is untrusted. VerifiedSchemaUI is the rendering boundary.

Hard rules:

- No arbitrary JSX
- No arbitrary JavaScript
- No arbitrary imports
- No arbitrary event handlers
- No arbitrary network requests
- No model-defined actions, queries, mutations, or permission rules
- No arbitrary `className` or inline style by default
- No raw HTML by default

Allowed model output:

- Registered component type
- Schema-valid props
- Stable node IDs
- Children and slot references
- Registered action IDs
- Registered data refs
- Registered state keys
- Semantic patch operations
- JSONL stream events
- Safe design tokens when allowed by the registry

The model describes UI intent. Application code owns execution.
