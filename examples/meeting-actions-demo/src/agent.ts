import { compileDocumentPrompt } from "@water-ui/prompt";
import { CREATE_TASKS_ACTION_ID, MEETING_SUMMARY_DATA_REF, exampleMeetingNote } from "./types.js";
import { meetingActionsRegistry } from "./registry.js";
import type { SchemaUIDocument, RuntimeCapabilityDescription } from "@water-ui/core";

export const meetingActionsIntent = "Turn this meeting note into action items.";

export function compileMeetingActionsPrompt(options: {
  runtime: RuntimeCapabilityDescription;
  meetingNote?: string;
}): string {
  return compileDocumentPrompt({
    registry: meetingActionsRegistry,
    runtime: options.runtime,
    userIntent: `${meetingActionsIntent}\n\nMeeting note:\n${options.meetingNote ?? exampleMeetingNote}`,
  });
}

export async function mockMeetingActionsAgent(): Promise<SchemaUIDocument> {
  return {
    kind: "water.ui.document",
    version: "water.ui.v1",
    root: "meeting_page",
    nodes: {
      meeting_page: {
        type: "MeetingPage",
        props: {
          title: "Todo list",
          description: "Action items extracted from the meeting note.",
        },
        children: ["task_list", "create_tasks"],
      },
      task_list: {
        type: "TaskList",
        props: {
          dataRef: MEETING_SUMMARY_DATA_REF,
        },
      },
      create_tasks: {
        type: "ActionButton",
        props: {
          label: "Create tasks",
          dataRef: MEETING_SUMMARY_DATA_REF,
          actionId: CREATE_TASKS_ACTION_ID,
        },
      },
    },
  };
}
