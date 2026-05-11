import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/react";
import {
  CREATE_TASKS_ACTION_ID,
  MEETING_SUMMARY_DATA_REF,
  compileMeetingActionsPrompt,
  createMeetingRuntime,
  exampleMeetingSummary,
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
    actions: [CREATE_TASKS_ACTION_ID],
    dataRefs: [MEETING_SUMMARY_DATA_REF],
    stateKeys: [],
  });
});

test("compiled prompt exposes only registered app components and runtime ids", () => {
  const runtime = createMeetingRuntime();
  const prompt = compileMeetingActionsPrompt({
    runtime: runtime.capabilityRuntime.describe(),
  });

  expect(prompt).toContain("TaskList");
  expect(prompt).toContain("only generated component");
  expect(prompt).toContain('stable root id such as "task_list"');
  expect(prompt).toContain(MEETING_SUMMARY_DATA_REF);
  expect(prompt).not.toContain("MeetingPage");
  expect(prompt).not.toContain("SummaryCard");
  expect(prompt).not.toContain("ActionButton");
  expect(prompt).not.toContain(CREATE_TASKS_ACTION_ID);
});

test("renders the verified panel and action creates tasks", async () => {
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

  await expect(
    result.runtime.capabilityRuntime.runAction(CREATE_TASKS_ACTION_ID, {
      dataRef: MEETING_SUMMARY_DATA_REF,
      tasks: exampleMeetingSummary.tasks,
    }),
  ).resolves.toEqual({
    created: exampleMeetingSummary.tasks.length,
  });
  expect(result.runtime.getCreatedTasks()).toEqual(exampleMeetingSummary.tasks);
});
