import { assertVerifiedSchemaUI, getWasserComponent, isVerifiedSchemaUI } from "@wasser-ui/core";
import { createRawSnippet, mount, unmount } from "svelte";
import type {
  SchemaUINode,
  StreamState,
  VerifiedSchemaUI,
  WasserComponentEntry,
  WasserRegistry,
} from "@wasser-ui/core";
import type { Component, Snippet } from "svelte";

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

export type WasserSvelteComponentRenderer = (
  component: Component<Record<string, unknown>>,
  props: WasserSvelteComponentProps,
) => string;

export type WasserRuntime = {
  registry?: WasserRegistry;
  resolveData?: (dataRef: string, context: WasserDataContext) => unknown;
  runAction?: (actionId: string, payload: unknown, context: WasserActionContext) => unknown;
  canRender?: (context: WasserPermissionContext) => boolean;
  permissions?: WasserPermissionGuard;
  telemetry?: WasserTelemetrySink;
  renderComponent?: WasserSvelteComponentRenderer;
};

export type WasserBoundAction = (payload?: unknown) => unknown;

export type WasserRenderBindings = {
  data: Readonly<Record<string, unknown>>;
  actions: Readonly<Record<string, WasserBoundAction>>;
};

export type WasserSveltePrimitive = string | number | boolean | null | undefined;

export type WasserSvelteChild =
  | WasserSveltePrimitive
  | WasserSvelteElement
  | WasserSvelteComponent
  | WasserSvelteRawHtml
  | readonly WasserSvelteChild[];

export type WasserSvelteElementProps = Readonly<Record<string, unknown>>;

export type WasserSvelteElement = Readonly<{
  kind: "wasser.svelte.element";
  tag: string;
  props?: WasserSvelteElementProps;
  children?: WasserSvelteChild;
}>;

export type WasserSvelteRawHtml = Readonly<{
  kind: "wasser.svelte.raw-html";
  html: string;
}>;

export type WasserSvelteComponentProps = Readonly<Record<string, unknown>>;

export type WasserSvelteComponent = Readonly<{
  kind: "wasser.svelte.component";
  component: Component<Record<string, unknown>>;
  props?: WasserSvelteComponentProps;
}>;

export type WasserRenderContext<Props = Record<string, unknown>> = {
  props: Props;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry<Props>;
  runtime: WasserRuntime;
  bindings: WasserRenderBindings;
  children: readonly WasserSvelteChild[];
  slots: Readonly<Record<string, WasserSvelteChild>>;
  renderNode: (nodeId: string) => WasserSvelteChild;
  renderSlot: (nodeId: string, slotName: string) => WasserSvelteChild;
};

export type WasserRenderBinding<Props = Record<string, unknown>> = (
  context: WasserRenderContext<Props>,
) => WasserSvelteChild;

export type WasserRuntimeProviderProps = {
  runtime: WasserRuntime;
  registry?: WasserRegistry;
};

