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
      description: "Todo list generated from the meeting summary action items.",
      propsSchema: dataBackedPropsSchema,
      children: "none",
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
