import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { createElement } from "react";
import { cn } from "../../lib/utils.js";
import type { ComponentProps, ReactNode } from "react";

export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>): ReactNode {
  return createElement(
    CheckboxPrimitive.Root,
    {
      ...props,
      className: cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ),
    },
    createElement(
      CheckboxPrimitive.Indicator,
      {
        className: "flex items-center justify-center text-current transition-none",
      },
      createElement(CheckIcon, { "aria-hidden": "true", className: "size-3.5" }),
    ),
  );
}
