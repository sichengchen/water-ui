<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->

# Water UI Project Rules

Always answer in English unless the user explicitly instructs otherwise.

Use VitePlus as the project toolchain:

- `vp install`
- `vp check`
- `vp test`
- `vp run -r test`
- `vp run -r build`
- `vp pack`

Water UI is registry-first and component-library-neutral. Do not add Water-owned
visual components to `@water-ui/core`; component definitions belong in user
registries or adapter packages such as `@water-ui/adapter-shadcn`.

Commit messages must use Conventional Commits.
