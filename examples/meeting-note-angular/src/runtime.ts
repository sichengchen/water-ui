import { createWaterRuntime } from "@water-ui/runtime";
import { createMeetingSummaryFromNote, exampleMeetingSummary } from "./types.js";
import type { WaterRuntime as AngularWaterRuntime } from "@water-ui/angular";
import type { WaterRuntime } from "@water-ui/runtime";
import type { MeetingSummary } from "./types.js";

export type MeetingRuntime = {
  summary: MeetingSummary;
  capabilityRuntime: WaterRuntime;
  renderRuntime: AngularWaterRuntime;
};

export function createMeetingRuntime(
  summary: MeetingSummary = exampleMeetingSummary,
): MeetingRuntime {
  const capabilityRuntime = createWaterRuntime({
    permissions: {
      canRunAction: ({ risk }) => risk !== "destructive",
    },
  });

  const renderRuntime: AngularWaterRuntime = {};

  return {
    summary,
    capabilityRuntime,
    renderRuntime,
  };
}

export function createMeetingRuntimeFromNote(note: string): MeetingRuntime {
  return createMeetingRuntime(createMeetingSummaryFromNote(note));
}
