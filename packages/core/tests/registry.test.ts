import { expect, test } from "vite-plus/test";
import {
  createWaterRegistry,
  defineWaterComponent,
  getWaterComponent,
  mergeWaterRegistries,
  serializePromptSafeRegistryDescription,
  summarizeWaterRegistry,
} from "../src/index.ts";

test("creates a registry from developer-defined components", () => {
  const CustomerTable = defineWaterComponent({
    description: "Displays customers with revenue and account owner.",
    propsSchema: { type: "object" },
    children: "none",
  });

  const registry = createWaterRegistry({
    components: {
      CustomerTable,
    },
  });

  expect(registry.ok).toBe(true);
  expect(registry.diagnostics).toEqual([]);
  expect(getWaterComponent(registry, "CustomerTable")?.description).toBe(
    "Displays customers with revenue and account owner.",
  );
});

test("reports duplicate component types when merging presets", () => {
  const first = createWaterRegistry({
    components: [
      {
        type: "MetricCard",
        description: "Internal metric.",
      },
    ],
  });
  const second = createWaterRegistry({
    components: [
      {
        type: "MetricCard",
        description: "Adapter metric.",
      },
    ],
  });

  const merged = mergeWaterRegistries(first, second);

  expect(merged.ok).toBe(false);
  expect(merged.diagnostics).toEqual([
    expect.objectContaining({
      code: "duplicate_component_type",
      componentType: "MetricCard",
    }),
  ]);
});

test("selects prompt summaries by profile", () => {
  const registry = createWaterRegistry({
    components: [
      {
        type: "AdminOnlyPanel",
        description: "Visible to admin profile prompts.",
        profile: "admin",
      },
      {
        type: "SharedMetric",
        description: "Available to every profile.",
      },
    ],
  });

  const summary = summarizeWaterRegistry(registry, { profile: "admin" });

  expect(summary.components.map((component) => component.type)).toEqual([
    "AdminOnlyPanel",
    "SharedMetric",
  ]);
});

test("prompt-safe registry serialization excludes render bindings and raw schemas", () => {
  const registry = createWaterRegistry({
    components: {
      ExportButton: defineWaterComponent({
        description: "Runs a registered export action.",
        propsSchema: { unsafeInternalSchemaObject: true },
        render: () => "not prompt safe",
        examples: [
          {
            intent: "export customers",
            node: {
              type: "ExportButton",
              props: {
                actionId: "exportCustomers",
                label: "Export",
              },
            },
          },
        ],
      }),
    },
  });

  const serialized = serializePromptSafeRegistryDescription(registry);

  expect(serialized).toContain("ExportButton");
  expect(serialized).toContain("exportCustomers");
  expect(serialized).not.toContain("unsafeInternalSchemaObject");
  expect(serialized).not.toContain("not prompt safe");
});

test("core has no Water-owned visual component definitions", () => {
  const registry = createWaterRegistry({ components: {} });

  expect(registry.ok).toBe(true);
  expect(registry.entries).toHaveLength(0);
  expect(summarizeWaterRegistry(registry).componentCount).toBe(0);
});
