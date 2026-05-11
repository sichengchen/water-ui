# Diagnostics Reference

Diagnostics are structured and suitable for repair loops.

Example:

```json
{
  "code": "unknown_component_type",
  "severity": "error",
  "nodeId": "table_1",
  "path": "$.nodes.table_1.type",
  "message": "Component type 'DataTable' is not registered.",
  "suggestions": ["CustomerTable", "OrdersTable"]
}
```

Diagnostic principles:

- Do not throw for normal verification errors.
- Keep diagnostic ordering stable.
- Include node IDs and JSON paths where possible.
- Include allowed values for unknown runtime references.
- Include repair metadata when available.
