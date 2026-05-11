import { createElement } from "react";
import { z } from "zod";
import type { WaterComponentDefinition, WaterComponentExample } from "@water-ui/core";
import type { WaterRenderBinding } from "@water-ui/react";
import type { ComponentType, ReactNode } from "react";

export type ShadcnButtonProps = {
  label: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  actionId?: string;
  disabled?: boolean;
  buttonType?: "button" | "submit" | "reset";
};

export type ShadcnCardProps = {
  title?: string;
  description?: string;
};

export type ShadcnAlertProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export type ShadcnInputProps = {
  type?: "text" | "email" | "search" | "password" | "number";
  placeholder?: string;
  value?: string | number;
  disabled?: boolean;
  stateKey?: string;
};

export type ShadcnBadgeProps = {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
};

export type ShadcnButtonRenderProps = {
  variant?: ShadcnButtonProps["variant"];
  size?: ShadcnButtonProps["size"];
  disabled?: boolean;
  type?: ShadcnButtonProps["buttonType"];
  onClick?: () => unknown;
  children?: ReactNode;
};

export type ShadcnCardRenderProps = {
  children?: ReactNode;
};

export type ShadcnCardSectionProps = {
  children?: ReactNode;
};

export type ShadcnAlertRenderProps = {
  variant?: ShadcnAlertProps["variant"];
  children?: ReactNode;
};

export type ShadcnInputRenderProps = {
  type?: ShadcnInputProps["type"];
  placeholder?: string;
  value?: string | number;
  disabled?: boolean;
  readOnly?: boolean;
};

export type ShadcnBadgeRenderProps = {
  variant?: ShadcnBadgeProps["variant"];
  children?: ReactNode;
};

export type ShadcnComponentBindings = {
  Button?: ComponentType<ShadcnButtonRenderProps>;
  Card?: ComponentType<ShadcnCardRenderProps>;
  CardHeader?: ComponentType<ShadcnCardSectionProps>;
  CardTitle?: ComponentType<ShadcnCardSectionProps>;
  CardDescription?: ComponentType<ShadcnCardSectionProps>;
  CardContent?: ComponentType<ShadcnCardSectionProps>;
  CardFooter?: ComponentType<ShadcnCardSectionProps>;
  Alert?: ComponentType<ShadcnAlertRenderProps>;
  AlertTitle?: ComponentType<ShadcnCardSectionProps>;
  AlertDescription?: ComponentType<ShadcnCardSectionProps>;
  Input?: ComponentType<ShadcnInputRenderProps>;
  Badge?: ComponentType<ShadcnBadgeRenderProps>;
};

export type CreateShadcnComponentsOptions = {
  components?: ShadcnComponentBindings;
};

export type ShadcnRegistryComponents = Readonly<Record<string, WaterComponentDefinition>>;

export type ShadcnImportAliases = {
  ui: string;
};

export type ShadcnComponentModule = "button" | "card" | "alert" | "input" | "badge";

export type ShadcnAdapterConfig = {
  aliases: ShadcnImportAliases;
  imports: Readonly<Record<ShadcnComponentModule, string>>;
};

const buttonSchema = z
  .object({
    label: z.string().min(1),
    variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
    size: z.enum(["default", "sm", "lg", "icon"]).optional(),
    actionId: z.string().min(1).optional(),
    disabled: z.boolean().optional(),
    buttonType: z.enum(["button", "submit", "reset"]).optional(),
  })
  .strict();

const cardSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
  })
  .strict();

const alertSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    variant: z.enum(["default", "destructive"]).optional(),
  })
  .strict();

const inputSchema = z
  .object({
    type: z.enum(["text", "email", "search", "password", "number"]).optional(),
    placeholder: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
    disabled: z.boolean().optional(),
    stateKey: z.string().min(1).optional(),
  })
  .strict();

const badgeSchema = z
  .object({
    label: z.string().min(1),
    variant: z.enum(["default", "secondary", "destructive", "outline"]).optional(),
  })
  .strict();

