import { z } from "zod";

export const meetingTaskSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    owner: z.string().min(1),
    due: z.string().min(1),
    priority: z.enum(["low", "medium", "high"]),
  })
  .strict();

export const meetingSummarySchema = z
  .object({
    title: z.string().min(1),
    date: z.string().min(1),
    attendees: z.array(z.string().min(1)),
    summary: z.string().min(1),
    decisions: z.array(z.string().min(1)),
    tasks: z.array(meetingTaskSchema),
  })
  .strict();

export const createTasksInputSchema = z
  .object({
    dataRef: z.literal("queries.meetingSummary.data"),
    tasks: z.array(meetingTaskSchema),
  })
  .strict();

export const createTasksOutputSchema = z
  .object({
    created: z.number().int().nonnegative(),
  })
  .strict();

export type MeetingTask = z.infer<typeof meetingTaskSchema>;
export type MeetingSummary = z.infer<typeof meetingSummarySchema>;
export type CreateTasksInput = z.infer<typeof createTasksInputSchema>;
export type CreateTasksOutput = z.infer<typeof createTasksOutputSchema>;

export const MEETING_SUMMARY_DATA_REF = "queries.meetingSummary.data";
export const CREATE_TASKS_ACTION_ID = "actions.createTasks";

export const exampleMeetingNote = [
  "Launch review, Monday 10:00.",
  "Mina will finalize onboarding copy by Friday.",
  "Dev needs to open a staging checklist before beta starts.",
  "Sam will confirm support coverage for the first release week.",
].join("\n");

export const exampleMeetingSummary: MeetingSummary = {
  title: "Launch review",
  date: "Monday 10:00",
  attendees: ["Mina", "Dev", "Sam"],
  summary:
    "The team aligned on beta launch readiness, onboarding copy, staging checks, and release-week support coverage.",
  decisions: [
    "Keep beta launch scope unchanged.",
    "Review staging readiness before opening the beta cohort.",
  ],
  tasks: [
    {
      id: "task-onboarding-copy",
      title: "Finalize onboarding copy",
      owner: "Mina",
      due: "Friday",
      priority: "high",
    },
    {
      id: "task-staging-checklist",
      title: "Open staging checklist",
      owner: "Dev",
      due: "Before beta",
      priority: "medium",
    },
    {
      id: "task-support-coverage",
      title: "Confirm support coverage",
      owner: "Sam",
      due: "Release week",
      priority: "medium",
    },
  ],
};

export function createMeetingSummaryFromNote(note: string): MeetingSummary {
  const lines = note
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0]?.replace(/[.:]$/, "") || "Meeting note";
  const taskLines = lines.slice(1).filter((line) => /\b(will|needs?|must|to|by)\b/i.test(line));
  const tasks = (taskLines.length > 0 ? taskLines : lines.slice(1, 4)).map((line, index) =>
    createTaskFromLine(line, index),
  );

  return {
    title,
    date: "Today",
    attendees: inferAttendees(lines),
    summary: lines.length > 1 ? lines.slice(1).join(" ") : "No meeting details were provided.",
    decisions: ["Review extracted action items before creating tasks."],
    tasks: tasks.length > 0 ? tasks : exampleMeetingSummary.tasks,
  };
}

function inferAttendees(lines: readonly string[]): string[] {
  const names = new Set<string>();

  for (const line of lines) {
    for (const match of line.matchAll(/\b[A-Z][a-z]+\b/g)) {
      const name = match[0];
      if (!["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Today"].includes(name)) {
        names.add(name);
      }
    }
  }

  return names.size > 0 ? [...names].slice(0, 4) : ["Team"];
}

function createTaskFromLine(line: string, index: number): MeetingTask {
  const owner = line.match(/^([A-Z][a-z]+)\b/)?.[1] ?? "Team";
  const due = line.match(/\bby\s+([^,.]+)|\bbefore\s+([^,.]+)|\bfor\s+([^,.]+)/i);
  const title = line
    .replace(/^([A-Z][a-z]+)\s+(will|needs? to|must|to)\s+/i, "")
    .replace(/\s+by\s+[^,.]+/i, "")
    .replace(/\s+before\s+[^,.]+/i, "")
    .replace(/\s+for\s+[^,.]+/i, "")
    .replace(/[.]$/, "")
    .trim();

  return {
    id: `task-${index + 1}`,
    title: title || line,
    owner,
    due: due?.[1] ?? due?.[2] ?? due?.[3] ?? "Next",
    priority: index === 0 ? "high" : "medium",
  };
}
