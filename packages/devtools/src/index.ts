import {
  isVerifiedSchemaUI,
  listWasserComponents,
  summarizeWasserRegistry,
  type PatchHistory,
  type PatchHistoryEntry,
  type SchemaUIDocument,
  type SchemaUIStreamEvent,
  type StreamState,
  type VerifiedSchemaUI,
  type WasserComponentEntry,
  type WasserRegistry,
} from "@wasser-ui/core";
import type { RuntimeEventRecord } from "@wasser-ui/runtime";

export type DevToolsPanelId =
  | "registry"
  | "schema"
  | "verified"
  | "validation"
  | "patches"
  | "streams"
  | "runtime"
  | "prompts"
  | "render";

export type DevToolsSeverity = "info" | "warning" | "error";

export type DiagnosticLike = {
  code: string;
  severity: "error" | "warning";
  path: string;
  message: string;
  nodeId?: string;
  componentType?: string;
};

export type RenderTrace = {
  nodeId: string;
  componentType: string;
  binding: "registry" | "adapter" | "fallback" | "missing";
  diagnosticCode?: string;
};

export type PromptTrace = {
  id: string;
  mode?: string;
  prompt: string;
};

export type DevToolsPanel<Row = unknown> = {
  id: DevToolsPanelId;
  title: string;
  summary: string;
  severity: DevToolsSeverity;
  rows: readonly Row[];
};

export type RegistryInspectionRow = {
  type: string;
  description: string;
  children: string;
  hasPropsSummary: boolean;
  hasSlots: boolean;
  hasExamples: boolean;
  hasRenderBinding: boolean;
  risk?: string;
};

export type SchemaInspectionRow = {
  nodeId: string;
  type: string;
  childCount: number;
  slotCount: number;
  propKeys: readonly string[];
  reachable?: boolean;
  verified?: boolean;
};

export type PatchInspectionRow = {
  index: number;
  target: string;
  opCount: number;
  beforeRoot: string;
  afterRoot: string;
  timestamp: number;
};

export type StreamInspectionRow = {
  seq: number;
  kind: string;
  status: "processed" | "buffered";
  nodeId?: string;
};

export type RuntimeInspectionRow = {
  seq: number;
  timestamp: number;
  kind: string;
  detail: string;
};

export type PromptInspectionRow = {
  id: string;
  mode?: string;
  lineCount: number;
  characterCount: number;
  includesForbiddenRules: boolean;
};

export type RenderInspectionRow = {
  componentType: string;
  hasRenderBinding: boolean;
  bindingType: string;
  nodeId?: string;
  diagnosticCode?: string;
};

export type DevToolsInspectionInput = {
  registry?: WasserRegistry;
  rawSchemaUI?: unknown;
  verifiedUI?: VerifiedSchemaUI;
  diagnostics?: readonly DiagnosticLike[];
  patchHistory?: PatchHistory | readonly PatchHistoryEntry[];
  streamState?: StreamState;
  streamEvents?: readonly SchemaUIStreamEvent[];
  runtimeEvents?: readonly RuntimeEventRecord[];
  prompts?: readonly PromptTrace[] | Readonly<Record<string, string>>;
  renderTraces?: readonly RenderTrace[];
};

export type DevToolsInspection = {
  panels: Readonly<Record<DevToolsPanelId, DevToolsPanel>>;
  debugEvents: readonly DevToolsDebugEvent[];
};

export type DevToolsDebugEvent =
  | {
      seq: number;
      timestamp: number;
      kind: "devtools.inspect";
      panel: DevToolsPanelId;
      severity: DevToolsSeverity;
      summary: string;
    }
  | {
      seq: number;
      timestamp: number;
      kind: "devtools.event";
      source: string;
      message: string;
      payload?: unknown;
    };

export type DevToolsDebugEventInput =
  | {
      kind: "devtools.inspect";
      panel: DevToolsPanelId;
      severity: DevToolsSeverity;
      summary: string;
    }
  | {
      kind: "devtools.event";
      source: string;
      message: string;
      payload?: unknown;
    };

export type DevToolsDebugEventBus = {
  emit(event: DevToolsDebugEventInput): DevToolsDebugEvent;
  subscribe(listener: (event: DevToolsDebugEvent) => void): () => void;
  getSnapshot(): readonly DevToolsDebugEvent[];
  clear(): void;
};

