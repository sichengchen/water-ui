import { createElement } from "react";
import { z } from "zod";
import type { WasserComponentDefinition, WasserComponentExample } from "@wasser-ui/core";
import type { WasserRenderBinding } from "@wasser-ui/react";
import type { ComponentType, ReactNode } from "react";

export const shadcnRegistryItemTypes = Object.freeze([
  "registry:lib",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:hook",
  "registry:theme",
  "registry:page",
  "registry:file",
  "registry:style",
  "registry:base",
  "registry:font",
  "registry:item",
] as const);

export type ShadcnRegistryItemType = (typeof shadcnRegistryItemTypes)[number];

export type ShadcnRegistryFile = {
  path: string;
  type: Exclude<ShadcnRegistryItemType, "registry:font">;
  content?: string;
  target?: string;
};

export type ShadcnRegistryFont = {
  family: string;
  provider: "google";
  import: string;
  variable: string;
  weight?: readonly string[];
  subsets?: readonly string[];
  selector?: string;
  dependency?: string;
};

export type ShadcnRegistryCssValue =
  | string
  | {
      readonly [selectorOrProperty: string]: ShadcnRegistryCssValue;
    };

export type ShadcnRegistryItem = {
  $schema?: "https://ui.shadcn.com/schema/registry-item.json";
  name: string;
  type: ShadcnRegistryItemType;
  title?: string;
  description?: string;
  author?: string;
  dependencies?: readonly string[];
  devDependencies?: readonly string[];
  registryDependencies?: readonly string[];
  files?: readonly ShadcnRegistryFile[];
  tailwind?: {
    config?: {
      content?: readonly string[];
      theme?: Record<string, unknown>;
      plugins?: readonly string[];
    };
  };
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: Record<string, ShadcnRegistryCssValue>;
  envVars?: Record<string, string>;
  meta?: Record<string, unknown>;
  docs?: string;
  categories?: readonly string[];
  extends?: string;
  style?: string;
  iconLibrary?: string;
  baseColor?: string;
  theme?: string;
  font?: ShadcnRegistryFont;
};

export type ShadcnRegistryIndex = {
  $schema?: "https://ui.shadcn.com/schema/registry.json";
  name: string;
  homepage: string;
  items: readonly ShadcnRegistryItem[];
};

export type ShadcnCatalogEntry = {
  type: string;
  module: string;
  title: string;
  category: string;
  description: string;
  registryType?: ShadcnRegistryItemType;
};

