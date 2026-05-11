import { createElement } from "react";
import { cn } from "../../lib/cn.js";
import type { HTMLAttributes, ReactNode } from "react";

type PrimitiveProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

type DivProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function Card({ children, className, ...props }: PrimitiveProps): ReactNode {
  return createElement(
    "section",
    {
      ...props,
      className: cn("ui-card", className),
    },
    children,
  );
}

export function CardHeader({ children, className, ...props }: DivProps): ReactNode {
  return createElement(
    "div",
    {
      ...props,
      className: cn("ui-card-header", className),
    },
    children,
  );
}

export function CardTitle({ children, className, ...props }: PrimitiveProps): ReactNode {
  return createElement(
    "h2",
    {
      ...props,
      className: cn("ui-card-title", className),
    },
    children,
  );
}

export function CardDescription({ children, className, ...props }: PrimitiveProps): ReactNode {
  return createElement(
    "p",
    {
      ...props,
      className: cn("ui-card-description", className),
    },
    children,
  );
}

export function CardContent({ children, className, ...props }: DivProps): ReactNode {
  return createElement(
    "div",
    {
      ...props,
      className: cn("ui-card-content", className),
    },
    children,
  );
}
