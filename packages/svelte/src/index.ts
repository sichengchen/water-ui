import { assertVerifiedSchemaUI, getWaterComponent, isVerifiedSchemaUI } from "@water-ui/core";
import { createRawSnippet } from "svelte";
import type {
  SchemaUINode,
  StreamState,
  VerifiedSchemaUI,
  WaterComponentEntry,
  WaterRegistry,
} from "@water-ui/core";
import type { Snippet } from "svelte";

export type WaterRenderDiagnosticCode =
  | "invalid_renderer_input"
  | "missing_registry"
  | "missing_node"
  | "missing_component"
  | "missing_render_binding"
  | "invalid_render_binding"
  | "permission_denied"
  | "runtime_data_missing"
  | "runtime_action_missing"
  | "render_binding_error";

export type WaterRenderDiagnostic = {
  code: WaterRenderDiagnosticCode;
  severity: "error" | "warning";
  path: string;
  message: string;
  nodeId?: string;
  componentType?: string;
};

export type WaterRuntimeEvent =
  | {
      kind: "renderer.node.render";
      nodeId: string;
      componentType: string;
    }
  | {
      kind: "renderer.node.fallback";
      nodeId?: string;
      componentType?: string;
      code: WaterRenderDiagnosticCode;
    }
  | {
      kind: "runtime.action.invoke";
      actionId: string;
      nodeId: string;
      componentType: string;
    };

export type WaterPermissionContext = {
  permission: string;
  nodeId: string;
  node: SchemaUINode;
  component: WaterComponentEntry;
};

export type WaterActionContext = {
  actionId: string;
  nodeId: string;
  node: SchemaUINode;
  component: WaterComponentEntry;
};

export type WaterDataContext = {
  dataRef: string;
  nodeId: string;
  node: SchemaUINode;
  component: WaterComponentEntry;
};

export type WaterPermissionGuard =
  | ((context: WaterPermissionContext) => boolean)
  | {
      canRender?: (context: WaterPermissionContext) => boolean;
      has?: (permission: string, context: WaterPermissionContext) => boolean;
    };

export type WaterTelemetrySink =
  | ((event: WaterRuntimeEvent) => void)
  | {
      emit: (event: WaterRuntimeEvent) => void;
    };

export type WaterRuntime = {
  registry?: WaterRegistry;
  resolveData?: (dataRef: string, context: WaterDataContext) => unknown;
  runAction?: (actionId: string, payload: unknown, context: WaterActionContext) => unknown;
  canRender?: (context: WaterPermissionContext) => boolean;
  permissions?: WaterPermissionGuard;
  telemetry?: WaterTelemetrySink;
};

export type WaterBoundAction = (payload?: unknown) => unknown;

export type WaterRenderBindings = {
  data: Readonly<Record<string, unknown>>;
  actions: Readonly<Record<string, WaterBoundAction>>;
};

export type WaterSveltePrimitive = string | number | boolean | null | undefined;

export type WaterSvelteChild =
  | WaterSveltePrimitive
  | WaterSvelteElement
  | WaterSvelteRawHtml
  | readonly WaterSvelteChild[];

export type WaterSvelteElementProps = Readonly<Record<string, unknown>>;

export type WaterSvelteElement = Readonly<{
  kind: "water.svelte.element";
  tag: string;
  props?: WaterSvelteElementProps;
  children?: WaterSvelteChild;
}>;

export type WaterSvelteRawHtml = Readonly<{
  kind: "water.svelte.raw-html";
  html: string;
}>;

export type WaterRenderContext<Props = Record<string, unknown>> = {
  props: Props;
  nodeId: string;
  node: SchemaUINode;
  component: WaterComponentEntry<Props>;
  runtime: WaterRuntime;
  bindings: WaterRenderBindings;
  children: readonly WaterSvelteChild[];
  slots: Readonly<Record<string, WaterSvelteChild>>;
  renderNode: (nodeId: string) => WaterSvelteChild;
  renderSlot: (nodeId: string, slotName: string) => WaterSvelteChild;
};

export type WaterRenderBinding<Props = Record<string, unknown>> = (
  context: WaterRenderContext<Props>,
) => WaterSvelteChild;

export type WaterRuntimeProviderProps = {
  runtime: WaterRuntime;
  registry?: WaterRegistry;
};

export type WaterRendererProps = {
  ui: VerifiedSchemaUI;
  runtime?: WaterRuntime;
  registry?: WaterRegistry;
  fallback?: WaterSvelteChild;
  onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
};

