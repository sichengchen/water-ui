# Patch Existing UI

Status: available in Gate 7.

Agents edit existing UI through semantic patches.

Flow:

1. Start from VerifiedSchemaUI.
2. Agent outputs `water.ui.patch`.
3. Water validates operation shape.
4. Water applies operations to a copy of the document.
5. Water verifies affected nodes or the full document.
6. Water returns new VerifiedSchemaUI or diagnostics.

Patches must not mutate input documents.

API:

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
