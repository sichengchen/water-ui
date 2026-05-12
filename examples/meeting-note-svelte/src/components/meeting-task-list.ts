import { waterElement } from "@water-ui/svelte";
import type { WaterSvelteChild } from "@water-ui/svelte";
import type { MeetingTask } from "../types.js";

export function renderMeetingTaskList(tasks: readonly MeetingTask[]): WaterSvelteChild {
  return waterElement("div", cardClasses, [
    waterElement("div", { class: "grid auto-rows-min items-start gap-1 px-4" }, [
      waterElement("div", { class: "text-base leading-none font-semibold" }, "Todo list"),
      waterElement(
        "div",
        { class: "text-muted-foreground text-sm" },
        `${tasks.length} extracted ${tasks.length === 1 ? "task" : "tasks"}`,
      ),
    ]),
    waterElement(
      "div",
      { class: "px-4" },
      waterElement(
        "ul",
        { "aria-label": "Todo list", class: "flex flex-col gap-1" },
        tasks.map(renderMeetingTask),
      ),
    ),
  ]);
}

function renderMeetingTask(task: MeetingTask): WaterSvelteChild {
  return waterElement("li", { class: "border-b py-1.5 last:border-b-0" }, [
    waterElement("label", { class: "grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] gap-3" }, [
      waterElement("input", {
        "aria-label": task.title,
        class: "border-input accent-primary mt-0.5 size-4 shrink-0 rounded-[4px] border shadow-xs",
        type: "checkbox",
      }),
      waterElement("div", { class: "flex min-w-0 flex-col gap-1.5" }, [
        waterElement("div", { class: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3" }, [
          waterElement("strong", { class: "text-sm leading-5 font-medium" }, task.title),
          waterElement("span", priorityClasses, task.priority),
        ]),
        waterElement(
          "div",
          { class: "flex flex-wrap gap-1.5" },
          task.tags.map((tag) => waterElement("span", tagClasses, tag)),
        ),
        waterElement("p", { class: "text-muted-foreground flex items-center gap-1.5 text-xs" }, [
          usersIcon(),
          waterElement("span", undefined, task.people.join(", ")),
        ]),
      ]),
    ]),
  ]);
}

function usersIcon(): WaterSvelteChild {
  return waterElement(
    "svg",
    {
      "aria-hidden": "true",
      class: "size-3",
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "2",
      viewBox: "0 0 24 24",
    },
    [
      waterElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
      waterElement("circle", { cx: "9", cy: "7", r: "4" }),
      waterElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
      waterElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
    ],
  );
}

const cardClasses = {
  class: "bg-card text-card-foreground flex flex-col gap-2 rounded-lg border py-3 shadow-sm",
};

const priorityClasses = {
  class:
    "text-foreground inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
};

const tagClasses = {
  class:
    "bg-secondary text-secondary-foreground inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-xs font-medium",
};
