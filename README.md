# Water UI

Water UI is a registry-first Generative UI library for agent-driven applications.

Developers expose their own components through a registry. Water uses that
registry to compile prompts, verify model-generated Schema UI, render only
verified UI, and support patches and streaming updates.

Water core is component-library-neutral. shadcn is planned as the first adapter,
not the core abstraction.

## Development

- Install dependencies:

```bash
vp install
```

- Check, test, and build:

```bash
vp run ready
```

## First Implementation Gate

The active gate is Gate 1: Registry API.

Implemented now:

- `@water-ui/core`
- `defineWaterComponent`
- `createWaterRegistry`
- registry merge diagnostics
- prompt-safe registry summaries
- profile-aware registry selection

Intentionally not implemented yet:

- React renderer
- shadcn adapter
- runtime capability execution
- semantic patch engine
- streaming engine
- DevTools
