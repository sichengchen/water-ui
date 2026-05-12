import { createWasserRuntime } from "@wasser-ui/runtime";
import { createMeetingSummaryFromNote, exampleMeetingSummary } from "./types.js";
import type { WasserRuntime as AngularWasserRuntime } from "@wasser-ui/angular";
import type { WasserRuntime } from "@wasser-ui/runtime";
import type { MeetingSummary } from "./types.js";

export type MeetingRuntime = {
  summary: MeetingSummary;
  capabilityRuntime: WasserRuntime;
  renderRuntime: AngularWasserRuntime;
};

export function createMeetingRuntime(
  summary: MeetingSummary = exampleMeetingSummary,
): MeetingRuntime {
  const capabilityRuntime = createWasserRuntime({
    permissions: {
      canRunAction: ({ risk }) => risk !== "destructive",
    },
  });

  const renderRuntime: AngularWasserRuntime = {};

  return {
    summary,
    capabilityRuntime,
    renderRuntime,
  };
}

export function createMeetingRuntimeFromNote(note: string): MeetingRuntime {
  return createMeetingRuntime(createMeetingSummaryFromNote(note));
}
