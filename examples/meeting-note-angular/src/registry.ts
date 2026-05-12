import { createWaterRegistry, defineWaterComponent } from "@water-ui/core";
import { waterComponent } from "@water-ui/angular";
import { z } from "zod";
import { MeetingTaskListComponent } from "./components/meeting-task-list.component.js";
import { meetingTaskSchema } from "./types.js";
import type { WaterRenderBinding } from "@water-ui/angular";

const taskListPropsSchema = z
  .object({
    tasks: z.array(meetingTaskSchema).min(1),
  })
  .strict();

type TaskListProps = z.infer<typeof taskListPropsSchema>;

export const meetingActionsRegistry = createWaterRegistry({
  components: {
    TaskList: defineWaterComponent<TaskListProps>({
      description: "TaskList renders todos extracted directly from the meeting note.",
      propsSchema: taskListPropsSchema,
      children: "none",
      prompt: {
        props: [
          {
            name: "tasks",
            description:
              'Array of todo items extracted from the meeting note. Each item must include id, title, tags, people, and priority. Use stable kebab-case ids like "task-onboarding-copy". Use concise action titles. Put topic/deadline/context labels in tags. Put assignees in people. Priority must be "high", "medium", or "low".',
            required: true,
          },
        ],
        notes: [
          'Start the stream with a node.upsert event for id "task_list" and type "TaskList".',
          'For each additional todo, emit node.props.update for id "task_list" with the current props.tasks array.',
        ],
      },
      examples: [
        {
          intent: "show the todo list extracted from the current meeting note",
          node: {
            type: "TaskList",
            props: {
              tasks: [
                {
                  id: "task-onboarding-copy",
                  title: "Finalize onboarding copy",
                  tags: ["Copy", "Friday"],
                  people: ["Mina"],
                  priority: "high",
                },
                {
                  id: "task-staging-checklist",
                  title: "Open staging checklist",
                  tags: ["Staging", "Beta"],
                  people: ["Dev"],
                  priority: "medium",
                },
              ],
            },
          },
        },
      ],
      render: (({ props }) =>
        waterComponent(MeetingTaskListComponent, {
          tasks: props.tasks,
        })) satisfies WaterRenderBinding<TaskListProps>,
    }),
  },
});
