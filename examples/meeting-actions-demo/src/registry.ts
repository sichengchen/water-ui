import { createWaterRegistry, defineWaterComponent } from "@water-ui/core";
import { createElement } from "react";
import { z } from "zod";
import { Badge } from "./components/ui/badge.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.js";
import { Checkbox } from "./components/ui/checkbox.js";
import { MEETING_SUMMARY_DATA_REF, meetingSummarySchema } from "./types.js";
import type { WaterRenderBinding } from "@water-ui/react";
import type { MeetingSummary } from "./types.js";

const dataRefSchema = z.literal(MEETING_SUMMARY_DATA_REF);

const dataBackedPropsSchema = z
  .object({
    dataRef: dataRefSchema,
  })
  .strict();

type DataBackedProps = z.infer<typeof dataBackedPropsSchema>;

export const meetingActionsRegistry = createWaterRegistry({
  components: {
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
          { className: "gap-2 py-3" },
          createElement(
            CardHeader,
            { className: "gap-1 px-4" },
            createElement(CardTitle, { className: "text-base" }, "Todo list"),
            createElement(CardDescription, null, `${summary.tasks.length} extracted tasks`),
          ),
          createElement(
            CardContent,
            { className: "px-4" },
            createElement(
              "ul",
              { "aria-label": "Todo list", className: "flex flex-col gap-1" },
              summary.tasks.map((task) =>
                createElement(
                  "li",
                  {
                    key: task.id,
                    className: "border-b py-1.5 last:border-b-0",
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
  },
});

export function getMeetingSummaryFromBindings(data: unknown): MeetingSummary {
  return meetingSummarySchema.parse(data);
}
