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
    }
  | {
      status: "ready";
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

    setChat({ status: "thinking" });

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
    { className: "app-shell" },
    createElement(
      "section",
      { className: "notebook-layout" },
      createElement(
        Card,
        { className: "notebook-card" },
        createElement(
          CardHeader,
          null,
          createElement(
            "div",
            { className: "card-title-row" },
            createElement(CardTitle, null, "Notebook"),
            createElement(Badge, null, `${getNoteLineCount(note)} lines`),
          ),
          createElement(CardDescription, null, "Demo meeting note"),
        ),
        createElement(
          CardContent,
          null,
          createElement(Textarea, {
            "aria-label": "Meeting note",
            className: "note-editor",
            value: note,
            onChange: (event) => setNote(event.currentTarget.value),
          }),
        ),
      ),
      createElement(
        Card,
        { className: "chat-card" },
        createElement(
          CardHeader,
          null,
          createElement(
            "div",
            { className: "card-title-row" },
            createElement(CardTitle, null, "Assistant"),
            createElement(Badge, null, chat.status === "ready" ? "Water UI" : "Demo"),
          ),
          createElement(CardDescription, null, "Ask the agent to transform the note"),
        ),
        createElement(
          CardContent,
          null,
          createElement(
            "div",
            { className: "chat-thread", "aria-live": "polite" },
            renderUserMessage(prompt),
            renderAssistantMessage(chat),
          ),
          createElement(
            "div",
            { className: "chat-composer" },
            createElement(Textarea, {
              "aria-label": "Chat message",
              className: "chat-input",
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
    { className: "chat-message user-message" },
    createElement("p", null, prompt || defaultPrompt),
  );
}

function renderAssistantMessage(chat: ChatState): ReactNode {
  if (chat.status === "idle") {
    return createElement(
      "div",
      { className: "chat-message assistant-message muted-message" },
      createElement(
        "p",
        null,
        "The generated todo list will appear here after you send the prompt.",
      ),
    );
  }

  if (chat.status === "thinking") {
    return createElement(
      "div",
      { className: "chat-message assistant-message thinking-message" },
      createElement("span", { className: "thinking-dot" }),
      createElement("span", { className: "thinking-dot" }),
      createElement("span", { className: "thinking-dot" }),
      createElement("p", null, "Thinking..."),
    );
  }

  if (chat.status === "error") {
    return createElement(
      "div",
      { className: "chat-message assistant-message error-message" },
      createElement("p", null, chat.message),
    );
  }

  return createElement(
    "div",
    { className: "chat-message assistant-message water-response" },
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

function getNoteLineCount(note: string): number {
  return note.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
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
