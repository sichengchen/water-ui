import { createElement } from "react";
import { cn } from "../../lib/cn.js";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: "default" | "secondary" | "outline";
} & Record<`data-${string}`, string | undefined>;

export function Button({
  children,
  className,
  type = "button",
  variant = "default",
  ...props
}: ButtonProps): ReactNode {
  return createElement(
    "button",
    {
      ...props,
      className: cn("ui-button", `ui-button-${variant}`, className),
      type,
    },
    children,
  );
}
