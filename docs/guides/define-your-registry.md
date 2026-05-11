# Define Your Registry

The registry is the source of truth for what an agent may generate.

Use `createWaterRegistry` with user-owned component entries:

```ts
const registry = createWaterRegistry({
  components: {
    CustomerTable,
    RevenueChart,
    ExportButton,
  },
});
```

Guidelines:

- Use product-specific component names when those are the application concepts.
- Keep minimal entries simple.
- Add richer schemas, examples, and risk metadata when production safety needs
  them.
- Do not expose raw UI-library props to the model by default.
- Prefer design tokens over arbitrary classes and styles.
