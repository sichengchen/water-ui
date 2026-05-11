import { createWaterRegistry, defineWaterComponent } from "@water-ui/core";
import { createElement } from "react";
import { z } from "zod";
import { MeetingTaskList } from "./components/meeting-task-list.js";
import { meetingTaskSchema } from "./types.js";
import type { WaterRenderBinding } from "@water-ui/react";

const taskListPropsSchema = z
  .object({
    tasks: z.array(meetingTaskSchema).min(1),
  })
  .strict();

type TaskListProps = z.infer<typeof taskListPropsSchema>;

export const meetingActionsRegistry = createWaterRegistry({
  components: {
    TaskList: defineWaterComponent<TaskListProps>({
      description:
        "Use TaskList as the only generated component. Fill props.tasks with todos extracted directly from the meeting note.",
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
          'Return exactly one node: type "TaskList" with props.tasks filled from the meeting note.',
          'Use TaskList as the document root; a stable root id such as "task_list" is appropriate.',
          "Do not generate the notebook, chat UI, summary card, forms, or Create tasks button.",
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
        createElement(MeetingTaskList, {
          tasks: props.tasks,
        })) satisfies WaterRenderBinding<TaskListProps>,
    }),
  },
});
