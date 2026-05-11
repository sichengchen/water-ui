import { createElement } from "react";
import { cn } from "../../lib/cn.js";
import type { ReactNode, TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps): ReactNode {
  return createElement("textarea", {
    ...props,
    className: cn("ui-textarea", className),
  });
}
