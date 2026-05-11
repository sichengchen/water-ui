# RFC 004: VerifiedSchemaUI

VerifiedSchemaUI is the safe rendering boundary.

Raw Schema UI is model-generated and untrusted. VerifiedSchemaUI is parsed,
registry-checked, runtime-checked, and renderable.

Verification responsibilities:

- Parse Schema UI.
- Check protocol version.
- Check root exists.
- Check all referenced nodes exist.
- Check invalid cycles.
- Check orphan nodes.
- Check every node type exists in the active registry.
- Validate props against registry entry schema.
- Validate children policy.
- Validate slot policy.
- Validate action ID references.
- Validate data references.
- Validate state key references.
- Validate styling and token policies.
- Emit structured diagnostics.
- Return VerifiedSchemaUI only when valid.

Renderer APIs accept VerifiedSchemaUI. They do not accept raw model output.

Example usage:

```ts
const result = water.verify(rawSchemaUi);

if (!result.ok) {
  return result.diagnostics;
}

const verifiedUi = result.ui;
```

```tsx
<WaterRenderer ui={verifiedUi} />
```
