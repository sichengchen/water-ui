<script setup lang="ts">
import { applyStreamEvent, createStreamState } from "@wasser-ui/core";
import { WasserRuntimeProvider, WasserStreamRenderer } from "@wasser-ui/vue";
import { computed, ref } from "vue";
import {
  compileMeetingActionsPrompt,
  formatMockMeetingActionsStreamOutput,
  mockMeetingActionsAgentStream,
} from "./agent.js";
import { meetingActionsRegistry } from "./registry.js";
import { createMeetingRuntimeFromNote } from "./runtime.js";
import { exampleMeetingNote } from "./types.js";
import type { StreamState } from "@wasser-ui/core";
import type { MeetingRuntime } from "./runtime.js";

type ChatStatus = "idle" | "streaming" | "ready" | "error";

type PromptResponseDetails = {
  systemPrompt: string;
  llmOutput: string;
};

const defaultPrompt = "Turn this meeting note into a todo list.";

const note = ref(exampleMeetingNote);
const status = ref<ChatStatus>("idle");
const prompt = ref(defaultPrompt);
const details = ref<PromptResponseDetails>();
const stream = ref<StreamState>();
const meetingRuntime = ref<MeetingRuntime>();
const errorMessage = ref("");
const showDetails = ref(false);
const canSend = computed(() => note.value.trim().length > 0 && status.value === "idle");
const hasAssistantResult = computed(() => status.value === "streaming" || status.value === "ready");

async function sendMessage(): Promise<void> {
  if (!canSend.value) {
    return;
  }

  try {
    const runtime = createMeetingRuntimeFromNote(note.value);
    const responseDetails = {
      systemPrompt: compileMeetingActionsPrompt({
        runtime: runtime.capabilityRuntime.describe(),
        meetingNote: note.value,
      }),
      llmOutput: formatMockMeetingActionsStreamOutput({ tasks: runtime.summary.tasks }),
    };
    let nextStream = createStreamState();
    const streamOptions = {
      registry: meetingActionsRegistry,
      runtime: runtime.capabilityRuntime.describe(),
    };

    status.value = "streaming";
    prompt.value = defaultPrompt;
    details.value = responseDetails;
    stream.value = nextStream;
    meetingRuntime.value = runtime;
    errorMessage.value = "";
    showDetails.value = false;

    for await (const event of mockMeetingActionsAgentStream({
      tasks: runtime.summary.tasks,
      delayMs: 1000,
    })) {
      const result = applyStreamEvent(nextStream, event, streamOptions);
      const errorDiagnostics = result.diagnostics.filter(
        (diagnostic) => diagnostic.severity === "error",
      );

      if (errorDiagnostics.length > 0) {
        status.value = "error";
        errorMessage.value = errorDiagnostics.map((diagnostic) => diagnostic.message).join("\n");
        return;
      }

      nextStream = result.state;
      stream.value = nextStream;
    }

    status.value = "ready";
  } catch (error) {
    status.value = "error";
    errorMessage.value = error instanceof Error ? error.message : "Unknown error.";
  }
}
</script>

