import { defineWaterComponent } from "../src/index.ts";
import type { WaterRegistryInput } from "../src/index.ts";

export const CustomerTable = defineWaterComponent({
  description: "Displays customers with status, revenue, and account owner.",
  propsSchema: { type: "object", required: ["dataRef", "columns"] },
  children: "none",
  prompt: {
    props: [
      {
        name: "dataRef",
        description: 'Must reference "queries.customers.data".',
        required: true,
        allowedValues: ["queries.customers.data"],
      },
      {
        name: "columns",
        description: "Customer table columns with key and label.",
        required: true,
      },
    ],
  },
  examples: [
    {
      intent: "show customers in a table",
      node: {
        type: "CustomerTable",
        props: {
          dataRef: "queries.customers.data",
          columns: [{ key: "name", label: "Name" }],
        },
      },
    },
  ],
});

export const RevenueChart = defineWaterComponent({
  description: "Shows revenue over time for the selected customer segment.",
  children: "none",
  profile: ["admin", "analyst"],
});

export const ExportButton = defineWaterComponent({
  description: "Runs a registered export action.",
  children: "none",
  risk: "low",
  prompt: {
    props: [
      {
        name: "actionId",
        description: 'Must be "exportCustomers".',
        required: true,
        allowedValues: ["exportCustomers"],
      },
    ],
  },
  render: () => "render bindings are not prompt-safe",
});

export const customAdminRegistryInput: WaterRegistryInput = {
  CustomerTable,
  RevenueChart,
};

export const adapterPresetRegistryInput: WaterRegistryInput = [
  {
    type: "ExportButton",
    description: "Adapter-provided action button.",
    children: "none",
  },
];

export const duplicateRegistryInput: WaterRegistryInput = [
  {
    type: "CustomerTable",
    description: "Duplicate table from another preset.",
  },
];