export function createDevToolsInspection(input: DevToolsInspectionInput): DevToolsInspection {
  const panels = {
    registry: inspectRegistry(input.registry),
    schema: inspectSchemaUI(input.rawSchemaUI),
    verified: inspectVerifiedSchemaUI(input.verifiedUI),
    validation: inspectDiagnostics(input.diagnostics ?? []),
    patches: inspectPatchHistory(input.patchHistory),
    streams: inspectStream(input.streamState, input.streamEvents),
    runtime: inspectRuntimeEvents(input.runtimeEvents ?? []),
    prompts: inspectPrompts(input.prompts),
    render: inspectRenderBindings(input.registry, input.renderTraces ?? []),
  } satisfies Record<DevToolsPanelId, DevToolsPanel>;

  const debugEvents = Object.values(panels).map((panel, index) =>
    Object.freeze({
      seq: index + 1,
      timestamp: 0,
      kind: "devtools.inspect" as const,
      panel: panel.id,
      severity: panel.severity,
      summary: panel.summary,
    }),
  );

  return Object.freeze({
    panels: freezePanels(panels),
    debugEvents: Object.freeze(debugEvents),
  });
}

export function inspectRegistry(
  registry: WasserRegistry | undefined,
): DevToolsPanel<RegistryInspectionRow> {
  if (!registry) {
    return panel("registry", "Registry Inspector", "No registry provided.", "warning", []);
  }

  const summary = summarizeWasserRegistry(registry);
  const entriesByType = new Map(listWasserComponents(registry).map((entry) => [entry.type, entry]));
  const rows = summary.components.map((component) => {
    const entry = entriesByType.get(component.type);
    return Object.freeze({
      type: component.type,
      description: component.description,
      children:
        typeof component.children === "string" ? component.children : component.children.kind,
      hasPropsSummary: Boolean(component.props?.length),
      hasSlots: Boolean(component.slots && Object.keys(component.slots).length > 0),
      hasExamples: Boolean(component.examples?.length),
      hasRenderBinding: typeof entry?.render === "function",
      ...(component.risk ? { risk: component.risk } : {}),
    });
  });

  return panel(
    "registry",
    "Registry Inspector",
    `${rows.length} registered component${rows.length === 1 ? "" : "s"}.`,
    registry.ok ? "info" : "error",
    rows,
  );
}

export function inspectSchemaUI(rawSchemaUI: unknown): DevToolsPanel<SchemaInspectionRow> {
  if (!isRecord(rawSchemaUI) || !isRecord(rawSchemaUI.nodes)) {
    return panel(
      "schema",
      "Schema UI Inspector",
      "No raw Schema UI document provided.",
      "warning",
      [],
    );
  }

  const root = typeof rawSchemaUI.root === "string" ? rawSchemaUI.root : undefined;
  const reachable = findReachableNodeIds(rawSchemaUI as unknown as SchemaUIDocument);
  const rows = Object.entries(rawSchemaUI.nodes).map(([nodeId, node]) => {
    const nodeRecord = isRecord(node) ? node : {};
    const children = Array.isArray(nodeRecord.children) ? nodeRecord.children : [];
    const slots = isRecord(nodeRecord.slots) ? nodeRecord.slots : {};
    const props = isRecord(nodeRecord.props) ? nodeRecord.props : {};
    return Object.freeze({
      nodeId,
      type: typeof nodeRecord.type === "string" ? nodeRecord.type : "(invalid)",
      childCount: children.length,
      slotCount: Object.keys(slots).length,
      propKeys: Object.freeze(Object.keys(props).sort()),
      ...(root ? { reachable: reachable.has(nodeId) } : {}),
    });
  });

  return panel(
    "schema",
    "Schema UI Inspector",
    `${rows.length} raw node${rows.length === 1 ? "" : "s"}${root ? `, root ${root}` : ""}.`,
    "info",
    rows,
  );
}

export function inspectVerifiedSchemaUI(
  ui: VerifiedSchemaUI | undefined,
): DevToolsPanel<SchemaInspectionRow> {
  if (!ui || !isVerifiedSchemaUI(ui)) {
    return panel(
      "verified",
      "VerifiedSchemaUI Inspector",
      "No verified UI provided.",
      "warning",
      [],
    );
  }

  const rows = Object.entries(ui.nodes).map(([nodeId, node]) =>
    Object.freeze({
      nodeId,
      type: node.type,
      childCount: node.children?.length ?? 0,
      slotCount: Object.keys(node.slots ?? {}).length,
      propKeys: Object.freeze(Object.keys(node.props ?? {}).sort()),
      reachable: true,
      verified: true,
    }),
  );

  return panel(
    "verified",
    "VerifiedSchemaUI Inspector",
    `${rows.length} verified node${rows.length === 1 ? "" : "s"}, root ${ui.root}.`,
    "info",
    rows,
  );
}

