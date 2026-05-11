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