export type WaterStreamRendererProps = Omit<WaterRendererProps, "ui"> & {
  ui?: VerifiedSchemaUI;
  stream?: StreamState;
};

export type NodeRendererProps = {
  ui?: VerifiedSchemaUI;
  runtime?: WaterRuntime;
  registry?: WaterRegistry;
  nodeId: string;
  fallback?: WaterSvelteChild;
  onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
};

export type SlotRendererProps = {
  ui?: VerifiedSchemaUI;
  runtime?: WaterRuntime;
  registry?: WaterRegistry;
  nodeId: string;
  name: string;
  fallback?: WaterSvelteChild;
  onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
};

export type WaterRuntimeContextValue = {
  runtime: WaterRuntime;
  registry?: WaterRegistry;
};

type RenderSession = {
  ui: VerifiedSchemaUI;
  registry?: WaterRegistry;
  runtime: WaterRuntime;
  diagnostics: WaterRenderDiagnostic[];
  fallback?: WaterSvelteChild;
};

const emptyRuntime = Object.freeze({});

export function createWaterRuntime({
  runtime,
  registry,
}: WaterRuntimeProviderProps): WaterRuntimeContextValue {
  return Object.freeze({
    runtime,
    registry: registry ?? runtime.registry,
  });
}

export function waterElement(
  tag: string,
  props?: WaterSvelteElementProps,
  children?: WaterSvelteChild,
): WaterSvelteElement {
  return Object.freeze({
    kind: "water.svelte.element",
    tag,
    ...(props ? { props } : {}),
    ...(children !== undefined ? { children } : {}),
  });
}

export function waterRawHtml(html: string): WaterSvelteRawHtml {
  return Object.freeze({
    kind: "water.svelte.raw-html",
    html,
  });
}

export function createWaterRenderer(
  props: WaterRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createRawSnippet(() => ({
    render: () => renderWaterToHtml(props, context),
  }));
}

export function createWaterStreamRenderer(
  props: WaterStreamRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createRawSnippet(() => ({
    render: () => renderWaterStreamToHtml(props, context),
  }));
}

export function createNodeRenderer(
  props: NodeRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createRawSnippet(() => ({
    render: () => renderWaterNodeToHtml(props, context),
  }));
}

export function createSlotRenderer(
  props: SlotRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createRawSnippet(() => ({
    render: () => renderWaterSlotToHtml(props, context),
  }));
}

