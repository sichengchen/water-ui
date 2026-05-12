# Debug Validation Errors

Diagnostics should be structured enough for developers and repair prompts.
Treat them as the boundary between untrusted model output and renderable UI.

## Diagnostic Fields

- `code`
- `severity`
- `nodeId`
- `path`
- `message`
- `suggestions`
- `allowedValues`

Not every diagnostic includes every field. `code`, `severity`, `path`, and
`message` are the stable core fields. Node and component fields are included
when the error can be tied to a specific node.

## What Diagnostics Must Answer

- What failed?
- Where did it fail?
- Which registry or runtime capability was involved?
- What can the agent use instead?

## Typical Failures

### Unknown Component

The output references a component type that is not registered:

```json
{
  "root": "chart",
  "nodes": {
    "chart": {
      "type": "RevenueSparkline"
    }
  }
}
```

Fix either the registry or the generated output. If `RevenueSparkline` is a real
application component, define a registry entry for it. If not, repair the output
to use a registered component.

### Invalid Props

The node type is known, but props fail the component schema:

```json
{
  "type": "CustomerTable",
  "props": {
    "dataRef": "queries.unknown.data"
  }
}
```

Check the component `propsSchema`, `prompt.props`, and runtime description. A
prop can be syntactically valid but still fail because it references an
unregistered runtime capability.

### Invalid Children or Slots

The node uses children where the registry entry says `children: "none"`, or it
omits a required slot. Fix the component entry if composition should be allowed;
otherwise repair the output shape.

## Debug Loop

```ts
const verification = verifyDocument(document, {
  registry,
  runtime: runtime.describe(),
});

if (!verification.ok) {
  for (const diagnostic of verification.diagnostics) {
    console.error(diagnostic.code, diagnostic.path, diagnostic.message);
  }
}
```

Use diagnostics to decide whether the bug is in:

1. The registry entry: missing component, weak schema, or missing prompt prop.
2. The runtime description: missing `actionId`, `dataRef`, or `stateKey`.
3. The model output: incorrect component type, props, children, or slots.
4. The prompt: unclear component description or missing example.

## Repair Prompt

Diagnostics can drive automated repair:

```ts
const repairPrompt = compileRepairPrompt({
  registry,
  runtime: runtime.describe(),
  invalidOutput: document,
  diagnostics: verification.diagnostics,
});
```

Always parse and verify repaired output before rendering.

## Related Reference

- [Diagnostics](../reference/diagnostics.md)
- [Prompt API](../reference/prompt-api.md)
- [Schema UI v1](../reference/schema-ui-v1.md)
