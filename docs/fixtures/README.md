# Fixture Map

Fixtures are grouped by gate and protocol area.

Core registry fixtures:

```txt
docs/fixtures/core/registry/
```

Protocol fixtures:

```txt
docs/fixtures/protocol/documents/
docs/fixtures/protocol/patches/
docs/fixtures/protocol/streams/
```

Golden eval fixtures live at repo root:

```txt
goldens/registries/
goldens/documents/
goldens/patches/
goldens/streams/
goldens/prompts/
```

Fixture naming convention:

- `*.valid.json`
- `*.invalid.json`
- `*.valid.jsonl`
- `*.invalid.jsonl`
- `*.registry.ts`
- `*.system.txt`
