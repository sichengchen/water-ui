import { assertVerifiedSchemaUI, getWasserComponent, isVerifiedSchemaUI } from "@wasser-ui/core";
import { createContext, createElement, Fragment, useContext } from "react";
import type {
  SchemaUINode,
  StreamState,
  VerifiedSchemaUI,
  WasserComponentEntry,
  WasserRegistry,
} from "@wasser-ui/core";
import type { ReactNode } from "react";

export type WasserRenderDiagnosticCode =
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

export type WasserRenderDiagnostic = {
  code: WasserRenderDiagnosticCode;
  severity: "error" | "warning";
  path: string;
  message: string;
  nodeId?: string;
  componentType?: string;
};

export type WasserRuntimeEvent =
  | {
      kind: "renderer.node.render";
      nodeId: string;
      componentType: string;
    }
  | {
      kind: "renderer.node.fallback";
      nodeId?: string;
      componentType?: string;
      code: WasserRenderDiagnosticCode;
    }
  | {
      kind: "runtime.action.invoke";
      actionId: string;
      nodeId: string;
      componentType: string;
    };

export type WasserPermissionContext = {
  permission: string;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry;
};

export type WasserActionContext = {
  actionId: string;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry;
};

export type WasserDataContext = {
  dataRef: string;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry;
};

export type WasserPermissionGuard =
  | ((context: WasserPermissionContext) => boolean)
  | {
      canRender?: (context: WasserPermissionContext) => boolean;
      has?: (permission: string, context: WasserPermissionContext) => boolean;
    };

export type WasserTelemetrySink =
  | ((event: WasserRuntimeEvent) => void)
  | {
      emit: (event: WasserRuntimeEvent) => void;
    };

export type WasserRuntime = {
  registry?: WasserRegistry;
  resolveData?: (dataRef: string, context: WasserDataContext) => unknown;
  runAction?: (actionId: string, payload: unknown, context: WasserActionContext) => unknown;
  canRender?: (context: WasserPermissionContext) => boolean;
  permissions?: WasserPermissionGuard;
  telemetry?: WasserTelemetrySink;
};

export type WasserBoundAction = (payload?: unknown) => unknown;

export type WasserRenderBindings = {
  data: Readonly<Record<string, unknown>>;
  actions: Readonly<Record<string, WasserBoundAction>>;
};

export type WasserRenderContext<Props = Record<string, unknown>> = {
  props: Props;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry<Props>;
  runtime: WasserRuntime;
  bindings: WasserRenderBindings;
  children: ReactNode;
  slots: Readonly<Record<string, ReactNode>>;
  renderNode: (nodeId: string) => ReactNode;
  renderSlot: (nodeId: string, slotName: string) => ReactNode;
};

export type WasserRenderBinding<Props = Record<string, unknown>> = (
  context: WasserRenderContext<Props>,
) => ReactNode;

export type WasserRuntimeProviderProps = {
  runtime: WasserRuntime;
  registry?: WasserRegistry;
  children?: ReactNode;
};

