import { summarizeWasserRegistry } from "@wasser-ui/core";
import type {
  RegistryComponentSummary,
  RuntimeCapabilityDescription,
  RuntimeCapabilitySet,
  VerificationDiagnostic,
  WasserRegistry,
} from "@wasser-ui/core";

export type PromptMode = "document" | "patch" | "stream" | "repair";

export type PromptRuntimeDescription = RuntimeCapabilityDescription & {
  mutations?: RuntimeCapabilitySet;
};

export type CompilePromptOptions = {
  registry: WasserRegistry;
  runtime?: PromptRuntimeDescription;
  profile?: string;
  currentDocument?: unknown;
  userIntent?: string;
};

export type CompileSystemPromptOptions = CompilePromptOptions & {
  mode?: PromptMode;
};

export type CompileRepairPromptOptions = CompilePromptOptions & {
  invalidOutput: unknown;
  diagnostics: readonly VerificationDiagnostic[] | readonly PromptDiagnostic[];
  mode?: Exclude<PromptMode, "repair">;
};

export type PromptDiagnostic = {
  code: string;
  severity: "error" | "warning";
  path: string;
  message: string;
  nodeId?: string;
  componentType?: string;
};

export type CompiledPromptSections = {
  header: string;
  rules: readonly string[];
  components: readonly string[];
  runtime: readonly string[];
  output: readonly string[];
  context: readonly string[];
};

const forbiddenRules = Object.freeze([
  "Only output Wasser Schema UI.",
  "Do not output JSX.",
  "Do not output JavaScript.",
  "Do not invent component types.",
  "Do not invent action IDs.",
  "Do not invent query refs.",
  "Do not invent state keys.",
  "Use only registered components.",
  "Use only props allowed by each component summary.",
  "Use stable node IDs.",
  "Do not define actions, queries, mutations, permission rules, imports, network calls, raw HTML, event handlers, arbitrary className, or arbitrary inline style.",
]);

export function compileSystemPrompt(options: CompileSystemPromptOptions): string {
  return renderPrompt({
    ...buildBaseSections(options.mode ?? "document", options),
    output: outputInstructions(options.mode ?? "document"),
  });
}

export function compileDocumentPrompt(options: CompilePromptOptions): string {
  return renderPrompt({
    ...buildBaseSections("document", options),
    output: outputInstructions("document"),
  });
}

export function compilePatchPrompt(options: CompilePromptOptions): string {
  return renderPrompt({
    ...buildBaseSections("patch", options),
    output: outputInstructions("patch"),
  });
}

export function compileStreamPrompt(options: CompilePromptOptions): string {
  return renderPrompt({
    ...buildBaseSections("stream", options),
    output: outputInstructions("stream"),
  });
}

export function compileRepairPrompt(options: CompileRepairPromptOptions): string {
  const targetMode = options.mode ?? "document";
  const sections = buildBaseSections("repair", options);

  return renderPrompt({
    ...sections,
    output: [
      `Repair the invalid ${targetMode} output.`,
      "Return only corrected Wasser protocol output.",
      "Do not explain the repair.",
      ...outputInstructions(targetMode),
    ],
    context: [
      ...sections.context,
      "Diagnostics:",
      ...options.diagnostics.map(formatDiagnostic),
      "Invalid output:",
      stableStringify(options.invalidOutput),
    ],
  });
}

export function compilePromptSections(
  mode: PromptMode,
  options: CompilePromptOptions,
): CompiledPromptSections {
  return Object.freeze({
    ...buildBaseSections(mode, options),
    output: outputInstructions(mode),
  });
}

function buildBaseSections(
  mode: PromptMode,
  options: CompilePromptOptions,
): CompiledPromptSections {
  const summary = summarizeWasserRegistry(options.registry, {
    profile: options.profile,
  });

  return Object.freeze({
    header: `Wasser UI Prompt\nMode: ${mode}${options.profile ? `\nProfile: ${options.profile}` : ""}`,
    rules: forbiddenRules,
    components: summary.components.flatMap(formatComponent),
    runtime: formatRuntime(options.runtime),
    output: outputInstructions(mode),
    context: formatContext(options),
  });
}

function outputInstructions(mode: PromptMode): readonly string[] {
  switch (mode) {
    case "document":
      return Object.freeze([
        'Return exactly one JSON object with kind "wasser.ui.document".',
        'Use version "wasser.ui.v1".',
        "Include root and nodes.",
      ]);
    case "patch":
      return Object.freeze([
        'Return exactly one JSON object with kind "wasser.ui.patch".',
        'Use version "wasser.ui.v1".',
        "Use semantic operations instead of regenerating the full document.",
      ]);
    case "stream":
      return Object.freeze([
        "Return newline-delimited JSON events only.",
        "Every event must include a non-negative integer seq.",
        'Finish with {"seq":N,"kind":"done"}.',
      ]);
    case "repair":
      return Object.freeze([
        "Return only corrected Wasser protocol output.",
        "Fix every diagnostic using registered components and runtime capabilities.",
      ]);
  }
}

