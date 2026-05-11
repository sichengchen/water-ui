import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/react";
import {
  compileMeetingActionsPrompt,
  createMeetingRuntime,
  meetingActionsRegistry,
  mockMeetingActionsAgent,
  runMeetingActionsDemo,
} from "../src/index.ts";
import { verifyDocument } from "@water-ui/core";

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
  expect(prompt).toContain("Fill props.tasks with todos");
  expect(prompt).toContain("id, title, tags, people, and priority");
  expect(prompt).toContain('stable root id such as "task_list"');
  expect(prompt).not.toContain("queries.meetingSummary.data");
  expect(prompt).not.toContain("MeetingPage");
  expect(prompt).not.toContain("SummaryCard");
  expect(prompt).not.toContain("ActionButton");
  expect(prompt).not.toContain("actions.createTasks");
});

test("renders the verified todo list", async () => {
  const result = await runMeetingActionsDemo();

  const html = renderToStaticMarkup(
    createElement(
      WaterRuntimeProvider,
      {
        registry: meetingActionsRegistry,
        runtime: result.runtime.renderRuntime,
      },
      createElement(WaterRenderer, { ui: result.ui }),
    ),
  );

  expect(html).toContain("Todo list");
  expect(html).toContain("Todo list");
  expect(html).not.toContain("Create tasks");
});