const shadcnCatalogEntries = [
  {
    type: "Field",
    module: "field",
    title: "Field",
    category: "form",
    description: "shadcn Field for form inputs with labels, descriptions, and errors.",
  },
  {
    type: "Button",
    module: "button",
    title: "Button",
    category: "form",
    description: "shadcn Button for actions and form submission.",
  },
  {
    type: "ButtonGroup",
    module: "button-group",
    title: "Button Group",
    category: "form",
    description: "shadcn Button Group for visually grouping related buttons.",
  },
  {
    type: "Input",
    module: "input",
    title: "Input",
    category: "form",
    description: "shadcn Input for single-line text entry.",
  },
  {
    type: "InputGroup",
    module: "input-group",
    title: "Input Group",
    category: "form",
    description: "shadcn Input Group for inputs with addons and controls.",
  },
  {
    type: "InputOTP",
    module: "input-otp",
    title: "Input OTP",
    category: "form",
    description: "shadcn Input OTP for one-time password entry.",
  },
  {
    type: "Textarea",
    module: "textarea",
    title: "Textarea",
    category: "form",
    description: "shadcn Textarea for multi-line text entry.",
  },
  {
    type: "Checkbox",
    module: "checkbox",
    title: "Checkbox",
    category: "form",
    description: "shadcn Checkbox for binary choices.",
  },
  {
    type: "RadioGroup",
    module: "radio-group",
    title: "Radio Group",
    category: "form",
    description: "shadcn Radio Group for mutually exclusive choices.",
  },
  {
    type: "Select",
    module: "select",
    title: "Select",
    category: "form",
    description: "shadcn Select for dropdown option selection.",
  },
  {
    type: "NativeSelect",
    module: "native-select",
    title: "Native Select",
    category: "form",
    description: "shadcn Native Select for styled native option selection.",
  },
  {
    type: "Switch",
    module: "switch",
    title: "Switch",
    category: "form",
    description: "shadcn Switch for toggling boolean settings.",
  },
  {
    type: "Slider",
    module: "slider",
    title: "Slider",
    category: "form",
    description: "shadcn Slider for numeric range input.",
  },
  {
    type: "Calendar",
    module: "calendar",
    title: "Calendar",
    category: "form",
    description: "shadcn Calendar for date selection.",
  },
  {
    type: "DatePicker",
    module: "date-picker",
    title: "Date Picker",
    category: "form",
    description: "shadcn Date Picker patterns for choosing dates.",
  },
  {
    type: "Combobox",
    module: "combobox",
    title: "Combobox",
    category: "form",
    description: "shadcn Combobox patterns for searchable selection.",
  },
  {
    type: "Label",
    module: "label",
    title: "Label",
    category: "form",
    description: "shadcn Label for accessible form control labels.",
  },
  {
    type: "Accordion",
    module: "accordion",
    title: "Accordion",
    category: "layout",
    description: "shadcn Accordion for collapsible content sections.",
  },
  {
    type: "Breadcrumb",
    module: "breadcrumb",
    title: "Breadcrumb",
    category: "layout",
    description: "shadcn Breadcrumb for hierarchical navigation.",
  },
  {
    type: "NavigationMenu",
    module: "navigation-menu",
    title: "Navigation Menu",
    category: "layout",
    description: "shadcn Navigation Menu for accessible site navigation.",
  },
  {
    type: "Sidebar",
    module: "sidebar",
    title: "Sidebar",
    category: "layout",
    description: "shadcn Sidebar for app navigation layouts.",
  },
  {
    type: "Tabs",
    module: "tabs",
    title: "Tabs",
    category: "layout",
    description: "shadcn Tabs for switching between related panels.",
  },
  {
    type: "Separator",
    module: "separator",
    title: "Separator",
    category: "layout",
    description: "shadcn Separator for visual content separation.",
  },
  {
    type: "ScrollArea",
    module: "scroll-area",
    title: "Scroll Area",
    category: "layout",
    description: "shadcn Scroll Area for custom scrollable regions.",
  },
  {
    type: "Resizable",
    module: "resizable",
    title: "Resizable",
    category: "layout",
    description: "shadcn Resizable for split panel layouts.",
  },
  {
    type: "Dialog",
    module: "dialog",
    title: "Dialog",
    category: "overlay",
    description: "shadcn Dialog for modal interactions.",
  },
  {
    type: "AlertDialog",
    module: "alert-dialog",
    title: "Alert Dialog",
    category: "overlay",
    description: "shadcn Alert Dialog for confirmation prompts.",
  },
  {
    type: "Sheet",
    module: "sheet",
    title: "Sheet",
    category: "overlay",
    description: "shadcn Sheet for side-panel overlays.",
  },
  {
    type: "Drawer",
    module: "drawer",
    title: "Drawer",
    category: "overlay",
    description: "shadcn Drawer for mobile-friendly bottom sheets.",
  },
  {
    type: "Popover",
    module: "popover",
    title: "Popover",
    category: "overlay",
    description: "shadcn Popover for floating contextual content.",
  },
  {
    type: "Tooltip",
    module: "tooltip",
    title: "Tooltip",
    category: "overlay",
    description: "shadcn Tooltip for brief contextual help.",
  },
  {
    type: "HoverCard",
    module: "hover-card",
    title: "Hover Card",
    category: "overlay",
    description: "shadcn Hover Card for preview content on hover.",
  },
  {
    type: "ContextMenu",
    module: "context-menu",
    title: "Context Menu",
    category: "overlay",
    description: "shadcn Context Menu for right-click actions.",
  },
  {
    type: "DropdownMenu",
    module: "dropdown-menu",
    title: "Dropdown Menu",
    category: "overlay",
    description: "shadcn Dropdown Menu for action lists.",
  },
  {
    type: "Menubar",
    module: "menubar",
    title: "Menubar",
    category: "overlay",
    description: "shadcn Menubar for horizontal command menus.",
  },
  {
    type: "Command",
    module: "command",
    title: "Command",
    category: "overlay",
    description: "shadcn Command for command palettes and searchable command lists.",
  },
  {
    type: "Alert",
    module: "alert",
    title: "Alert",
    category: "feedback",
    description: "shadcn Alert for inline status and warning messages.",
  },
  {
    type: "Toast",
    module: "toast",
    title: "Toast",
    category: "feedback",
    description: "shadcn Toast integration for transient notifications.",
  },
  {
    type: "Sonner",
    module: "sonner",
    title: "Sonner",
    category: "feedback",
    description: "shadcn Sonner integration for toast notifications.",
  },
  {
    type: "Progress",
    module: "progress",
    title: "Progress",
    category: "feedback",
    description: "shadcn Progress for completion state.",
  },
  {
    type: "Spinner",
    module: "spinner",
    title: "Spinner",
    category: "feedback",
    description: "shadcn Spinner for loading state.",
  },
  {
    type: "Skeleton",
    module: "skeleton",
    title: "Skeleton",
    category: "feedback",
    description: "shadcn Skeleton for loading placeholders.",
  },
  {
    type: "Badge",
    module: "badge",
    title: "Badge",
    category: "feedback",
    description: "shadcn Badge for compact labels and status.",
  },
  {
    type: "Empty",
    module: "empty",
    title: "Empty",
    category: "feedback",
    description: "shadcn Empty for empty states.",
  },
  {
    type: "Avatar",
    module: "avatar",
    title: "Avatar",
    category: "display",
    description: "shadcn Avatar for profile imagery and fallbacks.",
  },
  {
    type: "Card",
    module: "card",
    title: "Card",
    category: "display",
    description: "shadcn Card for grouped content.",
  },
  {
    type: "Table",
    module: "table",
    title: "Table",
    category: "display",
    description: "shadcn Table for tabular data display.",
  },
  {
    type: "DataTable",
    module: "data-table",
    title: "Data Table",
    category: "display",
    description: "shadcn Data Table patterns for sortable and filterable tables.",
  },
  {
    type: "Chart",
    module: "chart",
    title: "Chart",
    category: "display",
    description: "shadcn Chart wrappers for Recharts visualizations.",
  },
  {
    type: "Carousel",
    module: "carousel",
    title: "Carousel",
    category: "display",
    description: "shadcn Carousel for swipeable or paged content.",
  },
  {
    type: "AspectRatio",
    module: "aspect-ratio",
    title: "Aspect Ratio",
    category: "display",
    description: "shadcn Aspect Ratio for fixed-ratio media containers.",
  },
  {
    type: "Typography",
    module: "typography",
    title: "Typography",
    category: "display",
    description: "shadcn Typography styles for prose content.",
  },
  {
    type: "Item",
    module: "item",
    title: "Item",
    category: "display",
    description: "shadcn Item for structured list and menu rows.",
  },
  {
    type: "Kbd",
    module: "kbd",
    title: "Kbd",
    category: "display",
    description: "shadcn Kbd for keyboard shortcut display.",
  },
  {
    type: "Collapsible",
    module: "collapsible",
    title: "Collapsible",
    category: "misc",
    description: "shadcn Collapsible for expandable content.",
  },
  {
    type: "Toggle",
    module: "toggle",
    title: "Toggle",
    category: "misc",
    description: "shadcn Toggle for pressed or unpressed button state.",
  },
  {
    type: "ToggleGroup",
    module: "toggle-group",
    title: "Toggle Group",
    category: "misc",
    description: "shadcn Toggle Group for grouped toggle options.",
  },
  {
    type: "Pagination",
    module: "pagination",
    title: "Pagination",
    category: "misc",
    description: "shadcn Pagination for navigating paged data.",
  },
  {
    type: "Direction",
    module: "direction",
    title: "Direction",
    category: "misc",
    description: "shadcn Direction provider for right-to-left support.",
  },
] as const satisfies readonly ShadcnCatalogEntry[];

