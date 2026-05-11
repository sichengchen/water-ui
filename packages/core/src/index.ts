import type { z } from "zod";

export type RegistryDiagnosticCode =
  | "duplicate_component_type"
  | "empty_component_type"
  | "invalid_component_entry"
  | "component_type_mismatch"
  | "missing_component_description"
  | "invalid_children_policy"
  | "invalid_slot_policy";

export type DiagnosticSeverity = "error" | "warning";

export type RegistryDiagnostic = {
  code: RegistryDiagnosticCode;
  severity: DiagnosticSeverity;
  path: string;
  message: string;
  componentType?: string;
};

export type ChildrenPolicy =
  | "none"
  | "nodes"
  | {
      kind: "nodes";
      min?: number;
      max?: number;
    };

export type SlotPolicy = Record<
  string,
  {
    description?: string;
    required?: boolean;
    multiple?: boolean;
  }
>;

export type ComponentProfile = string | readonly string[];

export type WaterComponentExample = {
  intent: string;
  node: {
    type: string;
    props?: Record<string, unknown>;
    children?: string[];
    slots?: Record<string, string | string[]>;
  };
};

export type WaterPropPromptSummary = {
  name: string;
  description: string;
  required?: boolean;
  allowedValues?: readonly unknown[];
};

export type WaterComponentPromptHints = {
  props?: readonly WaterPropPromptSummary[];
  notes?: readonly string[];
};

export type WaterPropsSchema<Props = unknown> = z.ZodType<Props>;

export type WaterComponentDefinition<Props = unknown> = {
  description: string;
  propsSchema?: WaterPropsSchema<Props>;
  children?: ChildrenPolicy;
  slots?: SlotPolicy;
  prompt?: WaterComponentPromptHints;
  examples?: readonly WaterComponentExample[];
  antiExamples?: readonly WaterComponentExample[];
  profile?: ComponentProfile;
  risk?: "low" | "medium" | "high" | "destructive";
  metadata?: Record<string, unknown>;
  render?: unknown;
  __type?: Props;
};

export type WaterComponentEntry<Props = unknown> = WaterComponentDefinition<Props> & {
  type: string;
};

export type WaterRegistryInput =
  | Record<string, WaterComponentDefinition | WaterComponentEntry>
  | readonly WaterComponentEntry[];

export type CreateWaterRegistryOptions = {
  components: WaterRegistryInput;
};

export type WaterRegistry = {
  ok: boolean;
  components: Readonly<Record<string, WaterComponentEntry>>;
  entries: readonly WaterComponentEntry[];
  diagnostics: readonly RegistryDiagnostic[];
};

export type RegistryComponentSummary = {
  type: string;
  description: string;
  children: ChildrenPolicy;
  props?: readonly WaterPropPromptSummary[];
  slots?: SlotPolicy;
  profile?: ComponentProfile;
  risk?: WaterComponentEntry["risk"];
  notes?: readonly string[];
  examples?: readonly WaterComponentExample[];
  antiExamples?: readonly WaterComponentExample[];
};

export type RegistrySummary = {
  componentCount: number;
  components: readonly RegistryComponentSummary[];
};

type CollectedComponentEntry = {
  entry: unknown;
  typeHint?: string;
  path: string;
};

export function defineWaterComponent<Props = Record<string, unknown>>(
  definition: WaterComponentDefinition<Props>,
): WaterComponentDefinition<Props> {
  return Object.freeze({ ...definition });
}

export function createWaterRegistry(options: CreateWaterRegistryOptions): WaterRegistry {
  return buildRegistry(collectComponentEntries(options.components));
}

export function mergeWaterRegistries(...registries: readonly WaterRegistry[]): WaterRegistry {
  const entries = registries.flatMap((registry, registryIndex) =>
    registry.entries.map((entry, entryIndex) => ({
      entry,
      path: `$.registries[${registryIndex}].components[${entryIndex}]`,
    })),
  );
  const diagnostics = registries.flatMap((registry) => registry.diagnostics);

  return buildRegistry(entries, diagnostics);
}

export function getWaterComponent(
  registry: WaterRegistry,
  type: string,
): WaterComponentEntry | undefined {
  return registry.components[type];
}

export function listWaterComponents(registry: WaterRegistry): readonly WaterComponentEntry[] {
  return registry.entries;
}

export function selectWaterRegistryEntries(
  registry: WaterRegistry,
  profile?: string,
): readonly WaterComponentEntry[] {
  if (!profile) {
    return registry.entries;
  }

  return registry.entries.filter((entry) => matchesProfile(entry.profile, profile));
}

export function summarizeWaterRegistry(
  registry: WaterRegistry,
  options: { profile?: string } = {},
): RegistrySummary {
  const components = selectWaterRegistryEntries(registry, options.profile).map((entry) => {
    const summary: RegistryComponentSummary = {
      type: entry.type,
      description: entry.description,
      children: entry.children ?? "none",
    };

    if (entry.prompt?.props) {
      summary.props = entry.prompt.props;
    }

    if (entry.slots) {
      summary.slots = entry.slots;
    }

    if (entry.profile) {
      summary.profile = entry.profile;
    }

    if (entry.risk) {
      summary.risk = entry.risk;
    }

    if (entry.prompt?.notes) {
      summary.notes = entry.prompt.notes;
    }

    if (entry.examples) {
      summary.examples = entry.examples;
    }

    if (entry.antiExamples) {
      summary.antiExamples = entry.antiExamples;
    }

    return summary;
  });

  return Object.freeze({
    componentCount: components.length,
    components: Object.freeze(components),
  });
}

