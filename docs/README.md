# Wasser UI Documentation

Wasser UI is a registry-first generative UI toolkit. The registry defines what
agents may use, the verifier checks generated Schema UI against that registry,
renderers consume only `VerifiedSchemaUI`, and prompts are generated from the
same registry and runtime capabilities.

## Start Here

1. Read `guides/define-your-registry.md`.
2. Read `guides/generate-ui-with-agent.md`.
3. Read `guides/register-actions.md`.
4. Use `guides/use-the-shadcn-adapter.md` when working with shadcn.
5. Use `reference/*.md` for public API and protocol details.
6. Use `rfc/*.md` for architecture notes and design rationale.

## Non-Negotiables

- Wasser core has no Wasser-owned visual component definitions.
- shadcn is an optional adapter, not the core abstraction.
- Raw model output is untrusted.
- Renderers accept `VerifiedSchemaUI`, not arbitrary model output.
- React and Vue renderers share the same registry-first rendering contract.
- Model output references runtime capabilities; application code implements
  them.
- Prompts are compiled from the same registry used for verification.
