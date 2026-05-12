# Patch Existing UI

Agents edit existing UI through semantic patches.
Use patches when the user wants to modify an existing verified UI instead of
regenerating a full document.

## Flow

1. Start from VerifiedSchemaUI.
2. Agent outputs `water.ui.patch`.
3. Water validates operation shape.
4. Water applies operations to a copy of the document.
5. Water verifies affected nodes or the full document.
6. Water returns new VerifiedSchemaUI or diagnostics.

Patches must not mutate input documents.

## API

```ts
import { applyPatch, createPatchHistory } from "@water-ui/core";

const history = createPatchHistory();
const result = applyPatch(verifiedUi, patch, {
  registry,
  runtime: runtime.describe(),
  history,
});

if (result.ok) {
  render(result.ui);
} else {
  showDiagnostics(result.diagnostics);
}
```

Supported operations:

- `upsertNode`
- `removeNode`
- `replaceNode`
- `updateProps`
- `appendChild`
- `prependChild`
- `insertChildBefore`
- `insertChildAfter`
- `removeChild`
- `moveNode`
- `replaceChildren`
- `setSlot`
- `unsetSlot`

Invalid operations return structured diagnostics and do not commit. After the
operations apply to a cloned document, Water runs full verification before
returning a new `VerifiedSchemaUI`.

## Patch Prompt

Use a patch prompt when asking a model to edit current UI:

```ts
import { compilePatchPrompt } from "@water-ui/prompt";

const prompt = compilePatchPrompt({
  registry,
  runtime: runtime.describe(),
  currentDocument: verifiedUi,
  userIntent: "Add a status filter above the customer table.",
});
```

The prompt includes the current document, registry, runtime capabilities, and
patch output instructions.

## Example Patch

```json
{
  "kind": "water.ui.patch",
  "version": "water.ui.v1",
  "target": "customers_page",
  "ops": [
    {
      "op": "upsertNode",
      "id": "status_filter",
      "node": {
        "type": "StatusFilter",
        "props": {
          "stateKey": "filters.customerStatus"
        }
      }
    },
    {
      "op": "insertChildBefore",
      "parent": "customers_page",
      "before": "customers_table",
      "child": "status_filter"
    }
  ]
}
```

## When to Patch vs Regenerate

Use a patch when:

- the user asks for a small edit to existing UI
- preserving node IDs and state matters
- the current UI is already verified and rendered

Use a full document when:

- the user asks for a new page or full replacement
- the target structure is simpler to regenerate
- the existing document is invalid or no longer relevant

## Related Reference

- [Schema UI v1](../reference/schema-ui-v1.md)
- [Prompt API](../reference/prompt-api.md)
- [Diagnostics](../reference/diagnostics.md)
