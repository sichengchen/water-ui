import { assertVerifiedSchemaUI, getWasserComponent, isVerifiedSchemaUI } from "@wasser-ui/core";
import { defineComponent, h, inject, provide } from "vue";
import type {
  SchemaUINode,
  StreamState,
  VerifiedSchemaUI,
  WasserComponentEntry,
  WasserRegistry,
} from "@wasser-ui/core";
import type { InjectionKey, PropType, VNode, VNodeArrayChildren, VNodeChild } from "vue";

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

export type WasserVueChild = string | number | boolean | VNode | VNodeArrayChildren;

export type WasserRenderContext<Props = Record<string, unknown>> = {
  props: Props;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry<Props>;
  runtime: WasserRuntime;
  bindings: WasserRenderBindings;
  children: VNodeArrayChildren;
  slots: Readonly<Record<string, WasserVueChild>>;
  renderNode: (nodeId: string) => VNodeChild;
  renderSlot: (nodeId: string, slotName: string) => VNodeChild;
};

export type WasserRenderBinding<Props = Record<string, unknown>> = (
  context: WasserRenderContext<Props>,
) => VNodeChild;

export type WasserRuntimeProviderProps = {
  runtime: WasserRuntime;
  registry?: WasserRegistry;
};

export type WasserRendererProps = {
  ui: VerifiedSchemaUI;
  registry?: WasserRegistry;
  fallback?: VNodeChild;
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
  fallback?: VNodeChild;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type SlotRendererProps = {
  ui?: VerifiedSchemaUI;
  registry?: WasserRegistry;
  nodeId: string;
  name: string;
  fallback?: VNodeChild;
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
  fallback?: VNodeChild;
};

const WasserRuntimeKey: InjectionKey<WasserRuntimeContextValue> = Symbol("WasserRuntime");
const emptyRuntime = Object.freeze({});

export const WasserRuntimeProvider = defineComponent({
  name: "WasserRuntimeProvider",
  props: {
    runtime: {
      type: Object as PropType<WasserRuntime>,
      required: true,
    },
    registry: {
      type: Object as PropType<WasserRegistry>,
      required: false,
    },
  },
  setup(props, { slots }) {
    provide(WasserRuntimeKey, {
      get runtime() {
        return props.runtime;
      },
      get registry() {
        return props.registry ?? props.runtime.registry;
      },
    });

    return () => renderDefaultSlot(slots.default?.());
  },
});

export const WasserRenderer = defineComponent({
  name: "WasserRenderer",
  props: {
    ui: {
      type: Object as PropType<VerifiedSchemaUI>,
      required: true,
    },
    registry: {
      type: Object as PropType<WasserRegistry>,
      required: false,
    },
    fallback: {
      type: null as unknown as PropType<VNodeChild>,
      required: false,
    },
    onDiagnostics: {
      type: Function as PropType<(diagnostics: readonly WasserRenderDiagnostic[]) => void>,
      required: false,
    },
  },
  setup(props) {
    const context = useWasserRuntimeContext();

    return () => {
      const diagnostics: WasserRenderDiagnostic[] = [];

      if (!isVerifiedSchemaUI(props.ui)) {
        diagnostics.push(
          diagnostic(
            "invalid_renderer_input",
            "$",
            "WasserRenderer accepts only VerifiedSchemaUI.",
          ),
        );
        props.onDiagnostics?.(Object.freeze(diagnostics));
        return renderFallback(props.fallback, diagnostics[0]);
      }

      const session: RenderSession = {
        ui: props.ui,
        registry: props.registry ?? context.registry ?? context.runtime.registry,
        runtime: context.runtime,
        diagnostics,
        fallback: props.fallback,
      };
      const element = renderNode(props.ui.root, session);

      props.onDiagnostics?.(Object.freeze([...diagnostics]));
      return element;
    };
  },
});

export const WasserStreamRenderer = defineComponent({
  name: "WasserStreamRenderer",
  props: {
    ui: {
      type: Object as PropType<VerifiedSchemaUI>,
      required: false,
    },
    stream: {
      type: Object as PropType<StreamState>,
      required: false,
    },
    registry: {
      type: Object as PropType<WasserRegistry>,
      required: false,
    },
    fallback: {
      type: null as unknown as PropType<VNodeChild>,
      required: false,
    },
    onDiagnostics: {
      type: Function as PropType<(diagnostics: readonly WasserRenderDiagnostic[]) => void>,
      required: false,
    },
  },
  setup(props) {
    return () => {
      const verifiedUi = props.ui ?? props.stream?.ui;
      if (!verifiedUi) {
        return props.fallback ?? null;
      }

      return h(WasserRenderer, {
        ui: verifiedUi,
        registry: props.registry,
        fallback: props.fallback,
        onDiagnostics: props.onDiagnostics,
      });
    };
  },
});

export const NodeRenderer = defineComponent({
  name: "NodeRenderer",
  props: {
    ui: {
      type: Object as PropType<VerifiedSchemaUI>,
      required: false,
    },
    registry: {
      type: Object as PropType<WasserRegistry>,
      required: false,
    },
    nodeId: {
      type: String,
      required: true,
    },
    fallback: {
      type: null as unknown as PropType<VNodeChild>,
      required: false,
    },
    onDiagnostics: {
      type: Function as PropType<(diagnostics: readonly WasserRenderDiagnostic[]) => void>,
      required: false,
    },
  },
  setup(props) {
    const context = useWasserRuntimeContext();

    return () => {
      const ui = props.ui ?? getVerifiedUIFromRuntime(context.runtime);
      const diagnostics: WasserRenderDiagnostic[] = [];

      if (!ui) {
        diagnostics.push(
          diagnostic(
            "invalid_renderer_input",
            "$",
            "NodeRenderer requires runtime.ui to contain VerifiedSchemaUI.",
          ),
        );
        props.onDiagnostics?.(Object.freeze(diagnostics));
        return renderFallback(props.fallback, diagnostics[0]);
      }

      const element = renderNode(props.nodeId, {
        ui,
        registry: props.registry ?? context.registry ?? context.runtime.registry,
        runtime: context.runtime,
        diagnostics,
        fallback: props.fallback,
      });

      props.onDiagnostics?.(Object.freeze([...diagnostics]));
      return element;
    };
  },
});

export const SlotRenderer = defineComponent({
  name: "SlotRenderer",
  props: {
    ui: {
      type: Object as PropType<VerifiedSchemaUI>,
      required: false,
    },
    registry: {
      type: Object as PropType<WasserRegistry>,
      required: false,
    },
    nodeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fallback: {
      type: null as unknown as PropType<VNodeChild>,
      required: false,
    },
    onDiagnostics: {
      type: Function as PropType<(diagnostics: readonly WasserRenderDiagnostic[]) => void>,
      required: false,
    },
  },
  setup(props) {
    const context = useWasserRuntimeContext();

    return () => {
      const ui = props.ui ?? getVerifiedUIFromRuntime(context.runtime);
      const diagnostics: WasserRenderDiagnostic[] = [];

      if (!ui) {
        diagnostics.push(
          diagnostic(
            "invalid_renderer_input",
            "$",
            "SlotRenderer requires runtime.ui to contain VerifiedSchemaUI.",
          ),
        );
        props.onDiagnostics?.(Object.freeze(diagnostics));
        return renderFallback(props.fallback, diagnostics[0]);
      }

      const element = renderSlot(props.nodeId, props.name, {
        ui,
        registry: props.registry ?? context.registry ?? context.runtime.registry,
        runtime: context.runtime,
        diagnostics,
        fallback: props.fallback,
      });

      props.onDiagnostics?.(Object.freeze([...diagnostics]));
      return element;
    };
  },
});

function renderNode(nodeId: string, session: RenderSession): VNodeChild {
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
      renderNode(childId, session),
    ) as VNodeArrayChildren;
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

function renderSlot(nodeId: string, slotName: string, session: RenderSession): VNodeChild {
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
): Readonly<Record<string, WasserVueChild>> {
  const slots: Record<string, WasserVueChild> = Object.create(null);

  for (const slotName of Object.keys(node.slots ?? {})) {
    slots[slotName] = renderSlot(nodeId, slotName, session) as WasserVueChild;
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

function renderFallback(fallback: VNodeChild, diagnostic: WasserRenderDiagnostic): VNodeChild {
  if (fallback !== undefined) {
    return fallback;
  }

  return h("span", {
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

function useWasserRuntimeContext(): WasserRuntimeContextValue {
  return inject(WasserRuntimeKey, {
    runtime: emptyRuntime,
  });
}

function renderDefaultSlot(children: VNodeChild[] | undefined): VNodeChild {
  if (!children) {
    return null;
  }

  return children.length === 1 ? children[0] : children;
}
