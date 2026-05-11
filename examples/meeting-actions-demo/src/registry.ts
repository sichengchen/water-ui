import { createWaterRegistry, defineWaterComponent } from "@water-ui/core";
import { createElement } from "react";
import { z } from "zod";
import { Badge } from "./components/ui/badge.js";
import { Button } from "./components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.js";
import { Checkbox } from "./components/ui/checkbox.js";
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
        min: 2,
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
        notes: [
          "Use TaskList and ActionButton. Include SummaryCard only when the user asks for a summary.",
        ],
      },
      render: (({ props, children }) =>
        createElement(
          "section",
          {
            "aria-label": props.title,
            className: "flex flex-col gap-3",
            "data-demo": "meeting-actions",
          },
          createElement(
            "header",
            { className: "sr-only" },
            createElement("h2", null, props.title),
            props.description ? createElement("p", null, props.description) : null,
          ),
          createElement(
            "div",
            { className: "flex flex-col gap-3", "data-slot": "meeting-panel" },
            children,
          ),
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
              { "aria-label": "Decisions", className: "decision-list" },
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
          { className: "gap-3 py-4" },
          createElement(
            CardHeader,
            { className: "px-4" },
            createElement(CardTitle, { className: "text-base" }, "Todo list"),
            createElement(CardDescription, null, `${summary.tasks.length} extracted tasks`),
          ),
          createElement(
            CardContent,
            { className: "px-4" },
            createElement(
              "ul",
              { "aria-label": "Todo list", className: "flex flex-col gap-2" },
              summary.tasks.map((task) =>
                createElement(
                  "li",
                  {
                    key: task.id,
                    className: "border-b py-2 last:border-b-0",
                  },
                  createElement(
                    "label",
                    { className: "grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] gap-3" },
                    createElement(Checkbox, {
                      "aria-label": task.title,
                      className: "mt-0.5",
                    }),
                    createElement(
                      "div",
                      { className: "flex min-w-0 flex-col gap-1.5" },
                      createElement(
                        "div",
                        { className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3" },
                        createElement(
                          "strong",
                          { className: "text-sm font-medium leading-5" },
                          task.title,
                        ),
                        createElement(Badge, { variant: "outline" }, task.priority),
                      ),
                      createElement(
                        "div",
                        { className: "flex flex-wrap gap-1.5" },
                        task.tags.map((tag) =>
                          createElement(Badge, { key: tag, variant: "secondary" }, tag),
                        ),
                      ),
                      createElement(
                        "p",
                        { className: "text-xs text-muted-foreground" },
                        `People: ${task.owner}`,
                      ),
                    ),
                  ),
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
            className: "w-full",
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
