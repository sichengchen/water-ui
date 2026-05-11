# Prompt API Reference

Status: planned for Gate 9.

Prompt compiler target:

```ts
const systemPrompt = water.prompt.compileSystemPrompt({
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
