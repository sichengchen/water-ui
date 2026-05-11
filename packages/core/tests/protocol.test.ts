import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import {
  normalizeSchemaUIDocument,
  parseSchemaUIDocument,
  parseSchemaUIPatch,
  parseSchemaUIStreamEvent,
} from "../src/index.ts";
import type { SchemaUIParseResult } from "../src/index.ts";

const fixtureRoot = new URL("../../../docs/fixtures/protocol/", import.meta.url);

test("accepts valid water.ui.v1 documents from fixtures", () => {
  const result = parseSchemaUIDocument(readFixture("documents/basic.valid.json"));
  const document = expectOk(result);

  expect(result.ok).toBe(true);
  expect(document.root).toBe("page");
  expect(document.nodes.page?.type).toBe("AdminPage");
  expect(document.nodes.table?.props).toEqual({
    dataRef: "queries.customers.data",
  });
  expect(result.diagnostics).toEqual([]);
});

test("rejects invalid document protocol versions with stable diagnostics", () => {
  const result = parseSchemaUIDocument(readFixture("documents/invalid-version.invalid.json"));

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    {
      code: "invalid_protocol_version",
      severity: "error",
      path: "$.version",
      message: "Protocol version must be 'water.ui.v1'.",
    },
  ]);
});

test("rejects invalid document shapes without throwing", () => {
  const result = parseSchemaUIDocument(readFixture("documents/invalid-shape.invalid.json"));

  expect(result.ok).toBe(false);
  expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
    "invalid_document_root",
    "invalid_node_type",
    "invalid_node_children",
  ]);
});

test("normalizes document node order and trims protocol strings", () => {
  const result = normalizeSchemaUIDocument({
    kind: "water.ui.document",
    version: "water.ui.v1",
    root: " page ",
    nodes: {
      " table ": {
        type: " CustomerTable ",
      },
      page: {
        type: " AdminPage ",
        children: [" table "],
      },
    },
  });
  const document = expectOk(result);

  expect(result.ok).toBe(true);
  expect(document.root).toBe("page");
  expect(Object.keys(document.nodes)).toEqual(["page", "table"]);
  expect(document.nodes.page?.children).toEqual(["table"]);
  expect(document.nodes.table?.type).toBe("CustomerTable");
});

test("does not verify registry component existence while parsing documents", () => {
  const result = parseSchemaUIDocument({
    kind: "water.ui.document",
    version: "water.ui.v1",
    root: "root",
    nodes: {
      root: {
        type: "NotRegisteredYet",
      },
    },
  });
  const document = expectOk(result);

  expect(result.ok).toBe(true);
  expect(document.nodes.root?.type).toBe("NotRegisteredYet");
});

test("parses semantic patch fixtures", () => {
  const result = parseSchemaUIPatch(readFixture("patches/upsert-and-insert.valid.json"));
  const patch = expectOk(result);

  expect(result.ok).toBe(true);
  expect(patch.target).toBe("page");
  expect(patch.ops).toHaveLength(2);
  expect(patch.ops[0]).toEqual({
    op: "upsertNode",
    id: "status_filter",
    node: {
      type: "StatusFilter",
      props: {
        stateKey: "filters.status",
      },
    },
  });
});

test("rejects invalid semantic patch operations", () => {
  const result = parseSchemaUIPatch(readFixture("patches/invalid-op.invalid.json"));

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    {
      code: "invalid_patch_operation",
      severity: "error",
      path: "$.ops[0].op",
      message: "Unsupported patch operation 'teleportNode'.",
    },
  ]);
});

test("parses JSONL stream event fixtures", () => {
  const results = readJsonlFixture("streams/basic.valid.jsonl").map((line) =>
    parseSchemaUIStreamEvent(line),
  );

  expect(results.every((result) => result.ok)).toBe(true);
  expect(results.map((result) => (result.ok ? result.value.kind : undefined))).toEqual([
    "node.upsert",
    "node.upsert",
    "child.append",
    "done",
  ]);
});

test("rejects invalid stream events with stable diagnostics", () => {
  const [, badSeqResult, badKindResult] = readJsonlFixture(
    "streams/invalid-event.invalid.jsonl",
  ).map((line) => parseSchemaUIStreamEvent(line));

  expect(badSeqResult.ok).toBe(false);
  expect(badSeqResult.diagnostics).toEqual([
    {
      code: "invalid_stream_seq",
      severity: "error",
      path: "$.seq",
      message: "Stream event seq must be a non-negative integer.",
    },
  ]);
  expect(badKindResult.ok).toBe(false);
  expect(badKindResult.diagnostics).toEqual([
    {
      code: "invalid_stream_event_kind",
      severity: "error",
      path: "$.kind",
      message: "Unsupported stream event kind 'unknown.event'.",
    },
  ]);
});

test("reports invalid JSON input as diagnostics", () => {
  const result = parseSchemaUIDocument("{not-json");

  expect(result.ok).toBe(false);
  expect(result.diagnostics).toEqual([
    {
      code: "invalid_json",
      severity: "error",
      path: "$",
      message: "Protocol input string must contain valid JSON.",
    },
  ]);
});

function readFixture(path: string): string {
  return readFileSync(new URL(path, fixtureRoot), "utf8");
}

function readJsonlFixture(path: string): string[] {
  return readFixture(path)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function expectOk<T>(result: SchemaUIParseResult<T>): T {
  if (!result.ok) {
    throw new Error(`Expected parse success: ${JSON.stringify(result.diagnostics)}`);
  }

  return result.value;
}
