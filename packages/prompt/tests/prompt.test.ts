import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { z } from "zod";
import { createWasserRegistry, verifyDocument } from "@wasser-ui/core";
import {
  compileDocumentPrompt,
  compilePatchPrompt,
  compileRepairPrompt,
  compileStreamPrompt,
  compileSystemPrompt,
} from "../src/index.ts";

const goldenRoot = new URL("../../../goldens/prompts/", import.meta.url);

const registry = createWasserRegistry({
  components: {
    AdminPage: {
      description: "Admin page shell.",
      children: "nodes",
      profile: "admin",
      prompt: {
        props: [
          {
            name: "title",
            description: "Page title.",
          },
        ],
      },
    },
    CustomerTable: {
      description: "Displays customers.",
      children: "none",
      propsSchema: z.object({ dataRef: z.string() }).strict(),
      prompt: {
        props: [
          {
            name: "dataRef",
            description: "Customer query data ref.",
            required: true,
            allowedValues: ["queries.customers.data"],
          },
        ],
      },
      examples: [
        {
          intent: "show customers",
          node: {
            type: "CustomerTable",
            props: {
              dataRef: "queries.customers.data",
            },
          },
        },
      ],
    },
    AnalystChart: {
      description: "Analyst-only chart.",
      children: "none",
      profile: "analyst",
    },
    ExportButton: {
      description: "Runs a registered export action.",
      children: "none",
      risk: "low",
      prompt: {
        props: [
          {
            name: "actionId",
            description: "Registered export action.",
            required: true,
            allowedValues: ["exportCustomers"],
          },
        ],
      },
      render: () => "not prompt safe",
    },
  },
});

const runtime = {
  actions: ["exportCustomers"],
  dataRefs: ["queries.customers.data"],
  stateKeys: ["filters.status"],
  mutations: ["deleteCustomer"],
};

test("compiles system prompt from registry and runtime capabilities", () => {
  const prompt = compileSystemPrompt({
    mode: "document",
    profile: "admin",
    registry,
    runtime,
  });

  expect(prompt).toContain("Mode: document");
  expect(prompt).toContain("- AdminPage: Admin page shell.");
  expect(prompt).toContain("- CustomerTable: Displays customers.");
  expect(prompt).toContain("- ExportButton: Runs a registered export action.");
  expect(prompt).not.toContain("AnalystChart");
  expect(prompt).toContain("- actions: exportCustomers");
  expect(prompt).toContain("- dataRefs: queries.customers.data");
  expect(prompt).toContain("- stateKeys: filters.status");
  expect(prompt).toContain("- mutations: deleteCustomer");
  expect(prompt).toContain("Do not output JSX.");
  expect(prompt).not.toContain("not prompt safe");
});

test("compiles mode-specific document, patch, and stream prompts", () => {
  expect(compileDocumentPrompt({ registry, runtime })).toContain(
    'Return exactly one JSON object with kind "wasser.ui.document".',
  );
  expect(compilePatchPrompt({ registry, runtime })).toContain(
    "Use semantic operations instead of regenerating the full document.",
  );
  expect(compileStreamPrompt({ registry, runtime })).toContain(
    "Return newline-delimited JSON events only.",
  );
});

test("includes current document context for patch prompts", () => {
  const prompt = compilePatchPrompt({
    registry,
    runtime,
    currentDocument: {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "page",
      nodes: {
        page: {
          type: "AdminPage",
        },
      },
    },
  });

  expect(prompt).toContain("Current UI document:");
  expect(prompt).toContain('"root": "page"');
});

test("generates repair prompt from diagnostics", () => {
  const verification = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "table",
      nodes: {
        table: {
          type: "CustomerTable",
          props: {
            dataRef: "queries.unknown.data",
          },
        },
      },
    },
    { registry, runtime },
  );
  expect(verification.ok).toBe(false);
  if (verification.ok) {
    throw new Error("Expected invalid document.");
  }

  const prompt = compileRepairPrompt({
    registry,
    runtime,
    invalidOutput: {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "table",
      nodes: {
        table: {
          type: "CustomerTable",
          props: {
            dataRef: "queries.unknown.data",
          },
        },
      },
    },
    diagnostics: verification.diagnostics,
  });

  expect(prompt).toContain("Mode: repair");
  expect(prompt).toContain("Diagnostics:");
  expect(prompt).toContain("invalid_runtime_data_ref");
  expect(prompt).toContain("Invalid output:");
  expect(prompt).toContain("queries.unknown.data");
});

test("matches golden system prompt fixture", () => {
  const prompt = compileSystemPrompt({
    mode: "document",
    profile: "admin",
    registry,
    runtime,
  });

  expect(prompt).toBe(readGolden("custom-admin.system.txt"));
});

test("matches golden repair prompt fixture", () => {
  const diagnostics = [
    {
      code: "invalid_component_props",
      severity: "error" as const,
      path: "$.nodes.table.props.dataRef",
      message: "Expected allowed dataRef.",
      nodeId: "table",
      componentType: "CustomerTable",
    },
  ];
  const prompt = compileRepairPrompt({
    registry,
    runtime,
    invalidOutput: {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: "table",
      nodes: {
        table: {
          type: "CustomerTable",
          props: {
            dataRef: "queries.unknown.data",
          },
        },
      },
    },
    diagnostics,
  });

  expect(prompt).toBe(readGolden("repair-invalid-props.txt"));
});

function readGolden(path: string): string {
  return readFileSync(new URL(path, goldenRoot), "utf8").trimEnd();
}
