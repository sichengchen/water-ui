import { expect, test } from "vite-plus/test";
import {
  adapterPresetRegistryInput,
  customAdminRegistryInput,
  duplicateRegistryInput,
  ExportButton,
} from "../fixtures/registry.ts";
import {
  createWasserRegistry,
  defineWasserComponent,
  getWasserComponent,
  listWasserComponents,
  mergeWasserRegistries,
  selectWasserRegistryEntries,
  serializePromptSafeRegistryDescription,
  summarizeWasserRegistry,
} from "../src/index.ts";
import type { WasserRegistryInput } from "../src/index.ts";

test("creates a registry from developer-defined components", () => {
  const registry = createWasserRegistry({
    components: customAdminRegistryInput,
  });

  expect(registry.ok).toBe(true);
  expect(registry.diagnostics).toEqual([]);
  expect(getWasserComponent(registry, "CustomerTable")?.description).toBe(
    "Displays customers with status, revenue, and account owner.",
  );
});

test("defines frozen registry entries", () => {
  const InternalMetric = defineWasserComponent({
    description: "Displays an internal metric.",
  });

  expect(Object.isFrozen(InternalMetric)).toBe(true);
});

test("merges registry presets in stable order", () => {
  const appRegistry = createWasserRegistry({ components: customAdminRegistryInput });
  const adapterRegistry = createWasserRegistry({ components: adapterPresetRegistryInput });
  const merged = mergeWasserRegistries(appRegistry, adapterRegistry);

  expect(merged.ok).toBe(true);
  expect(listWasserComponents(merged).map((entry) => entry.type)).toEqual([
    "CustomerTable",
    "RevenueChart",
    "ExportButton",
  ]);
});

test("reports duplicate component types when merging presets", () => {
  const appRegistry = createWasserRegistry({ components: customAdminRegistryInput });
  const duplicateRegistry = createWasserRegistry({ components: duplicateRegistryInput });

  const merged = mergeWasserRegistries(appRegistry, duplicateRegistry);

  expect(merged.ok).toBe(false);
  expect(merged.diagnostics).toEqual([
    expect.objectContaining({
      code: "duplicate_component_type",
      componentType: "CustomerTable",
    }),
  ]);
});

test("reports mismatched keyed component types", () => {
  const registry = createWasserRegistry({
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
  ] as unknown as WasserRegistryInput;

  const registry = createWasserRegistry({ components: invalidInput });

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
  const registry = createWasserRegistry({
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

  expect(selectWasserRegistryEntries(registry, "admin").map((entry) => entry.type)).toEqual([
    "AdminOnlyPanel",
    "SharedMetric",
  ]);
});

test("summarizes prompt-safe registry details", () => {
  const registry = createWasserRegistry({
    components: {
      ExportButton,
    },
  });

  const summary = summarizeWasserRegistry(registry);

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
  const registry = createWasserRegistry({
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

test("core has no Wasser-owned visual component definitions", () => {
  const registry = createWasserRegistry({ components: {} });

  expect(registry.ok).toBe(true);
  expect(registry.entries).toHaveLength(0);
  expect(summarizeWasserRegistry(registry).componentCount).toBe(0);
});
