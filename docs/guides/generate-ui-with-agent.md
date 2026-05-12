# Generate UI With an Agent

Generation creates a full Wasser document from a user intent. The model output is
untrusted until Wasser parses and verifies it.

## Flow

1. Developer defines a registry.
2. Wasser compiles the system prompt from that registry.
3. Agent outputs a full `wasser.ui.document`.
4. Wasser parses and verifies the document.
5. Wasser returns VerifiedSchemaUI on success.
6. Renderer renders VerifiedSchemaUI.

## Compile the Prompt

```ts
import { compileDocumentPrompt } from "@wasser-ui/prompt";

const systemPrompt = compileDocumentPrompt({
  registry,
  runtime: runtime.describe(),
  userIntent: "Show active customers and their open invoices.",
});
```

The compiled prompt is derived from registry summaries, runtime capabilities,
and the user intent. Application code should not hand-write a second component
contract for the agent; that creates drift.

## Expected Model Output

The agent should return a single Wasser document:

```json
{
  "kind": "wasser.ui.document",
  "version": "wasser.ui.v1",
  "root": "customers_page",
  "nodes": {
    "customers_page": {
      "type": "AdminPage",
      "props": {
        "title": "Active customers"
      },
      "children": ["customers_table"]
    },
    "customers_table": {
      "type": "CustomerTable",
      "props": {
        "dataRef": "queries.customers.data",
        "columns": [
          { "key": "name", "label": "Name" },
          { "key": "status", "label": "Status" },
          { "key": "owner", "label": "Owner" }
        ]
      }
    }
  }
}
```

## Parse and Verify

```ts
import { parseSchemaUIDocument, verifyDocument } from "@wasser-ui/core";

const parsed = parseSchemaUIDocument(modelOutput);

if (!parsed.ok) {
  return showDiagnostics(parsed.diagnostics);
}

const verification = verifyDocument(parsed.value, {
  registry,
  runtime: runtime.describe(),
});

if (!verification.ok) {
  return showDiagnostics(verification.diagnostics);
}

render(verification.ui);
```

`verifyDocument` checks component types, props schemas, children, slots, and
runtime references. On success it returns immutable `VerifiedSchemaUI`.

## Render

```tsx
import { WasserRenderer, WasserRuntimeProvider } from "@wasser-ui/react";

<WasserRuntimeProvider registry={registry} runtime={runtime}>
  <WasserRenderer ui={verification.ui} />
</WasserRuntimeProvider>;
```

The renderer consumes `VerifiedSchemaUI`, not raw model output.

## Repair Loop

When verification fails, diagnostics can be fed into a repair prompt:

```ts
import { compileRepairPrompt } from "@wasser-ui/prompt";

const repairPrompt = compileRepairPrompt({
  registry,
  runtime: runtime.describe(),
  invalidOutput: parsed.ok ? parsed.value : modelOutput,
  diagnostics: parsed.ok ? verification.diagnostics : parsed.diagnostics,
});
```

Run repair as a separate model call, then parse and verify the repaired output
the same way.

## Related Reference

- [Prompt API](../reference/prompt-api.md)
- [Schema UI v1](../reference/schema-ui-v1.md)
- [Renderer API](../reference/renderer-api.md)