export type WasserRendererProps = {
  ui: VerifiedSchemaUI;
  runtime?: WasserRuntime;
  registry?: WasserRegistry;
  fallback?: WasserSvelteChild;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type WasserStreamRendererProps = Omit<WasserRendererProps, "ui"> & {
  ui?: VerifiedSchemaUI;
  stream?: StreamState;
};

export type NodeRendererProps = {
  ui?: VerifiedSchemaUI;
  runtime?: WasserRuntime;
  registry?: WasserRegistry;
  nodeId: string;
  fallback?: WasserSvelteChild;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type SlotRendererProps = {
  ui?: VerifiedSchemaUI;
  runtime?: WasserRuntime;
  registry?: WasserRegistry;
  nodeId: string;
  name: string;
  fallback?: WasserSvelteChild;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type WasserRuntimeContextValue = {
  runtime: WasserRuntime;
  registry?: WasserRegistry;
};

type RenderSession = {
  ui: VerifiedSchemaUI;
  registry?: WasserRegistry;
  runtime: WasserRuntime;
  diagnostics: WasserRenderDiagnostic[];
  fallback?: WasserSvelteChild;
};

type PendingSvelteMount = {
  id: string;
  component: Component<Record<string, unknown>>;
  props: WasserSvelteComponentProps;
};

type RenderHtmlResult = {
  html: string;
  mounts: PendingSvelteMount[];
};

type RenderHtmlOptions = {
  runtime: WasserRuntime;
  mounts: PendingSvelteMount[];
};

const emptyRuntime = Object.freeze({});

export function createWasserRuntime({
  runtime,
  registry,
}: WasserRuntimeProviderProps): WasserRuntimeContextValue {
  return Object.freeze({
    runtime,
    registry: registry ?? runtime.registry,
  });
}

export function wasserElement(
  tag: string,
  props?: WasserSvelteElementProps,
  children?: WasserSvelteChild,
): WasserSvelteElement {
  return Object.freeze({
    kind: "wasser.svelte.element",
    tag,
    ...(props ? { props } : {}),
    ...(children !== undefined ? { children } : {}),
  });
}

export function wasserRawHtml(html: string): WasserSvelteRawHtml {
  return Object.freeze({
    kind: "wasser.svelte.raw-html",
    html,
  });
}

export function wasserComponent<Props extends Record<string, unknown>>(
  component: Component<Props>,
  props?: Readonly<Props>,
): WasserSvelteComponent {
  return Object.freeze({
    kind: "wasser.svelte.component",
    component: component as Component<Record<string, unknown>>,
    ...(props ? { props } : {}),
  });
}

export function createWasserRenderer(
  props: WasserRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createWasserSnippet(() => renderWasserToResult(props, context));
}

export function createWasserStreamRenderer(
  props: WasserStreamRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createWasserSnippet(() => renderWasserStreamToResult(props, context));
}

export function createNodeRenderer(
  props: NodeRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createWasserSnippet(() => renderWasserNodeToResult(props, context));
}

export function createSlotRenderer(
  props: SlotRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): Snippet {
  return createWasserSnippet(() => renderWasserSlotToResult(props, context));
}

export function renderWasserToHtml(
  props: WasserRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): string {
  return renderWasserToResult(props, context).html;
}

export function renderWasserStreamToHtml(
  props: WasserStreamRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): string {
  return renderWasserStreamToResult(props, context).html;
}

export function renderWasserNodeToHtml(
  props: NodeRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): string {
  return renderWasserNodeToResult(props, context).html;
}

export function renderWasserSlotToHtml(
  props: SlotRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): string {
  return renderWasserSlotToResult(props, context).html;
}

function createWasserSnippet(render: () => RenderHtmlResult): Snippet {
  return createRawSnippet(() => {
    let result: RenderHtmlResult | undefined;
    const getResult = () => {
      result ??= render();
      return result;
    };

    return {
      render: () => getResult().html,
      setup: (element) => setupSvelteMounts(element, getResult().mounts),
    };
  });
}

function setupSvelteMounts(element: Element, mounts: readonly PendingSvelteMount[]) {
  if (mounts.length === 0) {
    return undefined;
  }

  const mounted = mounts.flatMap((item) => {
    const target = element.querySelector(`[data-wasser-svelte-component="${item.id}"]`);
    if (!target) {
      return [];
    }

    return [
      mount(item.component, {
        target,
        props: item.props,
      }),
    ];
  });

  return () => {
    for (const component of mounted) {
      void unmount(component);
    }
  };
}

function renderWasserToResult(
  { ui, registry, runtime, fallback, onDiagnostics }: WasserRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: runtime ?? emptyRuntime,
    registry,
  }),
): RenderHtmlResult {
  const diagnostics: WasserRenderDiagnostic[] = [];
  const effectiveRuntime = runtime ?? context.runtime;
  const mounts: PendingSvelteMount[] = [];

  if (!isVerifiedSchemaUI(ui)) {
    diagnostics.push(
      diagnostic("invalid_renderer_input", "$", "WasserRenderer accepts only VerifiedSchemaUI."),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return {
      html: renderChildToHtml(renderFallback(fallback, diagnostics[0]), {
        runtime: effectiveRuntime,
        mounts,
      }),
      mounts,
    };
  }

  const session: RenderSession = {
    ui,
    registry: registry ?? context.registry ?? effectiveRuntime.registry,
    runtime: effectiveRuntime,
    diagnostics,
    fallback,
  };
  const output = renderNode(ui.root, session);

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return {
    html: renderChildToHtml(output, {
      runtime: effectiveRuntime,
      mounts,
    }),
    mounts,
  };
}

function renderWasserStreamToResult(
  props: WasserStreamRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: props.runtime ?? emptyRuntime,
    registry: props.registry,
  }),
): RenderHtmlResult {
  const verifiedUi = props.ui ?? props.stream?.ui;
  const mounts: PendingSvelteMount[] = [];

  if (!verifiedUi) {
    return {
      html: renderChildToHtml(props.fallback ?? null, {
        runtime: props.runtime ?? context.runtime,
        mounts,
      }),
      mounts,
    };
  }

  return renderWasserToResult(
    {
      ...props,
      ui: verifiedUi,
    },
    context,
  );
}

