import { compileDocumentPrompt } from "@water-ui/prompt";
import { MEETING_SUMMARY_DATA_REF, exampleMeetingNote } from "./types.js";
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
    root: "task_list",
    nodes: {
      task_list: {
        type: "TaskList",
        props: {
          dataRef: MEETING_SUMMARY_DATA_REF,
        },
      },
    },
  };
}