function formatComponent(component: RegistryComponentSummary): string[] {
  const lines = [
    `- ${component.type}: ${component.description}`,
    `  Children: ${formatChildren(component.children)}`,
  ];

  if (component.risk) {
    lines.push(`  Risk: ${component.risk}`);
  }

  if (component.slots && Object.keys(component.slots).length > 0) {
    lines.push("  Slots:");
    for (const [slotName, slot] of Object.entries(component.slots)) {
      lines.push(
        `    - ${slotName}${slot.required ? " (required)" : ""}${slot.multiple ? " (multiple)" : ""}${slot.description ? `: ${slot.description}` : ""}`,
      );
    }
  }

  if (component.props && component.props.length > 0) {
    lines.push("  Props:");
    for (const prop of component.props) {
      lines.push(
        `    - ${prop.name}${prop.required ? " (required)" : ""}: ${prop.description}${prop.allowedValues ? ` Allowed: ${stableStringify(prop.allowedValues)}` : ""}`,
      );
    }
  }

  if (component.notes && component.notes.length > 0) {
    lines.push("  Notes:");
    lines.push(...component.notes.map((note) => `    - ${note}`));
  }

  if (component.examples && component.examples.length > 0) {
    lines.push("  Examples:");
    for (const example of component.examples) {
      lines.push(`    - Intent: ${example.intent}`);
      lines.push(`      Node: ${stableStringify(example.node)}`);
    }
  }

  return lines;
}

function formatChildren(children: RegistryComponentSummary["children"]): string {
  if (typeof children === "string") {
    return children;
  }

  const range = [
    children.min !== undefined ? `min ${children.min}` : undefined,
    children.max !== undefined ? `max ${children.max}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  return range ? `${children.kind} (${range})` : children.kind;
}

function formatRuntime(runtime: PromptRuntimeDescription | undefined): string[] {
  return [
    `- actions: ${formatCapabilitySet(runtime?.actions)}`,
    `- dataRefs: ${formatCapabilitySet(runtime?.dataRefs)}`,
    `- stateKeys: ${formatCapabilitySet(runtime?.stateKeys ?? runtime?.state)}`,
    `- mutations: ${formatCapabilitySet(runtime?.mutations)}`,
  ];
}

function formatCapabilitySet(capabilities: RuntimeCapabilitySet | undefined): string {
  const values = normalizeCapabilitySet(capabilities);
  return values.length > 0 ? values.join(", ") : "(none)";
}

function normalizeCapabilitySet(capabilities: RuntimeCapabilitySet | undefined): string[] {
  if (!capabilities) {
    return [];
  }

  if (Array.isArray(capabilities)) {
    return capabilities.map(String).sort();
  }

  if (capabilities instanceof Set) {
    return [...capabilities].map(String).sort();
  }

  return Object.keys(capabilities).sort();
}

function formatContext(options: CompilePromptOptions): string[] {
  const lines: string[] = [];

  if (options.userIntent) {
    lines.push("User intent:", options.userIntent);
  }

  if (options.currentDocument !== undefined) {
    lines.push("Current UI document:", stableStringify(options.currentDocument));
  }

  return lines;
}

function formatDiagnostic(diagnostic: PromptDiagnostic | VerificationDiagnostic): string {
  const parts = [
    `- ${diagnostic.code}`,
    `severity=${diagnostic.severity}`,
    `path=${diagnostic.path}`,
    diagnostic.nodeId ? `nodeId=${diagnostic.nodeId}` : undefined,
    diagnostic.componentType ? `componentType=${diagnostic.componentType}` : undefined,
    `message=${diagnostic.message}`,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderPrompt(sections: CompiledPromptSections): string {
  return [
    sections.header,
    "",
    "Rules:",
    ...sections.rules.map((rule) => `- ${rule}`),
    "",
    "Available components:",
    ...(sections.components.length > 0 ? sections.components : ["- (none)"]),
    "",
    "Runtime capabilities:",
    ...sections.runtime,
    "",
    "Output requirements:",
    ...sections.output.map((line) => `- ${line}`),
    ...(sections.context.length > 0 ? ["", "Context:", ...sections.context] : []),
  ].join("\n");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value), null, 2);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortJson(child)]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