export const shadcnPromptExamples: Readonly<Record<string, readonly WaterComponentExample[]>> =
  Object.freeze({
    Button: [
      {
        intent: "run a registered export action",
        node: {
          type: "Button",
          props: {
            label: "Export customers",
            variant: "outline",
            actionId: "exportCustomers",
          },
        },
      },
    ],
    Card: [
      {
        intent: "group summary content in a shadcn card",
        node: {
          type: "Card",
          props: {
            title: "Revenue",
            description: "Current period summary",
          },
          children: ["revenue_metric"],
        },
      },
    ],
    Alert: [
      {
        intent: "show a destructive warning",
        node: {
          type: "Alert",
          props: {
            title: "Action required",
            description: "Review destructive changes before continuing.",
            variant: "destructive",
          },
        },
      },
    ],
    Input: [
      {
        intent: "show a search input bound to registered state",
        node: {
          type: "Input",
          props: {
            type: "search",
            placeholder: "Search customers",
            stateKey: "filters.search",
          },
        },
      },
    ],
    Badge: [
      {
        intent: "display a secondary status label",
        node: {
          type: "Badge",
          props: {
            label: "Active",
            variant: "secondary",
          },
        },
      },
    ],
  });

export const shadcnFallbackComponents: Required<ShadcnComponentBindings> = Object.freeze({
  Button: ({ children, onClick, disabled, type }) =>
    createElement("button", { disabled, onClick, type: type ?? "button" }, children),
  Card: ({ children }) => createElement("section", { "data-shadcn-fallback": "card" }, children),
  CardHeader: ({ children }) => createElement("header", null, children),
  CardTitle: ({ children }) => createElement("h2", null, children),
  CardDescription: ({ children }) => createElement("p", null, children),
  CardContent: ({ children }) => createElement("div", null, children),
  CardFooter: ({ children }) => createElement("footer", null, children),
  Alert: ({ children }) => createElement("section", { role: "alert" }, children),
  AlertTitle: ({ children }) => createElement("h2", null, children),
  AlertDescription: ({ children }) => createElement("p", null, children),
  Input: ({ type, placeholder, value, disabled, readOnly }) =>
    createElement("input", {
      disabled,
      placeholder,
      readOnly,
      type: type ?? "text",
      value,
    }),
  Badge: ({ children }) => createElement("span", null, children),
});

export const shadcnComponents = createShadcnComponents();

export function createShadcnComponents(
  options: CreateShadcnComponentsOptions = {},
): ShadcnRegistryComponents {
  const components = {
    ...shadcnFallbackComponents,
    ...options.components,
  };

  return Object.freeze({
    Button: createButtonDefinition(components),
    Card: createCardDefinition(components),
    Alert: createAlertDefinition(components),
    Input: createInputDefinition(components),
    Badge: createBadgeDefinition(components),
  });
}

export function createShadcnAdapterConfig(options: {
  aliases: ShadcnImportAliases;
}): ShadcnAdapterConfig {
  const uiAlias = normalizeAlias(options.aliases.ui);
  const imports: Record<ShadcnComponentModule, string> = {
    button: `${uiAlias}/button`,
    card: `${uiAlias}/card`,
    alert: `${uiAlias}/alert`,
    input: `${uiAlias}/input`,
    badge: `${uiAlias}/badge`,
  };

  return Object.freeze({
    aliases: Object.freeze({
      ui: uiAlias,
    }),
    imports: Object.freeze(imports),
  });
}

export function getShadcnImportPath(
  config: ShadcnAdapterConfig,
  module: ShadcnComponentModule,
): string {
  return config.imports[module];
}

function createButtonDefinition(
  components: Required<ShadcnComponentBindings>,
): WaterComponentDefinition<ShadcnButtonProps> {
  const render: WaterRenderBinding<ShadcnButtonProps> = ({ props, bindings }) => {
    const actionId = props.actionId;
    const onClick = actionId
      ? () => bindings.actions[actionId]?.({ source: "shadcn.Button" })
      : undefined;

    return createElement(
      components.Button,
      {
        disabled: props.disabled,
        onClick,
        size: props.size,
        type: props.buttonType ?? "button",
        variant: props.variant,
      },
      props.label,
    );
  };

  return {
    description: "shadcn Button for registered UI actions.",
    propsSchema: buttonSchema,
    children: "none",
    prompt: {
      props: [
        {
          name: "label",
          description: "Visible button text.",
          required: true,
        },
        {
          name: "variant",
          description: "shadcn visual variant.",
          allowedValues: ["default", "destructive", "outline", "secondary", "ghost", "link"],
        },
        {
          name: "size",
          description: "shadcn button size.",
          allowedValues: ["default", "sm", "lg", "icon"],
        },
        {
          name: "actionId",
          description: "Registered runtime action ID to invoke.",
        },
      ],
      notes: ["Do not invent action IDs. Use only actions registered in the Water runtime."],
    },
    examples: shadcnPromptExamples.Button,
    render,
  };
}