export function serializePromptSafeRegistryDescription(
  registry: WaterRegistry,
  options: { profile?: string; space?: number } = {},
): string {
  return JSON.stringify(summarizeWaterRegistry(registry, options), null, options.space);
}

function collectComponentEntries(input: WaterRegistryInput): CollectedComponentEntry[] {
  if (Array.isArray(input)) {
    return input.map((entry, index) => ({
      entry: isRecord(entry) ? { ...entry } : entry,
      path: `$.components[${index}]`,
    }));
  }

  return Object.entries(input).map(([type, definition]) => {
    const definitionRecord: Record<string, unknown> | undefined = isRecord(definition)
      ? definition
      : undefined;
    const entry = definitionRecord
      ? {
          ...definitionRecord,
          type: Object.hasOwn(definitionRecord, "type") ? definitionRecord["type"] : type,
        }
      : definition;

    return {
      entry,
      typeHint: type,
      path: `$.components.${type}`,
    };
  });
}

function buildRegistry(
  entries: readonly CollectedComponentEntry[],
  inheritedDiagnostics: readonly RegistryDiagnostic[] = [],
): WaterRegistry {
  const components: Record<string, WaterComponentEntry> = Object.create(null);
  const orderedEntries: WaterComponentEntry[] = [];
  const diagnostics: RegistryDiagnostic[] = [...inheritedDiagnostics];

  entries.forEach(({ entry, typeHint, path }) => {
    if (!isRecord(entry)) {
      diagnostics.push({
        code: "invalid_component_entry",
        severity: "error",
        path,
        message: "Registry component entries must be objects.",
      });
      return;
    }

    if (typeof entry.type !== "string" || entry.type.trim() === "") {
      diagnostics.push({
        code: "empty_component_type",
        severity: "error",
        path: `${path}.type`,
        message: "Registry component type must be a non-empty string.",
      });
      return;
    }

    const type = entry.type.trim();

    if (typeHint && typeHint !== type) {
      diagnostics.push({
        code: "component_type_mismatch",
        severity: "error",
        path: `${path}.type`,
        componentType: type,
        message: `Component entry key '${typeHint}' does not match declared type '${type}'.`,
      });
      return;
    }

    if (typeof entry.description !== "string" || entry.description.trim() === "") {
      diagnostics.push({
        code: "missing_component_description",
        severity: "error",
        path: `${path}.description`,
        componentType: type,
        message: `Component type '${type}' must include a non-empty description.`,
      });
      return;
    }

    if (!isValidChildrenPolicy(entry.children)) {
      diagnostics.push({
        code: "invalid_children_policy",
        severity: "error",
        path: `${path}.children`,
        componentType: type,
        message: `Component type '${type}' has an invalid children policy.`,
      });
      return;
    }

    if (!isValidSlotPolicy(entry.slots)) {
      diagnostics.push({
        code: "invalid_slot_policy",
        severity: "error",
        path: `${path}.slots`,
        componentType: type,
        message: `Component type '${type}' has an invalid slot policy.`,
      });
      return;
    }

    if (Object.hasOwn(components, type)) {
      diagnostics.push({
        code: "duplicate_component_type",
        severity: "error",
        path: `${path}.type`,
        componentType: type,
        message: `Component type '${type}' is registered more than once.`,
      });
      return;
    }

    const normalizedEntry = Object.freeze({
      ...entry,
      description: entry.description.trim(),
      type,
      children: (entry.children ?? "none") as ChildrenPolicy,
    }) as WaterComponentEntry;

    components[type] = normalizedEntry;
    orderedEntries.push(normalizedEntry);
  });

  const frozenComponents = Object.freeze(components);
  const frozenEntries = Object.freeze(orderedEntries);
  const frozenDiagnostics = Object.freeze(diagnostics);

  return Object.freeze({
    ok: !frozenDiagnostics.some((diagnostic) => diagnostic.severity === "error"),
    components: frozenComponents,
    entries: frozenEntries,
    diagnostics: frozenDiagnostics,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidChildrenPolicy(value: unknown): value is ChildrenPolicy | undefined {
  if (value === undefined || value === "none" || value === "nodes") {
    return true;
  }

  if (!isRecord(value) || value.kind !== "nodes") {
    return false;
  }

  return isOptionalNonNegativeInteger(value.min) && isOptionalNonNegativeInteger(value.max);
}

function isOptionalNonNegativeInteger(value: unknown): boolean {
  return value === undefined || (Number.isInteger(value) && Number(value) >= 0);
}

function isValidSlotPolicy(value: unknown): value is SlotPolicy | undefined {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([slotName, slot]) => {
    if (slotName.trim() === "" || !isRecord(slot)) {
      return false;
    }

    return (
      (slot.description === undefined || typeof slot.description === "string") &&
      (slot.required === undefined || typeof slot.required === "boolean") &&
      (slot.multiple === undefined || typeof slot.multiple === "boolean")
    );
  });
}

function matchesProfile(
  entryProfile: ComponentProfile | undefined,
  requestedProfile: string,
): boolean {
  if (!entryProfile) {
    return true;
  }

  if (typeof entryProfile === "string") {
    return entryProfile === requestedProfile;
  }

  return entryProfile.includes(requestedProfile);
}

export * from "./protocol.js";
export * from "./verification.js";
export * from "./patch.js";
