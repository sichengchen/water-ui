# Water UI Documentation

This directory is the source of truth for future implementation work.

Water UI is a registry-first Generative UI library. The registry defines what
agents may use, the verifier checks generated Schema UI against that registry,
renderers consume only VerifiedSchemaUI, and prompts are generated from the same
registry and runtime capabilities.

## Start Here

1. Read `rfc/001-positioning.md`.
2. Read `rfc/002-registry-first-architecture.md`.
3. Read `capability-gates.md`.
4. Use `tasks/gate-*.md` for implementation contracts. Gates 1 through 4 are
   complete; Gate 5 is next.
5. Use `reference/*.md` for public API targets.

## Non-Negotiables

- Water core has no Water-owned visual component definitions.
- shadcn is an optional adapter, not the core abstraction.
- Raw model output is untrusted.
- Renderers accept VerifiedSchemaUI, not arbitrary model output.
- Model output references runtime capabilities; application code implements
  them.
- Prompts are compiled from the same registry used for verification.
