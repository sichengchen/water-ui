import { applyStreamEvent, createStreamState } from "@wasser-ui/core";
import { WasserRuntimeProvider, WasserStreamRenderer } from "@wasser-ui/react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  compileMeetingActionsPrompt,
  formatMockMeetingActionsStreamOutput,
  mockMeetingActionsAgentStream,
} from "./agent.js";
import { Badge } from "./components/ui/badge.js";
import { Button } from "./components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog.js";
import { Textarea } from "./components/ui/textarea.js";
import { meetingActionsRegistry } from "./registry.js";
import { createMeetingRuntimeFromNote } from "./runtime.js";
import { exampleMeetingNote } from "./types.js";
import "./styles.css";
import type { StreamState } from "@wasser-ui/core";
import type { MeetingRuntime } from "./runtime.js";
import type { ReactNode } from "react";

type PromptResponseDetails = {
  systemPrompt: string;
  llmOutput: string;
};

type ChatState =
  | {
      status: "idle";
    }
  | {
      status: "streaming";
      prompt: string;
      details: PromptResponseDetails;
      stream: StreamState;
      meetingRuntime: MeetingRuntime;
    }
  | {
      status: "ready";
      prompt: string;
      details: PromptResponseDetails;
      stream: StreamState;
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
  const canSend = note.trim().length > 0 && chat.status === "idle";

  async function sendMessage(): Promise<void> {
    if (!canSend) {
      return;
    }

    try {
      const runtime = createMeetingRuntimeFromNote(note);
      const details = {
        systemPrompt: compileMeetingActionsPrompt({
          runtime: runtime.capabilityRuntime.describe(),
          meetingNote: note,
        }),
        llmOutput: formatMockMeetingActionsStreamOutput({ tasks: runtime.summary.tasks }),
      };
      let stream = createStreamState();
      const streamOptions = {
        registry: meetingActionsRegistry,
        runtime: runtime.capabilityRuntime.describe(),
      };

      setChat({
        status: "streaming",
        prompt: defaultPrompt,
        details,
        stream,
        meetingRuntime: runtime,
      });

      for await (const event of mockMeetingActionsAgentStream({
        tasks: runtime.summary.tasks,
        delayMs: 1000,
      })) {
        const result = applyStreamEvent(stream, event, streamOptions);
        const errorDiagnostics = result.diagnostics.filter(
          (diagnostic) => diagnostic.severity === "error",
        );

        if (errorDiagnostics.length > 0) {
          setChat({
            status: "error",
            message: errorDiagnostics.map((diagnostic) => diagnostic.message).join("\n"),
          });
          return;
        }

        stream = result.state;
        setChat((current) =>
          current.status === "streaming"
            ? {
                ...current,
                stream,
              }
            : current,
        );
      }

      setChat((current) =>
        current.status === "streaming"
          ? {
              ...current,
              status: "ready",
              stream,
            }
          : current,
      );
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
              <Badge variant={chat.status === "idle" ? "outline" : "default"}>
                {chat.status === "idle" ? "Demo" : "Wasser UI"}
              </Badge>
            </div>
            <CardDescription>Ask the agent to transform the note</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            <div
              aria-live="polite"
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto empty:hidden"
            >
              {chat.status === "streaming" || chat.status === "ready"
                ? renderUserMessage(chat.prompt)
                : null}
              {renderAssistantMessage(chat)}
            </div>
            {renderAssistantControl(chat, canSend, sendMessage)}
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
        <p>Click the prompt to generate a Wasser UI todo list from the note.</p>
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
      <WasserRuntimeProvider
        registry={meetingActionsRegistry}
        runtime={chat.meetingRuntime.renderRuntime}
      >
        <WasserStreamRenderer stream={chat.stream} />
      </WasserRuntimeProvider>
    </div>
  );
}

function renderAssistantControl(
  chat: ChatState,
  canSend: boolean,
  sendMessage: () => Promise<void>,
): ReactNode {
  if (chat.status === "streaming" || chat.status === "ready") {
    return <PromptResponseDialog details={chat.details} />;
  }

  return (
    <Button
      aria-label={defaultPrompt}
      className="w-full"
      disabled={!canSend}
      onClick={() => void sendMessage()}
      variant="outline"
    >
      {defaultPrompt}
    </Button>
  );
}

function PromptResponseDialog({ details }: { details: PromptResponseDetails }): ReactNode {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          Show Prompt &amp; Response
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Prompt &amp; Response</DialogTitle>
          <DialogDescription>
            The Wasser UI stream prompt and the mocked JSONL events returned by the demo agent.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-4 md:grid-cols-2">
          <section className="flex min-h-0 flex-col gap-2">
            <h3 className="text-sm font-medium">Generated system prompt</h3>
            <Textarea
              aria-label="Generated system prompt"
              className="h-96 resize-none font-mono text-xs"
              readOnly
              spellCheck={false}
              value={details.systemPrompt}
              wrap="off"
            />
          </section>
          <section className="flex min-h-0 flex-col gap-2">
            <h3 className="text-sm font-medium">Mocked LLM output</h3>
            <Textarea
              aria-label="Mocked LLM output"
              className="h-96 resize-none font-mono text-xs"
              readOnly
              spellCheck={false}
              value={details.llmOutput}
              wrap="off"
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element.");
}

createRoot(root).render(<App />);
