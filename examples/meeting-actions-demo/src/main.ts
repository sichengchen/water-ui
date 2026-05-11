import { verifyDocument } from "@water-ui/core";
import { WaterRenderer, WaterRuntimeProvider } from "@water-ui/react";
import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { mockMeetingActionsAgent } from "./agent.js";
import { Badge } from "./components/ui/badge.js";
import { Button } from "./components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.js";
import { Textarea } from "./components/ui/textarea.js";
import { meetingActionsRegistry } from "./registry.js";
import { createMeetingRuntimeFromNote } from "./runtime.js";
import { exampleMeetingNote } from "./types.js";
import "./styles.css";
import type { VerifiedSchemaUI } from "@water-ui/core";
import type { WaterRuntime as ReactWaterRuntime } from "@water-ui/react";
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
      renderRuntime: ReactWaterRuntime;
    }
  | {
      status: "error";
      message: string;
    };

const defaultPrompt = "Turn this meeting note into a todo list.";

function App(): ReactNode {
  const [note, setNote] = useState(exampleMeetingNote);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [chat, setChat] = useState<ChatState>({ status: "idle" });
  const canSend = note.trim().length > 0 && prompt.trim().length > 0 && chat.status !== "thinking";

  async function sendMessage(): Promise<void> {
    if (!canSend) {
      return;
    }

    const sentPrompt = prompt.trim();
    setChat({ status: "thinking", prompt: sentPrompt });

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
        prompt: sentPrompt,
        ui: verification.ui,
        renderRuntime: runtime.renderRuntime,
      });
    } catch (error) {
      setChat({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    }
  }

  return createElement(
    "main",
    { className: "mx-auto h-dvh w-full max-w-6xl overflow-hidden p-6" },
    createElement(
      "section",
      { className: "grid h-full min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]" },
      createElement(
        Card,
        { className: "min-h-0 rounded-lg" },
        createElement(
          CardHeader,
          null,
          createElement(
            "div",
            { className: "flex items-start justify-between gap-3" },
            createElement(CardTitle, null, "Notebook"),
          ),
          createElement(CardDescription, null, "Demo meeting note"),
        ),
        createElement(
          CardContent,
          { className: "flex min-h-0 flex-1 flex-col" },
          createElement(Textarea, {
            "aria-label": "Meeting note",
            autoComplete: "off",
            className:
              "min-h-0 flex-1 resize-none overflow-auto border-0 bg-[linear-gradient(#fff_31px,#f1f5f9_32px)] bg-[length:100%_32px] leading-8 shadow-none focus-visible:ring-0",
            name: "meeting-note",
            value: note,
            onChange: (event) => setNote(event.currentTarget.value),
          }),
        ),
      ),
      createElement(
        Card,
        { className: "min-h-0 rounded-lg" },
        createElement(
          CardHeader,
          null,
          createElement(
            "div",
            { className: "flex items-start justify-between gap-3" },
            createElement(CardTitle, null, "Assistant"),
            createElement(
              Badge,
              { variant: chat.status === "ready" ? "default" : "outline" },
              chat.status === "ready" ? "Water UI" : "Demo",
            ),
          ),
          createElement(CardDescription, null, "Ask the agent to transform the note"),
        ),
        createElement(
          CardContent,
          { className: "flex min-h-0 flex-1 flex-col gap-3" },
          createElement(
            "div",
            {
              className: "flex min-h-0 flex-1 flex-col gap-3 overflow-auto empty:hidden",
              "aria-live": "polite",
            },
            chat.status === "thinking" || chat.status === "ready"
              ? renderUserMessage(chat.prompt)
              : null,
            renderAssistantMessage(chat),
          ),
          createElement(
            "div",
            {
              className:
                "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 pt-2 max-sm:grid-cols-1",
            },
            createElement(Textarea, {
              "aria-label": "Chat message",
              autoComplete: "off",
              className: "min-h-16 resize-none",
              name: "chat-message",
              value: prompt,
              onChange: (event) => setPrompt(event.currentTarget.value),
              onKeyDown: (event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  void sendMessage();
                }
              },
            }),
            createElement(
              Button,
              {
                disabled: !canSend,
                onClick: () => void sendMessage(),
              },
              chat.status === "thinking" ? "Sending..." : "Send",
            ),
          ),
        ),
      ),
    ),
  );
}

function renderUserMessage(prompt: string): ReactNode {
  return createElement(
    "div",
    {
      className:
        "ml-auto max-w-[86%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground",
    },
    createElement("p", null, prompt || defaultPrompt),
  );
}

function renderAssistantMessage(chat: ChatState): ReactNode {
  if (chat.status === "idle") {
    return createElement(
      "div",
      {
        className: "mr-auto max-w-[88%] text-sm text-muted-foreground",
      },
      createElement("p", null, "Send the prompt to generate a Water UI todo list from the note."),
    );
  }

  if (chat.status === "thinking") {
    return createElement(
      "div",
      {
        className: "mr-auto inline-flex items-center gap-2 text-sm text-muted-foreground",
      },
      createElement("span", {
        className:
          "size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none",
      }),
      createElement("span", {
        className:
          "size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none",
      }),
      createElement("span", {
        className:
          "size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none",
      }),
      createElement("p", null, "Thinking..."),
    );
  }

  if (chat.status === "error") {
    return createElement(
      "div",
      {
        className:
          "mr-auto max-w-[88%] rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
      },
      createElement("p", null, chat.message),
    );
  }

  return createElement(
    "div",
    { className: "mr-auto w-full max-w-[92%]" },
    createElement(
      WaterRuntimeProvider,
      {
        registry: meetingActionsRegistry,
        runtime: chat.renderRuntime,
      },
      createElement(WaterRenderer, { ui: chat.ui }),
    ),
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

createRoot(root).render(createElement(App));
