import { UsersIcon } from "lucide-react";
import { Badge } from "./ui/badge.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.js";
import { Checkbox } from "./ui/checkbox.js";
import type { MeetingTask } from "../types.js";
import type { ReactNode } from "react";

export type MeetingTaskListProps = {
  tasks: readonly MeetingTask[];
};

export function MeetingTaskList({ tasks }: MeetingTaskListProps): ReactNode {
  return (
    <Card className="gap-2 py-3">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="text-base">Todo list</CardTitle>
        <CardDescription>{tasks.length} extracted tasks</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <ul aria-label="Todo list" className="flex flex-col gap-1">
          {tasks.map((task) => (
            <li key={task.id} className="border-b py-1.5 last:border-b-0">
              <label className="grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)] gap-3">
                <Checkbox aria-label={task.title} className="mt-0.5" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <strong className="text-sm font-medium leading-5">{task.title}</strong>
                    <Badge variant="outline">{task.priority}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UsersIcon aria-hidden="true" className="size-3" />
                    <span>{task.people.join(", ")}</span>
                  </p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
