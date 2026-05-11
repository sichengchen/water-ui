# VerifiedSchemaUI Reference

Status: planned for Gate 3.

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
