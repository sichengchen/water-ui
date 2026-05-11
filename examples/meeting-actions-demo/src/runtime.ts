import { createWaterRuntime } from "@water-ui/runtime";
import {
  CREATE_TASKS_ACTION_ID,
  createTasksInputSchema,
  createTasksOutputSchema,
  createMeetingSummaryFromNote,
  exampleMeetingSummary,
} from "./types.js";
import type { WaterRuntime as ReactWaterRuntime } from "@water-ui/react";
import type { WaterRuntime } from "@water-ui/runtime";
import type { CreateTasksInput, CreateTasksOutput, MeetingSummary, MeetingTask } from "./types.js";

export type MeetingRuntime = {
  summary: MeetingSummary;
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

  capabilityRuntime.actions.register<CreateTasksInput, CreateTasksOutput>({
    id: CREATE_TASKS_ACTION_ID,
    label: "Create tasks",
    description: "Create task records from the generated todo list.",
    risk: "low",
    inputSchema: createTasksInputSchema,
    outputSchema: createTasksOutputSchema,
    handler: (input) => {
      createdTasks.splice(0, createdTasks.length, ...input.tasks);
      return {
        created: input.tasks.length,
      };
    },
  });

  const renderRuntime: ReactWaterRuntime = {};

  return {
    summary,
    capabilityRuntime,
    renderRuntime,
    getCreatedTasks: () => Object.freeze([...createdTasks]),
  };
}

export function createMeetingRuntimeFromNote(note: string): MeetingRuntime {
  return createMeetingRuntime(createMeetingSummaryFromNote(note));
}
