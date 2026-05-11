export type RegistryDiagnosticCode =
  | "duplicate_component_type"
  | "empty_component_type"
  | "invalid_component_entry"
  | "component_type_mismatch";

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

export type WaterComponentDefinition<Props = Record<string, unknown>> = {
  description: string;
  propsSchema?: unknown;
  children?: ChildrenPolicy;
  slots?: SlotPolicy;
  examples?: readonly WaterComponentExample[];
  antiExamples?: readonly WaterComponentExample[];
  profile?: ComponentProfile;
  risk?: "low" | "medium" | "high" | "destructive";
  metadata?: Record<string, unknown>;
  render?: unknown;
  __type?: Props;
};

export type WaterComponentEntry<Props = Record<string, unknown>> =
  WaterComponentDefinition<Props> & {
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
  slots?: SlotPolicy;
  profile?: ComponentProfile;
  risk?: WaterComponentEntry["risk"];
  examples?: readonly WaterComponentExample[];
};

export type RegistrySummary = {
  componentCount: number;
  components: readonly RegistryComponentSummary[];
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
  const entries = registries.flatMap((registry) => registry.entries);
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

    if (entry.slots) {
      summary.slots = entry.slots;
    }

    if (entry.profile) {
      summary.profile = entry.profile;
    }

    if (entry.risk) {
      summary.risk = entry.risk;
    }

    if (entry.examples) {
      summary.examples = entry.examples;
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

function collectComponentEntries(input: WaterRegistryInput): WaterComponentEntry[] {
  if (Array.isArray(input)) {
    return input.map((entry) => ({ ...entry }));
  }

  return Object.entries(input).map(([type, definition]) => ({
    ...definition,
    type,
  }));
}

function buildRegistry(
  entries: readonly WaterComponentEntry[],
  inheritedDiagnostics: readonly RegistryDiagnostic[] = [],
): WaterRegistry {
  const components: Record<string, WaterComponentEntry> = Object.create(null);
  const orderedEntries: WaterComponentEntry[] = [];
  const diagnostics: RegistryDiagnostic[] = [...inheritedDiagnostics];

  entries.forEach((entry, index) => {
    const path = `$.components[${index}]`;

    if (!entry || typeof entry !== "object") {
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
      type,
      children: entry.children ?? "none",
    });

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
