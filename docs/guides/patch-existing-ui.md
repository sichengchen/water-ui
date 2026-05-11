# Patch Existing UI

Status: planned for Gate 7.

Agents edit existing UI through semantic patches.

Flow:

1. Start from VerifiedSchemaUI.
2. Agent outputs `water.ui.patch`.
3. Water validates operation shape.
4. Water applies operations to a copy of the document.
5. Water verifies affected nodes or the full document.
6. Water returns new VerifiedSchemaUI or diagnostics.

Patches must not mutate input documents.