<template>
  <main class="mx-auto h-dvh w-full max-w-6xl overflow-hidden p-6">
    <section class="grid h-full min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <section
        class="bg-card text-card-foreground flex min-h-0 flex-col gap-6 rounded-lg border py-6 shadow-sm"
      >
        <header class="grid auto-rows-min items-start gap-1.5 px-6">
          <div class="flex items-start justify-between gap-3">
            <h1 class="leading-none font-semibold">Notebook</h1>
          </div>
          <p class="text-muted-foreground text-sm">Demo meeting note</p>
        </header>
        <div class="flex min-h-0 flex-1 flex-col px-6">
          <textarea
            v-model="note"
            aria-label="Meeting note"
            autocomplete="off"
            class="min-h-0 flex-1 resize-none overflow-auto border-0 bg-[linear-gradient(#fff_31px,#f1f5f9_32px)] bg-[length:100%_32px] px-3 py-2 text-base leading-8 shadow-none outline-none focus-visible:ring-0 md:text-sm"
            name="meeting-note"
          />
        </div>
      </section>

      <section
        class="bg-card text-card-foreground flex min-h-0 flex-col gap-6 rounded-lg border py-6 shadow-sm"
      >
        <header class="grid auto-rows-min items-start gap-1.5 px-6">
          <div class="flex items-start justify-between gap-3">
            <h2 class="leading-none font-semibold">Assistant</h2>
            <span
              class="inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium"
              :class="
                status === 'idle'
                  ? 'text-foreground'
                  : 'border-transparent bg-primary text-primary-foreground'
              "
            >
              {{ status === "idle" ? "Demo" : "Wasser UI" }}
            </span>
          </div>
          <p class="text-muted-foreground text-sm">Ask the agent to transform the note</p>
        </header>
        <div class="flex min-h-0 flex-1 flex-col gap-3 px-6">
          <div
            aria-live="polite"
            class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto empty:hidden"
          >
            <div
              v-if="hasAssistantResult"
              class="ml-auto max-w-[86%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              <p>{{ prompt || defaultPrompt }}</p>
            </div>

            <div v-if="status === 'idle'" class="text-muted-foreground mr-auto max-w-[88%] text-sm">
              <p>Click the prompt to generate a Wasser UI todo list from the note.</p>
            </div>
            <div
              v-else-if="status === 'error'"
              class="border-destructive/30 bg-destructive/10 text-destructive mr-auto max-w-[88%] rounded-lg border px-3 py-2 text-sm"
            >
              <p>{{ errorMessage }}</p>
            </div>
            <div v-else-if="stream && meetingRuntime" class="mr-auto w-full max-w-[92%]">
              <WasserRuntimeProvider
                :registry="meetingActionsRegistry"
                :runtime="meetingRuntime.renderRuntime"
              >
                <WasserStreamRenderer :stream="stream" />
              </WasserRuntimeProvider>
            </div>
          </div>

          <button
            v-if="hasAssistantResult"
            class="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            type="button"
            @click="showDetails = true"
          >
            Show Prompt &amp; Response
          </button>
          <button
            v-else
            :aria-label="defaultPrompt"
            class="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            :disabled="!canSend"
            type="button"
            @click="sendMessage"
          >
            {{ defaultPrompt }}
          </button>
        </div>
      </section>
    </section>

    <div v-if="showDetails && details" class="fixed inset-0 z-50">
      <button
        aria-label="Close prompt and response"
        class="absolute inset-0 bg-black/50"
        type="button"
        @click="showDetails = false"
      />
      <section
        aria-modal="true"
        class="bg-background fixed top-[50%] left-[50%] grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-lg border p-6 shadow-lg sm:max-w-4xl"
        role="dialog"
      >
        <header class="flex flex-col gap-2 text-center sm:text-left">
          <h2 class="text-lg leading-none font-semibold">Prompt &amp; Response</h2>
          <p class="text-muted-foreground text-sm">
            The Wasser UI stream prompt and the mocked JSONL events returned by the demo agent.
          </p>
        </header>
        <button
          class="absolute top-4 right-4 inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          type="button"
          @click="showDetails = false"
        >
          Close
        </button>
        <div class="grid min-h-0 gap-4 md:grid-cols-2">
          <section class="flex min-h-0 flex-col gap-2">
            <h3 class="text-sm font-medium">Generated system prompt</h3>
            <textarea
              aria-label="Generated system prompt"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-96 w-full resize-none rounded-md border bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
              readonly
              :value="details.systemPrompt"
              wrap="off"
            />
          </section>
          <section class="flex min-h-0 flex-col gap-2">
            <h3 class="text-sm font-medium">Mocked LLM output</h3>
            <textarea
              aria-label="Mocked LLM output"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-96 w-full resize-none rounded-md border bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:ring-[3px]"
              readonly
              :value="details.llmOutput"
              wrap="off"
            />
          </section>
        </div>
      </section>
    </div>
  </main>
</template>
