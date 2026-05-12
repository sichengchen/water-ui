import { renderToString } from "@vue/server-renderer";
import { createSSRApp, h } from "vue";
import { expect, test } from "vite-plus/test";
import { WaterRenderer, WaterRuntimeProvider, WaterStreamRenderer } from "@water-ui/vue";
import {
  compileMeetingActionsPrompt,
  createMockMeetingActionsStreamEvents,
  createMeetingRuntime,
  meetingActionsRegistry,
  mockMeetingActionsAgent,
  runMeetingActionsDemo,
} from "../src/index.ts";
import { applyStreamEvent, createStreamState, verifyDocument } from "@water-ui/core";
import type { WaterRuntime } from "@water-ui/vue";

test("mock agent output verifies against app components and runtime capabilities", async () => {
  const runtime = createMeetingRuntime();
  const document = await mockMeetingActionsAgent();
  const verification = verifyDocument(document, {
    registry: meetingActionsRegistry,
    runtime: runtime.capabilityRuntime.describe(),
  });

  expect(verification.ok).toBe(true);
  expect(runtime.capabilityRuntime.describe()).toEqual({
    actions: [],
    dataRefs: [],
    stateKeys: [],
  });
});

test("compiled prompt exposes only registered app components and runtime ids", () => {
  const runtime = createMeetingRuntime();
  const prompt = compileMeetingActionsPrompt({
    runtime: runtime.capabilityRuntime.describe(),
  });

  expect(prompt).toContain("TaskList");
  expect(prompt).toContain("TaskList renders todos");
  expect(prompt).toContain("id, title, tags, people, and priority");
  expect(prompt).toContain('node.upsert event for id "task_list"');
  expect(prompt).toContain("node.props.update");
  expect(prompt).toContain("Return newline-delimited JSON events only");
});

test("renders the verified todo list", async () => {
  const result = await runMeetingActionsDemo();

  const html = await renderWater(h(WaterRenderer, { ui: result.ui }), {
    registry: meetingActionsRegistry,
    runtime: result.runtime.renderRuntime,
  });

  expect(html).toContain("Todo list");
  expect(html).toContain("Finalize onboarding copy");
});

test("streams the todo list one task at a time", async () => {
  const runtime = createMeetingRuntime();
  const events = createMockMeetingActionsStreamEvents({ tasks: runtime.summary.tasks });
  let stream = createStreamState();

  expect(events.map((event) => event.kind)).toEqual([
    "node.upsert",
    "node.props.update",
    "node.props.update",
    "done",
  ]);

  stream = applyStreamEvent(stream, events[0], {
    registry: meetingActionsRegistry,
    runtime: runtime.capabilityRuntime.describe(),
  }).state;

  let html = await renderWater(h(WaterStreamRenderer, { stream }), {
    registry: meetingActionsRegistry,
    runtime: runtime.renderRuntime,
  });

  expect(html).toContain("1 extracted task");
  expect(html).toContain("Finalize onboarding copy");
  expect(html).not.toContain("Open staging checklist");

  stream = applyStreamEvent(stream, events[1], {
    registry: meetingActionsRegistry,
    runtime: runtime.capabilityRuntime.describe(),
  }).state;

  html = await renderWater(h(WaterStreamRenderer, { stream }), {
    registry: meetingActionsRegistry,
    runtime: runtime.renderRuntime,
  });

  expect(html).toContain("2 extracted tasks");
  expect(html).toContain("Open staging checklist");
  expect(html).not.toContain("Confirm support coverage");
});

function renderWater(
  child: ReturnType<typeof h>,
  options: { registry: typeof meetingActionsRegistry; runtime: WaterRuntime },
): Promise<string> {
  const app = createSSRApp({
    render: () =>
      h(
        WaterRuntimeProvider,
        {
          runtime: options.runtime,
          registry: options.registry,
        },
        () => child,
      ),
  });

  return renderToString(app);
}