export function renderWaterToHtml(
  { ui, registry, runtime, fallback, onDiagnostics }: WaterRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: runtime ?? emptyRuntime,
    registry,
  }),
): string {
  const diagnostics: WaterRenderDiagnostic[] = [];

  if (!isVerifiedSchemaUI(ui)) {
    diagnostics.push(
      diagnostic("invalid_renderer_input", "$", "WaterRenderer accepts only VerifiedSchemaUI."),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return renderChildToHtml(renderFallback(fallback, diagnostics[0]));
  }

  const session: RenderSession = {
    ui,
    registry: registry ?? context.registry ?? context.runtime.registry,
    runtime: runtime ?? context.runtime,
    diagnostics,
    fallback,
  };
  const output = renderNode(ui.root, session);

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return renderChildToHtml(output);
}

export function renderWaterStreamToHtml(
  props: WaterStreamRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): string {
  const verifiedUi = props.ui ?? props.stream?.ui;
  if (!verifiedUi) {
    return renderChildToHtml(props.fallback ?? null);
  }

  return renderWaterToHtml(
    {
      ...props,
      ui: verifiedUi,
    },
    context,
  );
}

export function renderWaterNodeToHtml(
  { ui: uiProp, registry, runtime, nodeId, fallback, onDiagnostics }: NodeRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: runtime ?? emptyRuntime,
    registry,
  }),
): string {
  const effectiveRuntime = runtime ?? context.runtime;
  const ui = uiProp ?? getVerifiedUIFromRuntime(effectiveRuntime);
  const diagnostics: WaterRenderDiagnostic[] = [];

  if (!ui) {
    diagnostics.push(
      diagnostic(
        "invalid_renderer_input",
        "$",
        "NodeRenderer requires runtime.ui to contain VerifiedSchemaUI.",
      ),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return renderChildToHtml(renderFallback(fallback, diagnostics[0]));
  }

  const output = renderNode(nodeId, {
    ui,
    registry: registry ?? context.registry ?? effectiveRuntime.registry,
    runtime: effectiveRuntime,
    diagnostics,
    fallback,
  });

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return renderChildToHtml(output);
}

export function renderWaterSlotToHtml(
  { ui: uiProp, registry, runtime, nodeId, name, fallback, onDiagnostics }: SlotRendererProps,
  context: WaterRuntimeContextValue = createWaterRuntime({
    runtime: runtime ?? emptyRuntime,
    registry,
  }),
): string {
  const effectiveRuntime = runtime ?? context.runtime;
  const ui = uiProp ?? getVerifiedUIFromRuntime(effectiveRuntime);
  const diagnostics: WaterRenderDiagnostic[] = [];

  if (!ui) {
    diagnostics.push(
      diagnostic(
        "invalid_renderer_input",
        "$",
        "SlotRenderer requires runtime.ui to contain VerifiedSchemaUI.",
      ),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return renderChildToHtml(renderFallback(fallback, diagnostics[0]));
  }

  const output = renderSlot(nodeId, name, {
    ui,
    registry: registry ?? context.registry ?? effectiveRuntime.registry,
    runtime: effectiveRuntime,
    diagnostics,
    fallback,
  });

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return renderChildToHtml(output);
}

function renderNode(nodeId: string, session: RenderSession): WaterSvelteChild {
  const node = session.ui.nodes[nodeId];
  if (!node) {
    const failure = pushDiagnostic(session, {
      code: "missing_node",
      path: `$.nodes.${toPathKey(nodeId)}`,
      message: `Node '${nodeId}' is missing from VerifiedSchemaUI.`,
      nodeId,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }

  if (!session.registry) {
    const failure = pushDiagnostic(session, {
      code: "missing_registry",
      path: "$.registry",
      message: "WaterRenderer requires a component registry.",
      nodeId,
      componentType: node.type,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      componentType: node.type,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }

  const component = getWaterComponent(session.registry, node.type);
  if (!component) {
    const failure = pushDiagnostic(session, {
      code: "missing_component",
      path: `$.nodes.${toPathKey(nodeId)}.type`,
      message: `Component type '${node.type}' is not registered.`,
      nodeId,
      componentType: node.type,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      componentType: node.type,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }

  if (!canRenderNode(session.runtime, nodeId, node, component)) {
    const failure = pushDiagnostic(session, {
      code: "permission_denied",
      path: `$.nodes.${toPathKey(nodeId)}.props.permission`,
      message: `Permission denied for component type '${component.type}'.`,
      nodeId,
      componentType: component.type,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      componentType: component.type,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }

  const render = component.render;
  if (render === undefined) {
    const failure = pushDiagnostic(session, {
      code: "missing_render_binding",
      path: `$.registry.components.${toPathKey(component.type)}.render`,
      message: `Component type '${component.type}' does not define a render binding.`,
      nodeId,
      componentType: component.type,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      componentType: component.type,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }

  if (typeof render !== "function") {
    const failure = pushDiagnostic(session, {
      code: "invalid_render_binding",
      path: `$.registry.components.${toPathKey(component.type)}.render`,
      message: `Component type '${component.type}' render binding must be a function.`,
      nodeId,
      componentType: component.type,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      componentType: component.type,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }

  try {
    emitTelemetry(session.runtime, {
      kind: "renderer.node.render",
      nodeId,
      componentType: component.type,
    });

    const childElements = (node.children ?? []).map((childId) => renderNode(childId, session));
    const slotElements = renderSlots(nodeId, node, session);
    const bindings = bindRuntimeValues(nodeId, node, component, session);

    return (render as WaterRenderBinding)({
      props: node.props ?? {},
      nodeId,
      node,
      component: component as WaterComponentEntry<Record<string, unknown>>,
      runtime: session.runtime,
      bindings,
      children: childElements,
      slots: slotElements,
      renderNode: (childId) => renderNode(childId, session),
      renderSlot: (sourceNodeId, slotName) => renderSlot(sourceNodeId, slotName, session),
    });
  } catch (error) {
    const failure = pushDiagnostic(session, {
      code: "render_binding_error",
      path: `$.registry.components.${toPathKey(component.type)}.render`,
      message: `Component type '${component.type}' render binding failed: ${getErrorMessage(error)}`,
      nodeId,
      componentType: component.type,
    });
    emitTelemetry(session.runtime, {
      kind: "renderer.node.fallback",
      nodeId,
      componentType: component.type,
      code: failure.code,
    });
    return renderFallback(session.fallback, failure);
  }
}

function renderSlot(nodeId: string, slotName: string, session: RenderSession): WaterSvelteChild {
  const node = session.ui.nodes[nodeId];
  if (!node) {
    const failure = pushDiagnostic(session, {
      code: "missing_node",
      path: `$.nodes.${toPathKey(nodeId)}`,
      message: `Node '${nodeId}' is missing from VerifiedSchemaUI.`,
      nodeId,
    });
    return renderFallback(session.fallback, failure);
  }

  const slotValue = node.slots?.[slotName];
  if (!slotValue) {
    return null;
  }

  const references = Array.isArray(slotValue) ? slotValue : [slotValue];
  if (references.length === 1) {
    return renderNode(references[0], session);
  }

  return references.map((slotNodeId) => renderNode(slotNodeId, session));
}

function renderSlots(
  nodeId: string,
  node: SchemaUINode,
  session: RenderSession,
): Readonly<Record<string, WaterSvelteChild>> {
  const slots: Record<string, WaterSvelteChild> = Object.create(null);

  for (const slotName of Object.keys(node.slots ?? {})) {
    slots[slotName] = renderSlot(nodeId, slotName, session);
  }

  return Object.freeze(slots);
}

function bindRuntimeValues(
  nodeId: string,
  node: SchemaUINode,
  component: WaterComponentEntry,
  session: RenderSession,
): WaterRenderBindings {
  const data: Record<string, unknown> = Object.create(null);
  const actions: Record<string, WaterBoundAction> = Object.create(null);

  const propsPath = `$.nodes.${toPathKey(nodeId)}.props`;

  for (const [path, dataRef] of collectRuntimeRefs(node.props, "dataRef", propsPath)) {
    const context: WaterDataContext = { dataRef, nodeId, node, component };
    const resolved = session.runtime.resolveData?.(dataRef, context);

    if (resolved === undefined) {
      pushDiagnostic(session, {
        code: "runtime_data_missing",
        severity: "warning",
        path,
        message: `Runtime data '${dataRef}' resolved to undefined.`,
        nodeId,
        componentType: component.type,
      });
    }

    data[dataRef] = resolved;
  }

  for (const [path, actionId] of collectRuntimeRefs(node.props, "actionId", propsPath)) {
    if (!session.runtime.runAction) {
      pushDiagnostic(session, {
        code: "runtime_action_missing",
        severity: "warning",
        path,
        message: `Runtime action '${actionId}' cannot be bound without runtime.runAction.`,
        nodeId,
        componentType: component.type,
      });
      continue;
    }

    actions[actionId] = (payload?: unknown) => {
      emitTelemetry(session.runtime, {
        kind: "runtime.action.invoke",
        actionId,
        nodeId,
        componentType: component.type,
      });
      return session.runtime.runAction?.(actionId, payload, {
        actionId,
        nodeId,
        node,
        component,
      });
    };
  }

  return Object.freeze({
    data: Object.freeze(data),
    actions: Object.freeze(actions),
  });
}

function collectRuntimeRefs(
  value: unknown,
  refKey: "actionId" | "dataRef",
  path = "$.nodes.props",
): [path: string, value: string][] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRuntimeRefs(item, refKey, `${path}[${index}]`));
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = `${path}.${toPathKey(key)}`;

    if (key === refKey && typeof child === "string" && child.trim() !== "") {
      return [[childPath, child.trim()]];
    }

    return collectRuntimeRefs(child, refKey, childPath);
  });
}

function canRenderNode(
  runtime: WaterRuntime,
  nodeId: string,
  node: SchemaUINode,
  component: WaterComponentEntry,
): boolean {
  const permission = getNodePermission(node);
  if (!permission) {
    return true;
  }

  const context: WaterPermissionContext = {
    permission,
    nodeId,
    node,
    component,
  };

  if (runtime.canRender?.(context) === false) {
    return false;
  }

  if (typeof runtime.permissions === "function") {
    return runtime.permissions(context);
  }

  const permissionResult =
    runtime.permissions?.canRender?.(context) ?? runtime.permissions?.has?.(permission, context);

  return permissionResult !== false;
}

function getNodePermission(node: SchemaUINode): string | undefined {
  const props = node.props ?? {};
  const permission = props.permission ?? props.permissionId ?? props.requiredPermission;
  return typeof permission === "string" && permission.trim() !== "" ? permission.trim() : undefined;
}

function renderFallback(
  fallback: WaterSvelteChild,
  diagnostic: WaterRenderDiagnostic,
): WaterSvelteChild {
  if (fallback !== undefined) {
    return fallback;
  }

  return waterElement("span", {
    "data-water-fallback": diagnostic.code,
    "data-water-node-id": diagnostic.nodeId,
    "data-water-component-type": diagnostic.componentType,
  });
}

function renderChildToHtml(child: WaterSvelteChild): string {
  if (child === null || child === undefined || typeof child === "boolean") {
    return "";
  }

  if (typeof child === "string" || typeof child === "number") {
    return escapeText(String(child));
  }

  if (Array.isArray(child)) {
    return child.map((item) => renderChildToHtml(item)).join("");
  }

  if (isRawHtml(child)) {
    return child.html;
  }

  if (isWaterElement(child)) {
    return renderElementToHtml(child);
  }

  return "";
}

function renderElementToHtml(element: WaterSvelteElement): string {
  if (!isSafeTagName(element.tag)) {
    return "";
  }

  const attributes = renderAttributes(element.props ?? {});
  return `<${element.tag}${attributes}>${renderChildToHtml(element.children)}</${element.tag}>`;
}

function renderAttributes(props: WaterSvelteElementProps): string {
  const attributes: string[] = [];

  for (const [name, value] of Object.entries(props)) {
    if (!isSafeAttributeName(name) || value === false || value === null || value === undefined) {
      continue;
    }

    if (typeof value === "function" || typeof value === "symbol") {
      continue;
    }

    if (value === true) {
      attributes.push(name);
      continue;
    }

    const serializedValue = serializeAttributeValue(name, value);
    if (serializedValue === undefined) {
      continue;
    }

    attributes.push(`${name}="${escapeAttribute(serializedValue)}"`);
  }

  return attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
}

function serializeAttributeValue(name: string, value: unknown): string | undefined {
  if (name === "style" && isRecord(value)) {
    return Object.entries(value)
      .filter(([, child]) => child !== null && child !== undefined && child !== false)
      .map(([property, child]) => `${toKebabCase(property)}: ${String(child)}`)
      .join("; ");
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" ");
  }

  if (isRecord(value)) {
    return undefined;
  }

  return String(value);
}

function pushDiagnostic(
  session: RenderSession,
  input: {
    code: WaterRenderDiagnosticCode;
    path: string;
    message: string;
    severity?: "error" | "warning";
    nodeId?: string;
    componentType?: string;
  },
): WaterRenderDiagnostic {
  const output = diagnostic(input.code, input.path, input.message, {
    severity: input.severity,
    nodeId: input.nodeId,
    componentType: input.componentType,
  });
  session.diagnostics.push(output);
  return output;
}

function diagnostic(
  code: WaterRenderDiagnosticCode,
  path: string,
  message: string,
  options: {
    severity?: "error" | "warning";
    nodeId?: string;
    componentType?: string;
  } = {},
): WaterRenderDiagnostic {
  return Object.freeze({
    code,
    severity: options.severity ?? "error",
    path,
    message,
    ...(options.nodeId ? { nodeId: options.nodeId } : {}),
    ...(options.componentType ? { componentType: options.componentType } : {}),
  });
}

function emitTelemetry(runtime: WaterRuntime, event: WaterRuntimeEvent): void {
  if (!runtime.telemetry) {
    return;
  }

  if (typeof runtime.telemetry === "function") {
    runtime.telemetry(event);
    return;
  }

  runtime.telemetry.emit(event);
}

function getVerifiedUIFromRuntime(runtime: WaterRuntime): VerifiedSchemaUI | undefined {
  const candidate = (runtime as WaterRuntime & { ui?: unknown }).ui;
  if (!candidate) {
    return undefined;
  }

  assertVerifiedSchemaUI(candidate);
  return candidate;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function isWaterElement(value: unknown): value is WaterSvelteElement {
  return isRecord(value) && value.kind === "water.svelte.element" && typeof value.tag === "string";
}

function isRawHtml(value: unknown): value is WaterSvelteRawHtml {
  return (
    isRecord(value) && value.kind === "water.svelte.raw-html" && typeof value.html === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeTagName(tag: string): boolean {
  return /^[A-Za-z][A-Za-z0-9:-]*$/.test(tag);
}

function isSafeAttributeName(name: string): boolean {
  return /^[A-Za-z_:][A-Za-z0-9_:.~-]*$/.test(name);
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

function toPathKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}
