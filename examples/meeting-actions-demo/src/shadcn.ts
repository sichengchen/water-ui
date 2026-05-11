import { createElement } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimitiveProps = {
  children?: ReactNode;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  PrimitiveProps &
  Record<`data-${string}`, string | undefined>;

export function Card({ children }: PrimitiveProps): ReactNode {
  return createElement("section", { "data-slot": "card" }, children);
}

export function CardHeader({ children }: PrimitiveProps): ReactNode {
  return createElement("header", { "data-slot": "card-header" }, children);
}

export function CardTitle({ children }: PrimitiveProps): ReactNode {
  return createElement("h2", { "data-slot": "card-title" }, children);
}

export function CardDescription({ children }: PrimitiveProps): ReactNode {
  return createElement("p", { "data-slot": "card-description" }, children);
}

export function CardContent({ children }: PrimitiveProps): ReactNode {
  return createElement("div", { "data-slot": "card-content" }, children);
}

export function Button({ children, type = "button", ...props }: ButtonProps): ReactNode {
  return createElement("button", { ...props, "data-slot": "button", type }, children);
}

export function Badge({ children }: PrimitiveProps): ReactNode {
  return createElement("span", { "data-slot": "badge" }, children);
}
