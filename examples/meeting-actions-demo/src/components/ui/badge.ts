import { createElement } from "react";
import { cn } from "../../lib/cn.js";
import type { HTMLAttributes, ReactNode } from "react";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
};

export function Badge({ children, className, ...props }: BadgeProps): ReactNode {
  return createElement(
    "span",
    {
      ...props,
      className: cn("ui-badge", className),
    },
    children,
  );
}
