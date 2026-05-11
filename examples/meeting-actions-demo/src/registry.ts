import { createWaterRegistry, defineWaterComponent } from "@water-ui/core";
import { createElement } from "react";
import { z } from "zod";
import { MeetingTaskList } from "./components/meeting-task-list.js";
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
      description:
        "Use TaskList as the only generated component to show todos extracted from the meeting note. It requires props.dataRef.",
      propsSchema: dataBackedPropsSchema,
      children: "none",
      prompt: {
        props: [
          {
            name: "dataRef",
            description:
              'Set this to the exact string "queries.meetingSummary.data". It is the only available meeting-summary data source for this demo.',
            required: true,
            allowedValues: [MEETING_SUMMARY_DATA_REF],
          },
        ],
        notes: [
          'Return exactly one node: type "TaskList" with props.dataRef set to "queries.meetingSummary.data".',
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
              dataRef: MEETING_SUMMARY_DATA_REF,
            },
          },
        },
      ],
      render: (({ props, bindings }) => {
        const summary = meetingSummarySchema.parse(bindings.data[props.dataRef]);

        return createElement(MeetingTaskList, { summary });
      }) satisfies WaterRenderBinding<DataBackedProps>,
    }),
  },
});

export function getMeetingSummaryFromBindings(data: unknown): MeetingSummary {
  return meetingSummarySchema.parse(data);
}
