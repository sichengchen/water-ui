import { expect, test } from "vite-plus/test";
import { z } from "zod";
import {
  applyStreamEvent,
  createStreamState,
  createWaterRegistry,
  finalizeStreamState,
  parseStreamEvent,
} from "../src/index.ts";

const registry = createWaterRegistry({
  components: {
    AdminPage: {
      description: "Admin page shell.",
      children: "nodes",
      propsSchema: z.object({ title: z.string().optional() }).strict(),
    },
    CustomerTable: {
      description: "Customer table.",
      children: "none",
      propsSchema: z
        .object({
          dataRef: z.string(),
        })
        .strict(),
    },
    StatusFilter: {
      description: "Status filter.",
      children: "none",
      propsSchema: z.object({ stateKey: z.string() }).strict(),
    },
  },
});

const runtime = {
  dataRefs: ["queries.customers.data"],
  stateKeys: ["filters.status"],
};

test("consumes ordered events into progressive verified state", () => {
  let state = createStreamState();

  let result = applyStreamEvent(
    state,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "AdminPage",
      props: {
        title: "Customers",
      },
    },
    { registry, runtime },
  );
  state = result.state;

  expect(result.ui?.root).toBe("page");
  expect(result.ui?.nodes.page?.type).toBe("AdminPage");

  result = applyStreamEvent(
    state,
    {
      seq: 2,
      kind: "node.upsert",
      id: "table",
      type: "CustomerTable",
      props: {
        dataRef: "queries.customers.data",
      },
    },
    { registry, runtime },
  );
  state = result.state;

  expect(result.diagnostics).toEqual([]);
  expect(result.ui?.nodes.table).toBeUndefined();

  result = applyStreamEvent(
    state,
    {
      seq: 3,
      kind: "child.append",
      parent: "page",
      child: "table",
    },
    { registry, runtime },
  );
  state = result.state;

  expect(result.ui?.nodes.page?.children).toEqual(["table"]);
  expect(result.ui?.nodes.table?.type).toBe("CustomerTable");

  result = finalizeStreamState(state, { registry, runtime });

  expect(result.state.done).toBe(true);
  expect(result.ui?.nodes.page?.children).toEqual(["table"]);
  expect(result.diagnostics).toEqual([]);
});

test("rejects duplicate sequence numbers deterministically", () => {
  let state = createStreamState();
  state = applyStreamEvent(
    state,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "AdminPage",
    },
    { registry, runtime },
  ).state;

  const result = applyStreamEvent(
    state,
    {
      seq: 1,
      kind: "node.upsert",
      id: "table",
      type: "CustomerTable",
      props: {
        dataRef: "queries.customers.data",
      },
    },
    { registry, runtime },
  );

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      code: "duplicate_stream_seq",
      seq: 1,
    }),
  ]);
  expect(result.state.document.nodes.table).toBeUndefined();
});

test("buffers unresolved child references and flushes them when nodes arrive", () => {
  let state = createStreamState();
  state = applyStreamEvent(
    state,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "AdminPage",
    },
    { registry, runtime },
  ).state;

  const buffered = applyStreamEvent(
    state,
    {
      seq: 2,
      kind: "child.append",
      parent: "page",
      child: "table",
    },
    { registry, runtime },
  );
  state = buffered.state;

  expect(buffered.buffered).toBe(true);
  expect(buffered.state.bufferedEvents).toHaveLength(1);

  const flushed = applyStreamEvent(
    state,
    {
      seq: 3,
      kind: "node.upsert",
      id: "table",
      type: "CustomerTable",
      props: {
        dataRef: "queries.customers.data",
      },
    },
    { registry, runtime },
  );

  expect(flushed.state.bufferedEvents).toHaveLength(0);
  expect(flushed.ui?.nodes.page?.children).toEqual(["table"]);
});

test("rejects invalid component events and recovers after them", () => {
  let state = createStreamState();
  state = applyStreamEvent(
    state,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "AdminPage",
    },
    { registry, runtime },
  ).state;

  const invalid = applyStreamEvent(
    state,
    {
      seq: 2,
      kind: "node.upsert",
      id: "chart",
      type: "RevenueChart",
    },
    { registry, runtime },
  );
  state = invalid.state;

  expect(invalid.diagnostics).toEqual([
    expect.objectContaining({
      code: "unknown_component_type",
      componentType: "RevenueChart",
    }),
  ]);
  expect(state.document.nodes.chart).toBeUndefined();

  const recovered = applyStreamEvent(
    state,
    {
      seq: 3,
      kind: "node.upsert",
      id: "filter",
      type: "StatusFilter",
      props: {
        stateKey: "filters.status",
      },
    },
    { registry, runtime },
  );

  expect(recovered.diagnostics).toEqual([]);
  expect(recovered.state.document.nodes.filter?.type).toBe("StatusFilter");
});

test("fully verifies on done while unresolved references stay buffered", () => {
  let state = createStreamState();
  state = applyStreamEvent(
    state,
    {
      seq: 1,
      kind: "node.upsert",
      id: "page",
      type: "AdminPage",
    },
    { registry, runtime },
  ).state;
  state = applyStreamEvent(
    state,
    {
      seq: 2,
      kind: "child.append",
      parent: "page",
      child: "missing",
    },
    { registry, runtime },
  ).state;

  const result = finalizeStreamState(state, { registry, runtime });

  expect(result.state.done).toBe(true);
  expect(result.state.bufferedEvents).toHaveLength(1);
  expect(result.state.ui?.root).toBe("page");
});

test("parseStreamEvent aliases the stream protocol parser", () => {
  const result = parseStreamEvent('{"seq":1,"kind":"done"}');

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.kind).toBe("done");
  }
});
