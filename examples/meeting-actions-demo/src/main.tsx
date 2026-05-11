import { verifyDocument } from "@water-ui/core";
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { mockMeetingActionsAgent } from "./agent.js";
import { Badge } from "./components/ui/badge.js";
import { Button } from "./components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.js";
import { Textarea } from "./components/ui/textarea.js";
import { meetingActionsRegistry } from "./registry.js";
import { createMeetingRuntimeFromNote } from "./runtime.js";
import { CREATE_TASKS_ACTION_ID, MEETING_SUMMARY_DATA_REF, exampleMeetingNote } from "./types.js";
import "./styles.css";
import type { VerifiedSchemaUI } from "@water-ui/core";
import type { MeetingRuntime } from "./runtime.js";
import type { ReactNode } from "react";

type ChatState =
  | {
      status: "idle";
    }
  | {
      status: "thinking";
      prompt: string;
    }
  | {
      status: "ready";
      prompt: string;
      ui: VerifiedSchemaUI;
      meetingRuntime: MeetingRuntime;
    }
  | {
      status: "error";
      message: string;
    };

const defaultPrompt = "Turn this meeting note into a todo list.";

function App(): ReactNode {
  const [note, setNote] = useState(exampleMeetingNote);
  const [chat, setChat] = useState<ChatState>({ status: "idle" });
  const canSend = note.trim().length > 0 && chat.status !== "thinking";

  async function sendMessage(): Promise<void> {
    if (!canSend) {
      return;
    }

    setChat({ status: "thinking", prompt: defaultPrompt });

    try {
      await wait(500);

      const runtime = createMeetingRuntimeFromNote(note);
      const document = await mockMeetingActionsAgent();
      const verification = verifyDocument(document, {
        registry: meetingActionsRegistry,
        runtime: runtime.capabilityRuntime.describe(),
      });

      if (!verification.ok) {
        setChat({
          status: "error",
          message: verification.diagnostics.map((diagnostic) => diagnostic.message).join("\n"),
        });
        return;
      }

      setChat({
        status: "ready",
        prompt: defaultPrompt,
        ui: verification.ui,
        meetingRuntime: runtime,
      });
    } catch (error) {
      setChat({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  }

  return (
    <main className="mx-auto h-dvh w-full max-w-6xl overflow-hidden p-6">
      <section className="grid h-full min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <Card className="min-h-0 rounded-lg">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>Notebook</CardTitle>
            </div>
            <CardDescription>Demo meeting note</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <Textarea
              aria-label="Meeting note"
              autoComplete="off"
              className="min-h-0 flex-1 resize-none overflow-auto border-0 bg-[linear-gradient(#fff_31px,#f1f5f9_32px)] bg-[length:100%_32px] leading-8 shadow-none focus-visible:ring-0"
              name="meeting-note"
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
            />
          </CardContent>
        </Card>

        <Card className="min-h-0 rounded-lg">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>Assistant</CardTitle>
              <Badge variant={chat.status === "ready" ? "default" : "outline"}>
                {chat.status === "ready" ? "Water UI" : "Demo"}
              </Badge>
            </div>
            <CardDescription>Ask the agent to transform the note</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            <div
              aria-live="polite"
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto empty:hidden"
            >
              {chat.status === "thinking" || chat.status === "ready"
                ? renderUserMessage(chat.prompt)
                : null}
              {renderAssistantMessage(chat)}
            </div>
            {renderCreateTasksButton(chat)}
            <Button
              aria-label={defaultPrompt}
              className="w-full"
              disabled={!canSend}
              onClick={() => void sendMessage()}
            >
              {chat.status === "thinking" ? "Thinking..." : defaultPrompt}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function renderUserMessage(prompt: string): ReactNode {
  return (
    <div className="ml-auto max-w-[86%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
      <p>{prompt || defaultPrompt}</p>
    </div>
  );
}

function renderAssistantMessage(chat: ChatState): ReactNode {
  if (chat.status === "idle") {
    return (
      <div className="mr-auto max-w-[88%] text-sm text-muted-foreground">
        <p>Click the prompt to generate a Water UI todo list from the note.</p>
      </div>
    );
  }

  if (chat.status === "thinking") {
    return (
      <div className="mr-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none" />
        <p>Thinking...</p>
      </div>
    );
  }

  if (chat.status === "error") {
    return (
      <div className="mr-auto max-w-[88%] rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <p>{chat.message}</p>
      </div>
    );
  }

  return (
    <div className="mr-auto w-full max-w-[92%]">
      <WaterRuntimeProvider
        registry={meetingActionsRegistry}
        runtime={chat.meetingRuntime.renderRuntime}
      >
        <WaterRenderer ui={chat.ui} />
      </WaterRuntimeProvider>
    </div>
  );
}

function renderCreateTasksButton(chat: ChatState): ReactNode {
  if (chat.status !== "ready") {
    return null;
  }

  return (
    <Button
      aria-label="Create tasks"
      className="w-full"
      data-action-id={CREATE_TASKS_ACTION_ID}
      onClick={() => {
        void chat.meetingRuntime.capabilityRuntime.runAction(CREATE_TASKS_ACTION_ID, {
          dataRef: MEETING_SUMMARY_DATA_REF,
          tasks: chat.meetingRuntime.summary.tasks,
        });
      }}
    >
      Create tasks
    </Button>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element.");
}

createRoot(root).render(<App />);