export function inspectDiagnostics(
  diagnostics: readonly DiagnosticLike[],
): DevToolsPanel<DiagnosticLike> {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;

  return panel(
    "validation",
    "Validation Viewer",
    `${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}.`,
    errors > 0 ? "error" : warnings > 0 ? "warning" : "info",
    diagnostics.map((diagnostic) => Object.freeze({ ...diagnostic })),
  );
}

export function inspectPatchHistory(
  history: PatchHistory | readonly PatchHistoryEntry[] | undefined,
): DevToolsPanel<PatchInspectionRow> {
  const entries: readonly PatchHistoryEntry[] =
    history && "list" in history ? history.list() : (history ?? []);
  const rows = entries.map((entry) =>
    Object.freeze({
      index: entry.index,
      target: entry.patch.target,
      opCount: entry.patch.ops.length,
      beforeRoot: entry.before.root,
      afterRoot: entry.after.root,
      timestamp: entry.timestamp,
    }),
  );

  return panel(
    "patches",
    "Patch History",
    `${rows.length} patch${rows.length === 1 ? "" : "es"}.`,
    "info",
    rows,
  );
}

export function inspectStream(
  state: StreamState | undefined,
  events: readonly SchemaUIStreamEvent[] = [],
): DevToolsPanel<StreamInspectionRow> {
  const bufferedSeq = new Set(state?.bufferedEvents.map((event) => event.seq) ?? []);
  const sourceEvents = events.length > 0 ? events : (state?.bufferedEvents ?? []);
  const rows = sourceEvents.map((event) =>
    Object.freeze({
      seq: event.seq,
      kind: event.kind,
      status: bufferedSeq.has(event.seq) ? "buffered" : "processed",
      ...getStreamNodeId(event),
    }),
  );

  const bufferedCount =
    state?.bufferedEvents.length ?? rows.filter((row) => row.status === "buffered").length;
  return panel(
    "streams",
    "Stream Viewer",
    `${rows.length} stream event${rows.length === 1 ? "" : "s"}, ${bufferedCount} buffered, done=${String(state?.done ?? false)}.`,
    bufferedCount > 0 ? "warning" : "info",
    rows,
  );
}

export function inspectRuntimeEvents(
  events: readonly RuntimeEventRecord[],
): DevToolsPanel<RuntimeInspectionRow> {
  const rows = events.map((event) =>
    Object.freeze({
      seq: event.seq,
      timestamp: event.timestamp,
      kind: event.kind,
      detail: runtimeEventDetail(event),
    }),
  );

  const blocked = rows.filter((row) => row.kind === "runtime.block").length;
  return panel(
    "runtime",
    "Runtime Viewer",
    `${rows.length} runtime event${rows.length === 1 ? "" : "s"}, ${blocked} blocked.`,
    blocked > 0 ? "warning" : "info",
    rows,
  );
}

export function inspectPrompts(
  prompts: readonly PromptTrace[] | Readonly<Record<string, string>> | undefined,
): DevToolsPanel<PromptInspectionRow> {
  const traces = normalizePromptTraces(prompts);
  const rows = traces.map((trace) =>
    Object.freeze({
      id: trace.id,
      ...(trace.mode ? { mode: trace.mode } : {}),
      lineCount: trace.prompt.split("\n").length,
      characterCount: trace.prompt.length,
      includesForbiddenRules:
        trace.prompt.includes("Do not output JSX.") &&
        trace.prompt.includes("Do not output JavaScript."),
    }),
  );

  const missingRules = rows.filter((row) => !row.includesForbiddenRules).length;
  return panel(
    "prompts",
    "Prompt Viewer",
    `${rows.length} prompt${rows.length === 1 ? "" : "s"}, ${missingRules} missing forbidden-rule markers.`,
    missingRules > 0 ? "warning" : "info",
    rows,
  );
}

export function inspectRenderBindings(
  registry: WasserRegistry | undefined,
  traces: readonly RenderTrace[] = [],
): DevToolsPanel<RenderInspectionRow> {
  const rows: RenderInspectionRow[] = [];
  const tracesByType = new Map(traces.map((trace) => [trace.componentType, trace]));

  for (const entry of registry ? listWasserComponents(registry) : []) {
    rows.push(renderBindingRow(entry, tracesByType.get(entry.type)));
  }

  for (const trace of traces) {
    if (
      !rows.some((row) => row.componentType === trace.componentType && row.nodeId === trace.nodeId)
    ) {
      rows.push(
        Object.freeze({
          componentType: trace.componentType,
          hasRenderBinding: trace.binding !== "missing",
          bindingType: trace.binding,
          nodeId: trace.nodeId,
          ...(trace.diagnosticCode ? { diagnosticCode: trace.diagnosticCode } : {}),
        }),
      );
    }
  }

  const missing = rows.filter((row) => !row.hasRenderBinding).length;
  return panel(
    "render",
    "Render Viewer",
    `${rows.length} render binding${rows.length === 1 ? "" : "s"}, ${missing} missing.`,
    missing > 0 ? "warning" : "info",
    rows,
  );
}

