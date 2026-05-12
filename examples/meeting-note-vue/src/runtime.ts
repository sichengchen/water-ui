import { createWasserRuntime } from "@wasser-ui/runtime";
import { createMeetingSummaryFromNote, exampleMeetingSummary } from "./types.js";
import type { WasserRuntime as VueWasserRuntime } from "@wasser-ui/vue";
import type { WasserRuntime } from "@wasser-ui/runtime";
import type { MeetingSummary } from "./types.js";

export type MeetingRuntime = {
  summary: MeetingSummary;
  capabilityRuntime: WasserRuntime;
  renderRuntime: VueWasserRuntime;
};

export function createMeetingRuntime(
  summary: MeetingSummary = exampleMeetingSummary,
): MeetingRuntime {
  const capabilityRuntime = createWasserRuntime({
    permissions: {
      canRunAction: ({ risk }) => risk !== "destructive",
    },
  });

  const renderRuntime: VueWasserRuntime = {};

  return {
    summary,
    capabilityRuntime,
    renderRuntime,
  };
}

export function createMeetingRuntimeFromNote(note: string): MeetingRuntime {
  return createMeetingRuntime(createMeetingSummaryFromNote(note));
}
