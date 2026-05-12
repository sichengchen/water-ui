import { createWasserRuntime } from "@wasser-ui/runtime";
import { createMeetingSummaryFromNote, exampleMeetingSummary } from "./types.js";
import type { WasserRuntime as ReactWasserRuntime } from "@wasser-ui/react";
import type { WasserRuntime } from "@wasser-ui/runtime";
import type { MeetingSummary } from "./types.js";

export type MeetingRuntime = {
  summary: MeetingSummary;
  capabilityRuntime: WasserRuntime;
  renderRuntime: ReactWasserRuntime;
};

export function createMeetingRuntime(
  summary: MeetingSummary = exampleMeetingSummary,
): MeetingRuntime {
  const capabilityRuntime = createWasserRuntime({
    permissions: {
      canRunAction: ({ risk }) => risk !== "destructive",
    },
  });

  const renderRuntime: ReactWasserRuntime = {};

  return {
    summary,
    capabilityRuntime,
    renderRuntime,
  };
}

export function createMeetingRuntimeFromNote(note: string): MeetingRuntime {
  return createMeetingRuntime(createMeetingSummaryFromNote(note));
}
