import { verifyDocument } from "@water-ui/core";
import { mockMeetingActionsAgent, compileMeetingActionsPrompt } from "./agent.js";
import { meetingActionsRegistry } from "./registry.js";
import { createMeetingRuntime } from "./runtime.js";
import type { VerifiedSchemaUI, VerificationDiagnostic } from "@water-ui/core";
import type { MeetingRuntime } from "./runtime.js";

export type MeetingActionsDemoResult = {
  prompt: string;
  ui: VerifiedSchemaUI;
  runtime: MeetingRuntime;
};

export async function runMeetingActionsDemo(
  options: {
    meetingNote?: string;
  } = {},
): Promise<MeetingActionsDemoResult> {
  const runtime = createMeetingRuntime();
  const prompt = compileMeetingActionsPrompt({
    runtime: runtime.capabilityRuntime.describe(),
    meetingNote: options.meetingNote,
  });
  const document = await mockMeetingActionsAgent();
  const verification = verifyDocument(document, {
    registry: meetingActionsRegistry,
    runtime: runtime.capabilityRuntime.describe(),
  });

  if (!verification.ok) {
    throw new MeetingActionsVerificationError(verification.diagnostics);
  }

  return {
    prompt,
    ui: verification.ui,
    runtime,
  };
}

export class MeetingActionsVerificationError extends Error {
  readonly diagnostics: readonly VerificationDiagnostic[];

  constructor(diagnostics: readonly VerificationDiagnostic[]) {
    super("Meeting actions UI failed verification.");
    this.name = "MeetingActionsVerificationError";
    this.diagnostics = diagnostics;
  }
}
