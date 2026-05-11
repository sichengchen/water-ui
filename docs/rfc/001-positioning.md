# RFC 001: Positioning

Water UI is a registry-first Generative UI library for agent-driven applications.

Developers expose application-owned or adapter-owned components through a safe
registry. Water compiles prompts from that registry, verifies agent-generated
Schema UI against it, renders only verified UI, and supports semantic patches
and streaming updates.

Water is not a component library, shadcn wrapper, visual component kit, low-code
platform, or replacement for user design systems.

Water is:

- A schema UI protocol
- A verification system
- A runtime boundary
- A streaming renderer
- A semantic patch engine
- A prompt compiler
- A registry-driven generative UI runtime

Initial support targets React rendering and a shadcn registry adapter. React is
the first renderer target. shadcn is the first adapter. Neither is the core
abstraction.
