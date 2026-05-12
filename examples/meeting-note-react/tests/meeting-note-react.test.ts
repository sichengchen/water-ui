import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { WasserRenderer, WasserRuntimeProvider, WasserStreamRenderer } from "@wasser-ui/react";
import {
  compileMeetingActionsPrompt,
  createMockMeetingActionsStreamEvents,
  createMeetingRuntime,
  meetingActionsRegistry,
  mockMeetingActionsAgent,
  runMeetingActionsDemo,
} from "../src/index.ts";
import { applyStreamEvent, createStreamState, verifyDocument } from "@wasser-ui/core";

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

  const html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      {
        registry: meetingActionsRegistry,
        runtime: result.runtime.renderRuntime,
      },
      createElement(WasserRenderer, { ui: result.ui }),
    ),
  );

  expect(html).toContain("Todo list");
  expect(html).toContain("Todo list");
});

test("streams the todo list one task at a time", () => {
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

  let html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      {
        registry: meetingActionsRegistry,
        runtime: runtime.renderRuntime,
      },
      createElement(WasserStreamRenderer, { stream }),
    ),
  );

  expect(html).toContain("1 extracted task");
  expect(html).toContain("Finalize onboarding copy");
  expect(html).not.toContain("Open staging checklist");

  stream = applyStreamEvent(stream, events[1], {
    registry: meetingActionsRegistry,
    runtime: runtime.capabilityRuntime.describe(),
  }).state;

  html = renderToStaticMarkup(
    createElement(
      WasserRuntimeProvider,
      {
        registry: meetingActionsRegistry,
        runtime: runtime.renderRuntime,
      },
      createElement(WasserStreamRenderer, { stream }),
    ),
  );

  expect(html).toContain("2 extracted tasks");
  expect(html).toContain("Open staging checklist");
  expect(html).not.toContain("Confirm support coverage");
});
