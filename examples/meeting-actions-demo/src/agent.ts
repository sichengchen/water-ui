import { compileDocumentPrompt } from "@water-ui/prompt";
import {
  createMeetingSummaryFromNote,
  exampleMeetingNote,
  exampleMeetingSummary,
} from "./types.js";
import { meetingActionsRegistry } from "./registry.js";
import type { SchemaUIDocument, RuntimeCapabilityDescription } from "@water-ui/core";
import type { MeetingTask } from "./types.js";

export const meetingActionsIntent = "Turn this meeting note into action items.";

export function compileMeetingActionsPrompt(options: {
  runtime: RuntimeCapabilityDescription;
  meetingNote?: string;
}): string {
  return compileDocumentPrompt({
    registry: meetingActionsRegistry,
    runtime: {
      state: options.runtime.state,
      stateKeys: options.runtime.stateKeys,
    },
    userIntent: `${meetingActionsIntent}\n\nMeeting note:\n${options.meetingNote ?? exampleMeetingNote}`,
  });
}

export async function mockMeetingActionsAgent(
  options: {
    meetingNote?: string;
    tasks?: readonly MeetingTask[];
  } = {},
): Promise<SchemaUIDocument> {
  const tasks =
    options.tasks ??
    (options.meetingNote
      ? createMeetingSummaryFromNote(options.meetingNote).tasks
      : exampleMeetingSummary.tasks);

  return {
    kind: "water.ui.document",
    version: "water.ui.v1",
    root: "task_list",
    nodes: {
      task_list: {
        type: "TaskList",
        props: {
          tasks,
        },
      },
    },
  };
}
