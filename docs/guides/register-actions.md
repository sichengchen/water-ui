# Register Actions

Status: planned for Gate 6.

The model may reference actions. The application implements actions.

Runtime target:

```ts
runtime.actions.register({
  id: "exportCustomers",
  label: "Export customers",
  risk: "low",
  inputSchema: EmptyInputSchema,
  handler: async () => {
    return api.customers.export();
  },
});
```

Schema UI reference:

```json
{
  "type": "ExportButton",
  "props": {
    "label": "Export customers",
    "actionId": "exportCustomers"
  }
}
```

Unknown actions are blocked by verification or runtime guards.
