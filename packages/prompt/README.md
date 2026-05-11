# @water-ui/prompt

Prompt compiler package for Water UI.

This package provides:

- system prompt compiler
- registry summarizer
- profile selector
- document generation prompt
- patch prompt
- stream prompt
- repair prompt
- example selector

Prompts are generated from the same registry used for verification.

## Usage

```ts
import { compileSystemPrompt } from "@water-ui/prompt";

const prompt = compileSystemPrompt({
  mode: "document",
  profile: "admin",
  registry,
  runtime: runtime.describe(),
});
```

Available compilers:

- `compileSystemPrompt`
- `compileDocumentPrompt`
- `compilePatchPrompt`
- `compileStreamPrompt`
- `compileRepairPrompt`

The compiler uses prompt-safe registry summaries and runtime capability lists.
It does not include render functions or raw implementation internals.
