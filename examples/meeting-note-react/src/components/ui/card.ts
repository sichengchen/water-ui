import { createElement } from "react";
import { cn } from "../../lib/utils.js";
import type { ComponentProps, ReactNode } from "react";

export type CardProps = ComponentProps<"div"> & {
  children?: ReactNode;
};

export function Card({ className, ...props }: CardProps): ReactNode {
  return createElement("div", {
    ...props,
    className: cn(
      "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
      className,
    ),
  });
}

export function CardHeader({ className, ...props }: ComponentProps<"div">): ReactNode {
  return createElement("div", {
    ...props,
    className: cn(
      "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
      className,
    ),
  });
}

export function CardTitle({ className, ...props }: ComponentProps<"div">): ReactNode {
  return createElement("div", {
    ...props,
    className: cn("leading-none font-semibold", className),
  });
}

export function CardDescription({ className, ...props }: ComponentProps<"div">): ReactNode {
  return createElement("div", {
    ...props,
    className: cn("text-muted-foreground text-sm", className),
  });
}

export function CardContent({ className, ...props }: ComponentProps<"div">): ReactNode {
  return createElement("div", {
    ...props,
    className: cn("px-6", className),
  });
}
