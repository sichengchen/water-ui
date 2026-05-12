import { Component, Input } from "@angular/core";
import type { MeetingTask } from "../types.js";

@Component({
  selector: "app-meeting-task-list",
  standalone: true,
  template: `
    <div class="bg-card text-card-foreground flex flex-col gap-2 rounded-lg border py-3 shadow-sm">
      <div class="grid auto-rows-min items-start gap-1 px-4">
        <div class="text-base leading-none font-semibold">Todo list</div>
        <div class="text-muted-foreground text-sm">
          {{ tasks.length }} extracted {{ tasks.length === 1 ? "task" : "tasks" }}
        </div>
      </div>
      <div class="px-4">
        <ul aria-label="Todo list" class="flex flex-col gap-1">
          @for (task of tasks; track task.id) {
            <li class="border-b py-1.5 last:border-b-0">
              <label class="grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] gap-3">
                <input
                  [attr.aria-label]="task.title"
                  class="border-input accent-primary mt-0.5 size-4 shrink-0 rounded-[4px] border shadow-xs"
                  type="checkbox"
                />
                <div class="flex min-w-0 flex-col gap-1.5">
                  <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <strong class="text-sm leading-5 font-medium">{{ task.title }}</strong>
                    <span
                      class="text-foreground inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    @for (tag of task.tags; track tag) {
                      <span
                        class="bg-secondary text-secondary-foreground inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-xs font-medium"
                      >
                        {{ tag }}
                      </span>
                    }
                  </div>
                  <p class="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <svg
                      aria-hidden="true"
                      class="size-3"
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{{ task.people.join(", ") }}</span>
                  </p>
                </div>
              </label>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class MeetingTaskListComponent {
  @Input() tasks: readonly MeetingTask[] = [];
}
