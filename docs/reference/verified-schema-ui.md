# VerifiedSchemaUI Reference

Status: implemented in Gate 3.

VerifiedSchemaUI is the branded, safe rendering boundary.

Verifier result target:

```ts
type VerificationResult =
  | {
      ok: true;
      ui: VerifiedSchemaUI;
      diagnostics: Diagnostic[];
    }
  | {
      ok: false;
      diagnostics: Diagnostic[];
    };
```

Rendering APIs consume `VerifiedSchemaUI`, not raw Schema UI.

Implemented Gate 3 exports:

- `verifyDocument`
- `isVerifiedSchemaUI`
- `assertVerifiedSchemaUI`

Verifier responsibilities:

- Normalize and verify document shape.
- Verify that the root, children, and slots reference nodes in the document map.
- Reject cycles and unreachable nodes.
- Reject component types that are absent from the active registry.
- Validate children and slot policies from registry entries.
- Validate props with the registry entry's Zod `propsSchema`.
- Validate `actionId`, `dataRef`, and `stateKey` references against runtime
  capabilities.
- Return stable diagnostics with JSON paths and repair metadata where possible.
