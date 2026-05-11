import { createWaterRegistry, defineWaterComponent } from "@water-ui/core";
import { createElement } from "react";
import { z } from "zod";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./shadcn.js";
import { CREATE_TASKS_ACTION_ID, MEETING_SUMMARY_DATA_REF, meetingSummarySchema } from "./types.js";
import type { WaterRenderBinding } from "@water-ui/react";
import type { MeetingSummary } from "./types.js";

const dataRefSchema = z.literal(MEETING_SUMMARY_DATA_REF);

const meetingPagePropsSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1).optional(),
  })
  .strict();

const dataBackedPropsSchema = z
  .object({
    dataRef: dataRefSchema,
  })
  .strict();

const actionButtonPropsSchema = z
  .object({
    label: z.string().min(1),
    dataRef: dataRefSchema,
    actionId: z.literal(CREATE_TASKS_ACTION_ID),
  })
  .strict();

type MeetingPageProps = z.infer<typeof meetingPagePropsSchema>;
type DataBackedProps = z.infer<typeof dataBackedPropsSchema>;
type ActionButtonProps = z.infer<typeof actionButtonPropsSchema>;

export const meetingActionsRegistry = createWaterRegistry({
  components: {
    MeetingPage: defineWaterComponent<MeetingPageProps>({
      description: "Page shell for a meeting action-item workflow.",
      propsSchema: meetingPagePropsSchema,
      children: {
        kind: "nodes",
        min: 3,
        max: 3,
      },
      prompt: {
        props: [
          {
            name: "title",
            description: "Short page title.",
            required: true,
          },
          {
            name: "description",
            description: "Brief page description.",
          },
        ],
        notes: ["Use exactly three children: SummaryCard, TaskList, then ActionButton."],
      },
      render: (({ props, children }) =>
        createElement(
          "main",
          {
            "aria-label": props.title,
            "data-demo": "meeting-actions",
          },
          createElement(
            "header",
            null,
            createElement("h1", null, props.title),
            props.description ? createElement("p", null, props.description) : null,
          ),
          createElement("div", { "data-slot": "meeting-panel" }, children),
        )) satisfies WaterRenderBinding<MeetingPageProps>,
    }),
    SummaryCard: defineWaterComponent<DataBackedProps>({
      description: "shadcn-based card that renders the meeting summary from runtime data.",
      propsSchema: dataBackedPropsSchema,
      children: "none",
      prompt: {
        props: [
          {
            name: "dataRef",
            description: "Registered meeting summary data ref.",
            required: true,
            allowedValues: [MEETING_SUMMARY_DATA_REF],
          },
        ],
      },
      render: (({ props, bindings }) => {
        const summary = meetingSummarySchema.parse(bindings.data[props.dataRef]);

        return createElement(
          Card,
          null,
          createElement(
            CardHeader,
            null,
            createElement(CardTitle, null, summary.title),
            createElement(
              CardDescription,
              null,
              `${summary.date} - ${summary.attendees.join(", ")}`,
            ),
          ),
          createElement(
            CardContent,
            null,
            createElement("p", null, summary.summary),
            createElement(
              "ul",
              { "aria-label": "Decisions" },
              summary.decisions.map((decision) => createElement("li", { key: decision }, decision)),
            ),
          ),
        );
      }) satisfies WaterRenderBinding<DataBackedProps>,
    }),
    TaskList: defineWaterComponent<DataBackedProps>({
      description: "shadcn-based task list that renders action items from runtime data.",
      propsSchema: dataBackedPropsSchema,
      children: "none",
      prompt: {
        props: [
          {
            name: "dataRef",
            description: "Registered meeting summary data ref.",
            required: true,
            allowedValues: [MEETING_SUMMARY_DATA_REF],
          },
        ],
      },
      render: (({ props, bindings }) => {
        const summary = meetingSummarySchema.parse(bindings.data[props.dataRef]);

        return createElement(
          Card,
          null,
          createElement(
            CardHeader,
            null,
            createElement(CardTitle, null, "Action items"),
            createElement(CardDescription, null, `${summary.tasks.length} tasks ready to create`),
          ),
          createElement(
            CardContent,
            null,
            createElement(
              "ul",
              { "aria-label": "Action items" },
              summary.tasks.map((task) =>
                createElement(
                  "li",
                  { key: task.id },
                  createElement("strong", null, task.title),
                  createElement("span", null, ` Owner: ${task.owner}`),
                  createElement("span", null, ` Due: ${task.due}`),
                  createElement(Badge, null, task.priority),
                ),
              ),
            ),
          ),
        );
      }) satisfies WaterRenderBinding<DataBackedProps>,
    }),
    ActionButton: defineWaterComponent<ActionButtonProps>({
      description: "shadcn-based button that invokes a registered create-tasks runtime action.",
      propsSchema: actionButtonPropsSchema,
      children: "none",
      risk: "low",
      prompt: {
        props: [
          {
            name: "label",
            description: "Visible button label.",
            required: true,
          },
          {
            name: "dataRef",
            description: "Registered meeting summary data ref used as action payload source.",
            required: true,
            allowedValues: [MEETING_SUMMARY_DATA_REF],
          },
          {
            name: "actionId",
            description: "Registered action ID to invoke.",
            required: true,
            allowedValues: [CREATE_TASKS_ACTION_ID],
          },
        ],
        notes: ["Do not invent action IDs. Use actions.createTasks."],
      },
      examples: [
        {
          intent: "create task records from the verified meeting summary",
          node: {
            type: "ActionButton",
            props: {
              label: "Create tasks",
              dataRef: MEETING_SUMMARY_DATA_REF,
              actionId: CREATE_TASKS_ACTION_ID,
            },
          },
        },
      ],
      render: (({ props, bindings }) => {
        const summary = meetingSummarySchema.parse(bindings.data[props.dataRef]);
        const onClick = () =>
          bindings.actions[props.actionId]?.({
            dataRef: props.dataRef,
            tasks: summary.tasks,
          });

        return createElement(
          Button,
          {
            "aria-label": props.label,
            "data-action-id": props.actionId,
            onClick,
          },
          props.label,
        );
      }) satisfies WaterRenderBinding<ActionButtonProps>,
    }),
  },
});

export function getMeetingSummaryFromBindings(data: unknown): MeetingSummary {
  return meetingSummarySchema.parse(data);
}