export type WasserRendererProps = {
  ui: VerifiedSchemaUI;
  registry?: WasserRegistry;
  fallback?: ReactNode;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type WasserStreamRendererProps = Omit<WasserRendererProps, "ui"> & {
  ui?: VerifiedSchemaUI;
  stream?: StreamState;
};

export type NodeRendererProps = {
  ui?: VerifiedSchemaUI;
  registry?: WasserRegistry;
  nodeId: string;
  fallback?: ReactNode;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type SlotRendererProps = {
  ui?: VerifiedSchemaUI;
  registry?: WasserRegistry;
  nodeId: string;
  name: string;
  fallback?: ReactNode;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

type WasserRuntimeContextValue = {
  runtime: WasserRuntime;
  registry?: WasserRegistry;
};

type RenderSession = {
  ui: VerifiedSchemaUI;
  registry?: WasserRegistry;
  runtime: WasserRuntime;
  diagnostics: WasserRenderDiagnostic[];
  fallback?: ReactNode;
};

const WasserRuntimeContext = createContext<WasserRuntimeContextValue>({
  runtime: Object.freeze({}),
});

export function WasserRuntimeProvider({
  runtime,
  registry,
  children,
}: WasserRuntimeProviderProps): ReactNode {
  return createElement(WasserRuntimeContext.Provider, {
    value: {
      runtime,
      registry: registry ?? runtime.registry,
    },
    children,
  });
}

export function WasserRenderer({
  ui,
  registry,
  fallback,
  onDiagnostics,
}: WasserRendererProps): ReactNode {
  const context = useContext(WasserRuntimeContext);
  const diagnostics: WasserRenderDiagnostic[] = [];

  if (!isVerifiedSchemaUI(ui)) {
    diagnostics.push(
      diagnostic("invalid_renderer_input", "$", "WasserRenderer accepts only VerifiedSchemaUI."),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return renderFallback(fallback, diagnostics[0]);
  }

  const session: RenderSession = {
    ui,
    registry: registry ?? context.registry ?? context.runtime.registry,
    runtime: context.runtime,
    diagnostics,
    fallback,
  };
  const element = renderNode(ui.root, session);

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return element;
}

export function WasserStreamRenderer({
  ui,
  stream,
  fallback,
  onDiagnostics,
  registry,
}: WasserStreamRendererProps): ReactNode {
  const verifiedUi = ui ?? stream?.ui;
  if (!verifiedUi) {
    return fallback ?? null;
  }

  return createElement(WasserRenderer, {
    ui: verifiedUi,
    registry,
    fallback,
    onDiagnostics,
  });
}

export function NodeRenderer({
  ui: uiProp,
  registry,
  nodeId,
  fallback,
  onDiagnostics,
}: NodeRendererProps): ReactNode {
  const context = useContext(WasserRuntimeContext);
  const ui = uiProp ?? getVerifiedUIFromRuntime(context.runtime);
  const diagnostics: WasserRenderDiagnostic[] = [];

  if (!ui) {
    diagnostics.push(
      diagnostic(
        "invalid_renderer_input",
        "$",
        "NodeRenderer requires runtime.ui to contain VerifiedSchemaUI.",
      ),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return renderFallback(fallback, diagnostics[0]);
  }

  const element = renderNode(nodeId, {
    ui,
    registry: registry ?? context.registry ?? context.runtime.registry,
    runtime: context.runtime,
    diagnostics,
    fallback,
  });

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return element;
}

export function SlotRenderer({
  ui: uiProp,
  registry,
  nodeId,
  name,
  fallback,
  onDiagnostics,
}: SlotRendererProps): ReactNode {
  const context = useContext(WasserRuntimeContext);
  const ui = uiProp ?? getVerifiedUIFromRuntime(context.runtime);
  const diagnostics: WasserRenderDiagnostic[] = [];

  if (!ui) {
    diagnostics.push(
      diagnostic(
        "invalid_renderer_input",
        "$",
        "SlotRenderer requires runtime.ui to contain VerifiedSchemaUI.",
      ),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return renderFallback(fallback, diagnostics[0]);
  }

  const element = renderSlot(nodeId, name, {
    ui,
    registry: registry ?? context.registry ?? context.runtime.registry,
    runtime: context.runtime,
    diagnostics,
    fallback,
  });

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return element;
}

function renderNode(nodeId: string, session: RenderSession): ReactNode {
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
      message: "WasserRenderer requires a component registry.",
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

  const component = getWasserComponent(session.registry, node.type);
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

    const childElements = (node.children ?? []).map((childId) =>
      createElement(Fragment, { key: childId }, renderNode(childId, session)),
    );
    const slotElements = renderSlots(nodeId, node, session);
    const bindings = bindRuntimeValues(nodeId, node, component, session);

    return (render as WasserRenderBinding)({
      props: node.props ?? {},
      nodeId,
      node,
      component: component as WasserComponentEntry<Record<string, unknown>>,
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

function renderSlot(nodeId: string, slotName: string, session: RenderSession): ReactNode {
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
  return references.map((slotNodeId) =>
    createElement(Fragment, { key: slotNodeId }, renderNode(slotNodeId, session)),
  );
}

function renderSlots(
  nodeId: string,
  node: SchemaUINode,
  session: RenderSession,
): Readonly<Record<string, ReactNode>> {
  const slots: Record<string, ReactNode> = Object.create(null);

  for (const slotName of Object.keys(node.slots ?? {})) {
    slots[slotName] = renderSlot(nodeId, slotName, session);
  }

  return Object.freeze(slots);
}

function bindRuntimeValues(
  nodeId: string,
  node: SchemaUINode,
  component: WasserComponentEntry,
  session: RenderSession,
): WasserRenderBindings {
  const data: Record<string, unknown> = Object.create(null);
  const actions: Record<string, WasserBoundAction> = Object.create(null);

  const propsPath = `$.nodes.${toPathKey(nodeId)}.props`;

  for (const [path, dataRef] of collectRuntimeRefs(node.props, "dataRef", propsPath)) {
    const context: WasserDataContext = { dataRef, nodeId, node, component };
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
  runtime: WasserRuntime,
  nodeId: string,
  node: SchemaUINode,
  component: WasserComponentEntry,
): boolean {
  const permission = getNodePermission(node);
  if (!permission) {
    return true;
  }

  const context: WasserPermissionContext = {
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

function renderFallback(fallback: ReactNode, diagnostic: WasserRenderDiagnostic): ReactNode {
  if (fallback !== undefined) {
    return fallback;
  }

  return createElement("span", {
    "data-wasser-fallback": diagnostic.code,
    "data-wasser-node-id": diagnostic.nodeId,
    "data-wasser-component-type": diagnostic.componentType,
  });
}

function pushDiagnostic(
  session: RenderSession,
  input: {
    code: WasserRenderDiagnosticCode;
    path: string;
    message: string;
    severity?: "error" | "warning";
    nodeId?: string;
    componentType?: string;
  },
): WasserRenderDiagnostic {
  const output = diagnostic(input.code, input.path, input.message, {
    severity: input.severity,
    nodeId: input.nodeId,
    componentType: input.componentType,
  });
  session.diagnostics.push(output);
  return output;
}

function diagnostic(
  code: WasserRenderDiagnosticCode,
  path: string,
  message: string,
  options: {
    severity?: "error" | "warning";
    nodeId?: string;
    componentType?: string;
  } = {},
): WasserRenderDiagnostic {
  return Object.freeze({
    code,
    severity: options.severity ?? "error",
    path,
    message,
    ...(options.nodeId ? { nodeId: options.nodeId } : {}),
    ...(options.componentType ? { componentType: options.componentType } : {}),
  });
}

function emitTelemetry(runtime: WasserRuntime, event: WasserRuntimeEvent): void {
  if (!runtime.telemetry) {
    return;
  }

  if (typeof runtime.telemetry === "function") {
    runtime.telemetry(event);
    return;
  }

  runtime.telemetry.emit(event);
}

function getVerifiedUIFromRuntime(runtime: WasserRuntime): VerifiedSchemaUI | undefined {
  const candidate = (runtime as WasserRuntime & { ui?: unknown }).ui;
  if (!candidate) {
    return undefined;
  }

  assertVerifiedSchemaUI(candidate);
  return candidate;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPathKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}