function createCardDefinition(
  components: Required<ShadcnComponentBindings>,
): WaterComponentDefinition<ShadcnCardProps> {
  const render: WaterRenderBinding<ShadcnCardProps> = ({ props, children, slots }) => {
    const header =
      slots.header ??
      (props.title || props.description
        ? createElement(
            components.CardHeader,
            null,
            props.title ? createElement(components.CardTitle, null, props.title) : null,
            props.description
              ? createElement(components.CardDescription, null, props.description)
              : null,
          )
        : null);

    return createElement(
      components.Card,
      null,
      header,
      createElement(components.CardContent, null, children),
      slots.footer ? createElement(components.CardFooter, null, slots.footer) : null,
    );
  };

  return {
    description: "shadcn Card for grouping verified Schema UI nodes.",
    propsSchema: cardSchema,
    children: "nodes",
    slots: {
      header: {
        description: "Optional custom header content.",
      },
      footer: {
        description: "Optional footer content.",
      },
    },
    prompt: {
      props: [
        {
          name: "title",
          description: "Optional card title.",
        },
        {
          name: "description",
          description: "Optional card description.",
        },
      ],
    },
    examples: shadcnPromptExamples.Card,
    render,
  };
}

function createAlertDefinition(
  components: Required<ShadcnComponentBindings>,
): WaterComponentDefinition<ShadcnAlertProps> {
  const render: WaterRenderBinding<ShadcnAlertProps> = ({ props, children }) =>
    createElement(
      components.Alert,
      { variant: props.variant },
      props.title ? createElement(components.AlertTitle, null, props.title) : null,
      props.description
        ? createElement(components.AlertDescription, null, props.description)
        : null,
      children,
    );

  return {
    description: "shadcn Alert for verified status and warning messages.",
    propsSchema: alertSchema,
    children: "nodes",
    prompt: {
      props: [
        {
          name: "title",
          description: "Optional alert title.",
        },
        {
          name: "description",
          description: "Optional alert body.",
        },
        {
          name: "variant",
          description: "shadcn alert variant.",
          allowedValues: ["default", "destructive"],
        },
      ],
    },
    examples: shadcnPromptExamples.Alert,
    render,
  };
}

function createInputDefinition(
  components: Required<ShadcnComponentBindings>,
): WaterComponentDefinition<ShadcnInputProps> {
  const render: WaterRenderBinding<ShadcnInputProps> = ({ props }) =>
    createElement(components.Input, {
      disabled: props.disabled,
      placeholder: props.placeholder,
      readOnly: true,
      type: props.type ?? "text",
      value: props.value,
    });

  return {
    description: "shadcn Input display bound to registered Water state.",
    propsSchema: inputSchema,
    children: "none",
    prompt: {
      props: [
        {
          name: "type",
          description: "Input type.",
          allowedValues: ["text", "email", "search", "password", "number"],
        },
        {
          name: "placeholder",
          description: "Placeholder text.",
        },
        {
          name: "stateKey",
          description: "Registered Water runtime state key.",
        },
      ],
      notes: ["Input is rendered as read-only unless the host app binds state updates."],
    },
    examples: shadcnPromptExamples.Input,
    render,
  };
}

function createBadgeDefinition(
  components: Required<ShadcnComponentBindings>,
): WaterComponentDefinition<ShadcnBadgeProps> {
  const render: WaterRenderBinding<ShadcnBadgeProps> = ({ props }) =>
    createElement(components.Badge, { variant: props.variant }, props.label);

  return {
    description: "shadcn Badge for compact labels and statuses.",
    propsSchema: badgeSchema,
    children: "none",
    prompt: {
      props: [
        {
          name: "label",
          description: "Visible badge text.",
          required: true,
        },
        {
          name: "variant",
          description: "shadcn badge variant.",
          allowedValues: ["default", "secondary", "destructive", "outline"],
        },
      ],
    },
    examples: shadcnPromptExamples.Badge,
    render,
  };
}

function normalizeAlias(alias: string): string {
  const trimmed = alias.trim();
  if (trimmed === "") {
    throw new TypeError("shadcn ui alias must be a non-empty string.");
  }

  return trimmed.replace(/\/+$/, "");
}
