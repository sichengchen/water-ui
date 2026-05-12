# RFC 001: Positioning

Wasser UI is a registry-first Generative UI library for agent-driven applications.

Developers expose application-owned or adapter-owned components through a safe
registry. Wasser compiles prompts from that registry, verifies agent-generated
Schema UI against it, renders only verified UI, and supports semantic patches
and streaming updates.

Wasser is not a component library, shadcn wrapper, visual component kit, low-code
platform, or replacement for user design systems.

Wasser is:

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