export const shadcnComponentCatalog = Object.freeze(shadcnCatalogEntries);

export type ShadcnComponentType = (typeof shadcnCatalogEntries)[number]["type"];
export type ShadcnComponentModule = (typeof shadcnCatalogEntries)[number]["module"];

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

export type ShadcnGenericRenderProps = Record<string, unknown> & {
  children?: ReactNode;
};

type AnyShadcnComponent = ComponentType<never>;

export type ShadcnKnownComponentBindings = {
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

export type ShadcnComponentBindings = ShadcnKnownComponentBindings &
  Readonly<Record<string, AnyShadcnComponent | undefined>>;

type ResolvedShadcnComponentBindings = Required<ShadcnKnownComponentBindings> &
  Readonly<Record<string, AnyShadcnComponent | undefined>>;

export type CreateShadcnComponentsOptions = {
  components?: ShadcnComponentBindings;
};

export type ShadcnRegistryComponents = Readonly<Record<string, WasserComponentDefinition>>;

export type ShadcnImportAliases = {
  ui: string;
  components?: string;
  lib?: string;
  hooks?: string;
};

export type ShadcnAdapterConfig = {
  aliases: Readonly<Required<Pick<ShadcnImportAliases, "ui">> & Omit<ShadcnImportAliases, "ui">>;
  imports: Readonly<Record<ShadcnComponentModule, string>>;
};

const genericShadcnPropsSchema = z.object({}).passthrough();

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

export const shadcnPromptExamples: Readonly<Record<string, readonly WasserComponentExample[]>> =
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

export const shadcnFallbackComponents: Required<ShadcnKnownComponentBindings> = Object.freeze({
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
  } as ResolvedShadcnComponentBindings;

  const definitions = Object.fromEntries(
    shadcnComponentCatalog.map((entry) => [
      entry.type,
      createGenericShadcnDefinition(entry, components),
    ]),
  ) as Record<ShadcnComponentType, WasserComponentDefinition>;

  return Object.freeze({
    ...definitions,
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
  const aliases = normalizeAliases(options.aliases);
  const imports = Object.fromEntries(
    shadcnComponentCatalog.map((entry) => [entry.module, `${aliases.ui}/${entry.module}`]),
  ) as Record<ShadcnComponentModule, string>;

  return Object.freeze({
    aliases: Object.freeze(aliases),
    imports: Object.freeze(imports),
  });
}

export function getShadcnImportPath(
  config: ShadcnAdapterConfig,
  module: ShadcnComponentModule,
): string {
  return config.imports[module];
}

export function resolveShadcnRegistryTarget(config: ShadcnAdapterConfig, target: string): string {
  const trimmed = target.trim();
  if (trimmed === "") {
    throw new TypeError("shadcn registry target must be a non-empty string.");
  }

  const placeholders = [
    ["@components/", config.aliases.components],
    ["@ui/", config.aliases.ui],
    ["@lib/", config.aliases.lib],
    ["@hooks/", config.aliases.hooks],
  ] as const;

  for (const [placeholder, alias] of placeholders) {
    if (!trimmed.startsWith(placeholder)) {
      continue;
    }

    if (!alias) {
      throw new TypeError(`shadcn registry target '${placeholder}' requires an alias.`);
    }

    return `${alias}/${trimmed.slice(placeholder.length)}`;
  }

  if (trimmed.startsWith("@")) {
    return trimmed.slice(1);
  }

  return trimmed;
}

export function defineShadcnRegistryItem(item: ShadcnRegistryItem): Readonly<ShadcnRegistryItem> {
  return Object.freeze({
    ...item,
    dependencies: freezeArray(item.dependencies),
    devDependencies: freezeArray(item.devDependencies),
    registryDependencies: freezeArray(item.registryDependencies),
    files: freezeArray(item.files),
    categories: freezeArray(item.categories),
  });
}

export function createShadcnRegistryIndex(options: {
  name: string;
  homepage: string;
  items: readonly ShadcnRegistryItem[];
}): Readonly<ShadcnRegistryIndex> {
  return Object.freeze({
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: options.name,
    homepage: options.homepage,
    items: Object.freeze(options.items.map((item) => defineShadcnRegistryItem(item))),
  });
}

export function getShadcnCatalogEntry(componentType: string): ShadcnCatalogEntry | undefined {
  return shadcnComponentCatalog.find((entry) => entry.type === componentType);
}

function createGenericShadcnDefinition(
  entry: ShadcnCatalogEntry,
  components: ResolvedShadcnComponentBindings,
): WasserComponentDefinition<ShadcnGenericRenderProps> {
  const render: WasserRenderBinding<ShadcnGenericRenderProps> = ({ props, children }) => {
    const Component =
      (components[entry.type] as ComponentType<ShadcnGenericRenderProps> | undefined) ??
      GenericShadcnFallback;

    return createElement(Component, {
      ...props,
      children,
      "data-shadcn-component": entry.module,
    });
  };

  return {
    description: entry.description,
    propsSchema: genericShadcnPropsSchema,
    children: "nodes",
    profile: ["shadcn", `shadcn:${entry.category}`],
    prompt: {
      notes: [
        `Backed by the shadcn ${entry.title} registry item (${entry.module}).`,
        "Pass props that match the project-local shadcn source component.",
      ],
    },
    metadata: {
      shadcn: {
        module: entry.module,
        title: entry.title,
        category: entry.category,
        registryDependencies: [entry.module],
        registryType: entry.registryType ?? "registry:ui",
      },
    },
    render,
  };
}

function GenericShadcnFallback({ children, ...props }: ShadcnGenericRenderProps): ReactNode {
  const component =
    typeof props["data-shadcn-component"] === "string" ? props["data-shadcn-component"] : "unknown";

  return createElement("section", { "data-shadcn-fallback": component }, children);
}

function createButtonDefinition(
  components: ResolvedShadcnComponentBindings,
): WasserComponentDefinition<ShadcnButtonProps> {
  const render: WasserRenderBinding<ShadcnButtonProps> = ({ props, bindings }) => {
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
      notes: ["Do not invent action IDs. Use only actions registered in the Wasser runtime."],
    },
    examples: shadcnPromptExamples.Button,
    render,
  };
}

function createCardDefinition(
  components: ResolvedShadcnComponentBindings,
): WasserComponentDefinition<ShadcnCardProps> {
  const render: WasserRenderBinding<ShadcnCardProps> = ({ props, children, slots }) => {
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
  components: ResolvedShadcnComponentBindings,
): WasserComponentDefinition<ShadcnAlertProps> {
  const render: WasserRenderBinding<ShadcnAlertProps> = ({ props, children }) =>
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
  components: ResolvedShadcnComponentBindings,
): WasserComponentDefinition<ShadcnInputProps> {
  const render: WasserRenderBinding<ShadcnInputProps> = ({ props }) =>
    createElement(components.Input, {
      disabled: props.disabled,
      placeholder: props.placeholder,
      readOnly: true,
      type: props.type ?? "text",
      value: props.value,
    });

  return {
    description: "shadcn Input display bound to registered Wasser state.",
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
          description: "Registered Wasser runtime state key.",
        },
      ],
      notes: ["Input is rendered as read-only unless the host app binds state updates."],
    },
    examples: shadcnPromptExamples.Input,
    render,
  };
}

function createBadgeDefinition(
  components: ResolvedShadcnComponentBindings,
): WasserComponentDefinition<ShadcnBadgeProps> {
  const render: WasserRenderBinding<ShadcnBadgeProps> = ({ props }) =>
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

function normalizeAliases(aliases: ShadcnImportAliases): ShadcnAdapterConfig["aliases"] {
  return {
    ui: normalizeAlias(aliases.ui, "ui"),
    ...(aliases.components ? { components: normalizeAlias(aliases.components, "components") } : {}),
    ...(aliases.lib ? { lib: normalizeAlias(aliases.lib, "lib") } : {}),
    ...(aliases.hooks ? { hooks: normalizeAlias(aliases.hooks, "hooks") } : {}),
  };
}

function normalizeAlias(alias: string, name = "ui"): string {
  const trimmed = alias.trim();
  if (trimmed === "") {
    throw new TypeError(`shadcn ${name} alias must be a non-empty string.`);
  }

  return trimmed.replace(/\/+$/, "");
}

function freezeArray<T>(items: readonly T[] | undefined): readonly T[] | undefined {
  return items ? Object.freeze([...items]) : undefined;
}
