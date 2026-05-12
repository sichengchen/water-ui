import { compileStreamPrompt } from "@wasser-ui/prompt";
import {
  createMeetingSummaryFromNote,
  exampleMeetingNote,
  exampleMeetingSummary,
} from "./types.js";
import { meetingActionsRegistry } from "./registry.js";
import type {
  RuntimeCapabilityDescription,
  SchemaUIDocument,
  SchemaUIStreamEvent,
} from "@wasser-ui/core";
import type { MeetingTask } from "./types.js";

export const meetingActionsIntent = "Turn this meeting note into a todo list.";

export function compileMeetingActionsPrompt(options: {
  runtime: RuntimeCapabilityDescription;
  meetingNote?: string;
}): string {
  return compileStreamPrompt({
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
  const tasks = resolveMeetingTasks(options);

  return {
    kind: "wasser.ui.document",
    version: "wasser.ui.v1",
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

export function createMockMeetingActionsStreamEvents(
  options: {
    meetingNote?: string;
    tasks?: readonly MeetingTask[];
  } = {},
): readonly SchemaUIStreamEvent[] {
  const tasks = resolveMeetingTasks(options);
  const events: SchemaUIStreamEvent[] = [];

  tasks.forEach((_, index) => {
    const nextTasks = tasks.slice(0, index + 1);

    if (index === 0) {
      events.push({
        seq: 1,
        kind: "node.upsert",
        id: "task_list",
        type: "TaskList",
        props: {
          tasks: nextTasks,
        },
      });
      return;
    }

    events.push({
      seq: index + 1,
      kind: "node.props.update",
      id: "task_list",
      props: {
        tasks: nextTasks,
      },
    });
  });

  events.push({
    seq: tasks.length + 1,
    kind: "done",
  });

  return events;
}

export async function* mockMeetingActionsAgentStream(
  options: {
    meetingNote?: string;
    tasks?: readonly MeetingTask[];
    delayMs?: number;
  } = {},
): AsyncGenerator<SchemaUIStreamEvent> {
  const events = createMockMeetingActionsStreamEvents(options);
  const delayMs = options.delayMs ?? 1000;

  for (const event of events) {
    if (event.kind !== "done" && delayMs > 0) {
      await wait(delayMs);
    }

    yield event;
  }
}

export function formatMockMeetingActionsStreamOutput(
  options: {
    meetingNote?: string;
    tasks?: readonly MeetingTask[];
  } = {},
): string {
  return createMockMeetingActionsStreamEvents(options)
    .map((event) => JSON.stringify(event))
    .join("\n");
}

function resolveMeetingTasks(options: {
  meetingNote?: string;
  tasks?: readonly MeetingTask[];
}): readonly MeetingTask[] {
  return (
    options.tasks ??
    (options.meetingNote
      ? createMeetingSummaryFromNote(options.meetingNote).tasks
      : exampleMeetingSummary.tasks)
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
