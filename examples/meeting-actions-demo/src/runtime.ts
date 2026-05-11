import { createWaterRuntime } from "@water-ui/runtime";
import {
  CREATE_TASKS_ACTION_ID,
  MEETING_SUMMARY_DATA_REF,
  createTasksInputSchema,
  createTasksOutputSchema,
  exampleMeetingSummary,
  meetingSummarySchema,
} from "./types.js";
import type { WaterRuntime as ReactWaterRuntime } from "@water-ui/react";
import type { WaterRuntime } from "@water-ui/runtime";
import type { CreateTasksInput, CreateTasksOutput, MeetingSummary, MeetingTask } from "./types.js";

export type MeetingRuntime = {
  capabilityRuntime: WaterRuntime;
  renderRuntime: ReactWaterRuntime;
  getCreatedTasks: () => readonly MeetingTask[];
};

export function createMeetingRuntime(
  summary: MeetingSummary = exampleMeetingSummary,
): MeetingRuntime {
  const createdTasks: MeetingTask[] = [];
  const capabilityRuntime = createWaterRuntime({
    permissions: {
      canRunAction: ({ risk }) => risk !== "destructive",
    },
  });

  capabilityRuntime.queries.register({
    id: "meetingSummary",
    dataRef: MEETING_SUMMARY_DATA_REF,
    outputSchema: meetingSummarySchema,
    handler: () => summary,
  });

  capabilityRuntime.actions.register<CreateTasksInput, CreateTasksOutput>({
    id: CREATE_TASKS_ACTION_ID,
    label: "Create tasks",
    description: "Create task records from the verified meeting summary.",
    risk: "low",
    inputSchema: createTasksInputSchema,
    outputSchema: createTasksOutputSchema,
    handler: (input) => {
      createdTasks.push(...input.tasks);
      return {
        created: input.tasks.length,
      };
    },
  });

  const renderRuntime: ReactWaterRuntime = {
    resolveData: (dataRef) => (dataRef === MEETING_SUMMARY_DATA_REF ? summary : undefined),
    runAction: (actionId, payload) => capabilityRuntime.runAction(actionId, payload),
  };

  return {
    capabilityRuntime,
    renderRuntime,
    getCreatedTasks: () => Object.freeze([...createdTasks]),
  };
}