function renderWasserNodeToResult(
  { ui: uiProp, registry, runtime, nodeId, fallback, onDiagnostics }: NodeRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: runtime ?? emptyRuntime,
    registry,
  }),
): RenderHtmlResult {
  const effectiveRuntime = runtime ?? context.runtime;
  const ui = uiProp ?? getVerifiedUIFromRuntime(effectiveRuntime);
  const diagnostics: WasserRenderDiagnostic[] = [];
  const mounts: PendingSvelteMount[] = [];

  if (!ui) {
    diagnostics.push(
      diagnostic(
        "invalid_renderer_input",
        "$",
        "NodeRenderer requires runtime.ui to contain VerifiedSchemaUI.",
      ),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return {
      html: renderChildToHtml(renderFallback(fallback, diagnostics[0]), {
        runtime: effectiveRuntime,
        mounts,
      }),
      mounts,
    };
  }

  const output = renderNode(nodeId, {
    ui,
    registry: registry ?? context.registry ?? effectiveRuntime.registry,
    runtime: effectiveRuntime,
    diagnostics,
    fallback,
  });

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return {
    html: renderChildToHtml(output, {
      runtime: effectiveRuntime,
      mounts,
    }),
    mounts,
  };
}

function renderWasserSlotToResult(
  { ui: uiProp, registry, runtime, nodeId, name, fallback, onDiagnostics }: SlotRendererProps,
  context: WasserRuntimeContextValue = createWasserRuntime({
    runtime: runtime ?? emptyRuntime,
    registry,
  }),
): RenderHtmlResult {
  const effectiveRuntime = runtime ?? context.runtime;
  const ui = uiProp ?? getVerifiedUIFromRuntime(effectiveRuntime);
  const diagnostics: WasserRenderDiagnostic[] = [];
  const mounts: PendingSvelteMount[] = [];

  if (!ui) {
    diagnostics.push(
      diagnostic(
        "invalid_renderer_input",
        "$",
        "SlotRenderer requires runtime.ui to contain VerifiedSchemaUI.",
      ),
    );
    onDiagnostics?.(Object.freeze(diagnostics));
    return {
      html: renderChildToHtml(renderFallback(fallback, diagnostics[0]), {
        runtime: effectiveRuntime,
        mounts,
      }),
      mounts,
    };
  }

  const output = renderSlot(nodeId, name, {
    ui,
    registry: registry ?? context.registry ?? effectiveRuntime.registry,
    runtime: effectiveRuntime,
    diagnostics,
    fallback,
  });

  onDiagnostics?.(Object.freeze([...diagnostics]));
  return {
    html: renderChildToHtml(output, {
      runtime: effectiveRuntime,
      mounts,
    }),
    mounts,
  };
}

function renderNode(nodeId: string, session: RenderSession): WasserSvelteChild {
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

    const childElements = (node.children ?? []).map((childId) => renderNode(childId, session));
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

function renderSlot(nodeId: string, slotName: string, session: RenderSession): WasserSvelteChild {
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
): Readonly<Record<string, WasserSvelteChild>> {
  const slots: Record<string, WasserSvelteChild> = Object.create(null);

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

function renderFallback(
  fallback: WasserSvelteChild,
  diagnostic: WasserRenderDiagnostic,
): WasserSvelteChild {
  if (fallback !== undefined) {
    return fallback;
  }

  return wasserElement("span", {
    "data-wasser-fallback": diagnostic.code,
    "data-wasser-node-id": diagnostic.nodeId,
    "data-wasser-component-type": diagnostic.componentType,
  });
}

function renderChildToHtml(child: WasserSvelteChild, options: RenderHtmlOptions): string {
  if (child === null || child === undefined || typeof child === "boolean") {
    return "";
  }

  if (typeof child === "string" || typeof child === "number") {
    return escapeText(String(child));
  }

  if (Array.isArray(child)) {
    return child.map((item) => renderChildToHtml(item, options)).join("");
  }

  if (isRawHtml(child)) {
    return child.html;
  }

  if (isSvelteComponent(child)) {
    const props = child.props ?? {};
    const html = options.runtime.renderComponent?.(child.component, props);
    if (html !== undefined) {
      return html;
    }

    const id = `component-${options.mounts.length}`;
    options.mounts.push({
      id,
      component: child.component,
      props,
    });
    return `<span data-wasser-svelte-component="${id}"></span>`;
  }

  if (isWasserElement(child)) {
    return renderElementToHtml(child, options);
  }

  return "";
}

function renderElementToHtml(element: WasserSvelteElement, options: RenderHtmlOptions): string {
  if (!isSafeTagName(element.tag)) {
    return "";
  }

  const attributes = renderAttributes(element.props ?? {});
  return `<${element.tag}${attributes}>${renderChildToHtml(element.children, options)}</${element.tag}>`;
}

function renderAttributes(props: WasserSvelteElementProps): string {
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

function isWasserElement(value: unknown): value is WasserSvelteElement {
  return isRecord(value) && value.kind === "wasser.svelte.element" && typeof value.tag === "string";
}

function isRawHtml(value: unknown): value is WasserSvelteRawHtml {
  return (
    isRecord(value) && value.kind === "wasser.svelte.raw-html" && typeof value.html === "string"
  );
}

function isSvelteComponent(value: unknown): value is WasserSvelteComponent {
  return (
    isRecord(value) &&
    value.kind === "wasser.svelte.component" &&
    typeof value.component === "function"
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
