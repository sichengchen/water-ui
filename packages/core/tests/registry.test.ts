import { expect, test } from "vite-plus/test";
import {
  adapterPresetRegistryInput,
  customAdminRegistryInput,
  duplicateRegistryInput,
  ExportButton,
} from "../fixtures/registry.ts";
import {
  createWaterRegistry,
  defineWaterComponent,
  getWaterComponent,
  listWaterComponents,
  mergeWaterRegistries,
  selectWaterRegistryEntries,
  serializePromptSafeRegistryDescription,
  summarizeWaterRegistry,
} from "../src/index.ts";
import type { WaterRegistryInput } from "../src/index.ts";

test("creates a registry from developer-defined components", () => {
  const registry = createWaterRegistry({
    components: customAdminRegistryInput,
  });

  expect(registry.ok).toBe(true);
  expect(registry.diagnostics).toEqual([]);
  expect(getWaterComponent(registry, "CustomerTable")?.description).toBe(
    "Displays customers with status, revenue, and account owner.",
  );
});

test("defines frozen registry entries", () => {
  const InternalMetric = defineWaterComponent({
    description: "Displays an internal metric.",
  });

  expect(Object.isFrozen(InternalMetric)).toBe(true);
});

test("merges registry presets in stable order", () => {
  const appRegistry = createWaterRegistry({ components: customAdminRegistryInput });
  const adapterRegistry = createWaterRegistry({ components: adapterPresetRegistryInput });
  const merged = mergeWaterRegistries(appRegistry, adapterRegistry);

  expect(merged.ok).toBe(true);
  expect(listWaterComponents(merged).map((entry) => entry.type)).toEqual([
    "CustomerTable",
    "RevenueChart",
    "ExportButton",
  ]);
});

test("reports duplicate component types when merging presets", () => {
  const appRegistry = createWaterRegistry({ components: customAdminRegistryInput });
  const duplicateRegistry = createWaterRegistry({ components: duplicateRegistryInput });

  const merged = mergeWaterRegistries(appRegistry, duplicateRegistry);

  expect(merged.ok).toBe(false);
  expect(merged.diagnostics).toEqual([
    expect.objectContaining({
      code: "duplicate_component_type",
      componentType: "CustomerTable",
    }),
  ]);
});

test("reports mismatched keyed component types", () => {
  const registry = createWaterRegistry({
    components: {
      CustomerTable: {
        type: "OrdersTable",
        description: "Wrong declared type.",
      },
    },
  });

  expect(registry.ok).toBe(false);
  expect(registry.entries).toEqual([]);
  expect(registry.diagnostics).toEqual([
    expect.objectContaining({
      code: "component_type_mismatch",
      componentType: "OrdersTable",
      path: "$.components.CustomerTable.type",
    }),
  ]);
});

test("reports invalid registry entries without throwing", () => {
  const invalidInput = [
    null,
    { type: "", description: "Missing type." },
    { type: "NoDescription" },
    { type: "BadChildren", description: "Bad children.", children: "anything" },
    { type: "BadSlots", description: "Bad slots.", slots: { "": {} } },
  ] as unknown as WaterRegistryInput;

  const registry = createWaterRegistry({ components: invalidInput });

  expect(registry.ok).toBe(false);
  expect(registry.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
    "invalid_component_entry",
    "empty_component_type",
    "missing_component_description",
    "invalid_children_policy",
    "invalid_slot_policy",
  ]);
});

test("selects registry entries by profile while retaining shared entries", () => {
  const registry = createWaterRegistry({
    components: [
      {
        type: "AdminOnlyPanel",
        description: "Visible to admin profile prompts.",
        profile: "admin",
      },
      {
        type: "AnalystOnlyChart",
        description: "Visible to analyst profile prompts.",
        profile: "analyst",
      },
      {
        type: "SharedMetric",
        description: "Available to every profile.",
      },
    ],
  });

  expect(selectWaterRegistryEntries(registry, "admin").map((entry) => entry.type)).toEqual([
    "AdminOnlyPanel",
    "SharedMetric",
  ]);
});

test("summarizes prompt-safe registry details", () => {
  const registry = createWaterRegistry({
    components: {
      ExportButton,
    },
  });

  const summary = summarizeWaterRegistry(registry);

  expect(summary).toEqual({
    componentCount: 1,
    components: [
      expect.objectContaining({
        type: "ExportButton",
        description: "Runs a registered export action.",
        children: "none",
        props: [
          {
            name: "actionId",
            description: 'Must be "exportCustomers".',
            required: true,
            allowedValues: ["exportCustomers"],
          },
        ],
        risk: "low",
      }),
    ],
  });
});

test("prompt-safe registry serialization excludes render bindings and raw schemas", () => {
  const registry = createWaterRegistry({
    components: {
      ExportButton,
    },
  });

  const serialized = serializePromptSafeRegistryDescription(registry);

  expect(serialized).toContain("ExportButton");
  expect(serialized).toContain("exportCustomers");
  expect(serialized).not.toContain("propsSchema");
  expect(serialized).not.toContain("render bindings are not prompt-safe");
});

test("core has no Water-owned visual component definitions", () => {
  const registry = createWaterRegistry({ components: {} });

  expect(registry.ok).toBe(true);
  expect(registry.entries).toHaveLength(0);
  expect(summarizeWaterRegistry(registry).componentCount).toBe(0);
});
