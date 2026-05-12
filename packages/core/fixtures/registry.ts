import { z } from "zod";
import { defineWasserComponent } from "../src/index.ts";
import type { WasserRegistryInput } from "../src/index.ts";

export const CustomerTable = defineWasserComponent({
  description: "Displays customers with status, revenue, and account owner.",
  propsSchema: z
    .object({
      dataRef: z.string(),
      columns: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
        }),
      ),
    })
    .strict(),
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

export const RevenueChart = defineWasserComponent({
  description: "Shows revenue over time for the selected customer segment.",
  children: "none",
  profile: ["admin", "analyst"],
});

export const ExportButton = defineWasserComponent({
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

export const customAdminRegistryInput: WasserRegistryInput = {
  CustomerTable,
  RevenueChart,
};

export const adapterPresetRegistryInput: WasserRegistryInput = [
  {
    type: "ExportButton",
    description: "Adapter-provided action button.",
    children: "none",
  },
];

export const duplicateRegistryInput: WasserRegistryInput = [
  {
    type: "CustomerTable",
    description: "Duplicate table from another preset.",
  },
];
