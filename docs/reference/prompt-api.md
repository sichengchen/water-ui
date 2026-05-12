# Prompt API Reference

Prompt compiler target:

```ts
const systemPrompt = wasser.prompt.compileSystemPrompt({
  mode: "document",
  profile: "admin",
  registry,
  runtime,
});
```

Modes:

- `document`
- `patch`
- `stream`
- `repair`

The prompt is compiled from the same registry and runtime capabilities used for
verification.

## API

```ts
import {
  compileDocumentPrompt,
  compilePatchPrompt,
  compileRepairPrompt,
  compileStreamPrompt,
  compileSystemPrompt,
} from "@wasser-ui/prompt";
```

System prompt:

```ts
const systemPrompt = compileSystemPrompt({
  mode: "document",
  profile: "admin",
  registry,
  runtime: runtime.describe(),
});
```

Document generation:

```ts
compileDocumentPrompt({ registry, runtime: runtime.describe() });
```

Patch generation:

```ts
compilePatchPrompt({
  registry,
  runtime: runtime.describe(),
  currentDocument: verifiedUi,
});
```

Stream generation:

```ts
compileStreamPrompt({ registry, runtime: runtime.describe() });
```

Repair:

```ts
compileRepairPrompt({
  registry,
  runtime: runtime.describe(),
  invalidOutput,
  diagnostics,
});
```

Compiler output includes prompt-safe component summaries, profile-filtered
registry entries, allowed runtime action IDs, data refs, state keys, forbidden
behavior rules, and mode-specific output requirements.