export function createDebugEventBus(): DevToolsDebugEventBus {
  const listeners = new Set<(event: DevToolsDebugEvent) => void>();
  const events: DevToolsDebugEvent[] = [];
  let seq = 0;

  return Object.freeze({
    emit(event: DevToolsDebugEventInput): DevToolsDebugEvent {
      const record = Object.freeze({
        ...event,
        seq: ++seq,
        timestamp: Date.now(),
      }) as DevToolsDebugEvent;
      events.push(record);
      listeners.forEach((listener) => listener(record));
      return record;
    },
    subscribe(listener: (event: DevToolsDebugEvent) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return Object.freeze([...events]);
    },
    clear() {
      events.length = 0;
    },
  });
}

function renderBindingRow(
  entry: WasserComponentEntry,
  trace: RenderTrace | undefined,
): RenderInspectionRow {
  const hasRenderBinding = typeof entry.render === "function";
  return Object.freeze({
    componentType: entry.type,
    hasRenderBinding,
    bindingType: trace?.binding ?? (hasRenderBinding ? "registry" : "missing"),
    ...(trace?.nodeId ? { nodeId: trace.nodeId } : {}),
    ...(trace?.diagnosticCode ? { diagnosticCode: trace.diagnosticCode } : {}),
  });
}

function panel<Row>(
  id: DevToolsPanelId,
  title: string,
  summary: string,
  severity: DevToolsSeverity,
  rows: readonly Row[],
): DevToolsPanel<Row> {
  return Object.freeze({
    id,
    title,
    summary,
    severity,
    rows: Object.freeze([...rows]),
  });
}

function freezePanels(
  panels: Record<DevToolsPanelId, DevToolsPanel>,
): Readonly<Record<DevToolsPanelId, DevToolsPanel>> {
  return Object.freeze(
    Object.fromEntries(Object.entries(panels).map(([id, panel]) => [id, panel])) as Record<
      DevToolsPanelId,
      DevToolsPanel
    >,
  );
}

function findReachableNodeIds(document: SchemaUIDocument): Set<string> {
  const reachable = new Set<string>();
  const visit = (nodeId: string): void => {
    if (reachable.has(nodeId) || !document.nodes[nodeId]) {
      return;
    }

    reachable.add(nodeId);
    const node = document.nodes[nodeId];
    node.children?.forEach(visit);
    for (const slotValue of Object.values(node.slots ?? {})) {
      const references = Array.isArray(slotValue) ? slotValue : [slotValue];
      references.forEach(visit);
    }
  };

  if (typeof document.root === "string") {
    visit(document.root);
  }

  return reachable;
}

function getStreamNodeId(event: SchemaUIStreamEvent): { nodeId?: string } {
  if ("id" in event) {
    return { nodeId: event.id };
  }

  if ("child" in event) {
    return { nodeId: event.child };
  }

  return {};
}

function runtimeEventDetail(event: RuntimeEventRecord): string {
  switch (event.kind) {
    case "runtime.capability.register":
      return `${event.capability}:${event.id}`;
    case "runtime.query.resolve":
      return `${event.queryId} -> ${event.dataRef}`;
    case "runtime.action.run":
      return event.actionId;
    case "runtime.mutation.run":
      return event.mutationId;
    case "runtime.state.set":
      return event.key;
    case "runtime.permission.decision":
      return `${event.target.kind}:${event.allowed ? "allowed" : "blocked"}${event.reason ? ` (${event.reason})` : ""}`;
    case "runtime.block":
      return `${event.code}:${event.id}${event.reason ? ` (${event.reason})` : ""}`;
  }
}

function normalizePromptTraces(
  prompts: readonly PromptTrace[] | Readonly<Record<string, string>> | undefined,
): readonly PromptTrace[] {
  if (!prompts) {
    return [];
  }

  if (Array.isArray(prompts)) {
    return prompts;
  }

  return Object.entries(prompts).map(([id, prompt]) => ({
    id,
    prompt,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
