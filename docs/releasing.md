# Releasing Wasser UI

Wasser UI publishes framework-specific packages under the `@wasser-ui` npm
scope. The workspace root is private and is not published.

## Prerequisites

- An npm account with publish access to the `@wasser-ui` scope.
- Two-factor authentication enabled, or a granular publish token that is allowed
  to publish public packages.
- A clean git working tree.

## First Alpha Release

Run the full local release check:

```sh
vp install
vp run release:check
```

Review the dry-run publish output:

```sh
vp run publish:dry-run
```

Publish the first alpha packages:

```sh
vp run publish:alpha
```

The alpha command publishes only `packages/*` with the `alpha` dist tag. Private
example workspaces and the private root workspace are excluded.

## Package Contents

Each publishable package should include only:

- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

The package manifests expose ESM and TypeScript declarations through `exports`
and `types`.

## Promoting to Latest

After testing installs from the alpha tag in a clean application, publish a
stable version and use the default `latest` tag.

```sh
pnpm -r --filter './packages/*' publish --access public
```
