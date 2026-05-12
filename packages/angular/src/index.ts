import { NgComponentOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  InjectionToken,
  Input,
  Output,
  inject,
  makeEnvironmentProviders,
} from "@angular/core";
import { assertVerifiedSchemaUI, getWasserComponent, isVerifiedSchemaUI } from "@wasser-ui/core";
import type { EnvironmentProviders, OnChanges, Provider, SimpleChanges, Type } from "@angular/core";
import type {
  SchemaUINode,
  StreamState,
  VerifiedSchemaUI,
  WasserComponentEntry,
  WasserRegistry,
} from "@wasser-ui/core";

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

export type WasserAngularPrimitive = string | number | boolean | null | undefined;

export type WasserAngularComponentInputs = Readonly<Record<string, unknown>>;

export type WasserAngularComponent = Readonly<{
  kind: "wasser.angular.component";
  component: Type<unknown>;
  inputs?: WasserAngularComponentInputs;
}>;

export type WasserAngularChild =
  | WasserAngularPrimitive
  | WasserAngularComponent
  | readonly WasserAngularChild[];

export type WasserRenderContext<Props = Record<string, unknown>> = {
  props: Props;
  nodeId: string;
  node: SchemaUINode;
  component: WasserComponentEntry<Props>;
  runtime: WasserRuntime;
  bindings: WasserRenderBindings;
  children: readonly WasserAngularChild[];
  slots: Readonly<Record<string, WasserAngularChild>>;
  renderNode: (nodeId: string) => WasserAngularChild;
  renderSlot: (nodeId: string, slotName: string) => WasserAngularChild;
};

export type WasserRenderBinding<Props = Record<string, unknown>> = (
  context: WasserRenderContext<Props>,
) => WasserAngularChild;

export type WasserRuntimeProviderOptions = {
  runtime: WasserRuntime;
  registry?: WasserRegistry;
};

export type WasserRendererInputs = {
  ui: VerifiedSchemaUI;
  registry?: WasserRegistry;
  runtime?: WasserRuntime;
  fallback?: WasserAngularChild;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type WasserStreamRendererInputs = Omit<WasserRendererInputs, "ui"> & {
  ui?: VerifiedSchemaUI;
  stream?: StreamState;
};

export type NodeRendererInputs = {
  ui?: VerifiedSchemaUI;
  registry?: WasserRegistry;
  runtime?: WasserRuntime;
  nodeId: string;
  fallback?: WasserAngularChild;
  onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
};

export type SlotRendererInputs = {
  ui?: VerifiedSchemaUI;
  registry?: WasserRegistry;
  runtime?: WasserRuntime;
  nodeId: string;
  name: string;
  fallback?: WasserAngularChild;
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
  fallback?: WasserAngularChild;
};

const emptyRuntime: WasserRuntime = Object.freeze({});
const emptyInputs = Object.freeze({});

export const WASSER_RUNTIME = new InjectionToken<WasserRuntime>("WASSER_RUNTIME", {
  factory: () => emptyRuntime,
});

export const WASSER_REGISTRY = new InjectionToken<WasserRegistry | undefined>("WASSER_REGISTRY", {
  factory: () => undefined,
});

export function provideWasserRuntime({
  runtime,
  registry,
}: WasserRuntimeProviderOptions): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: WASSER_RUNTIME,
      useValue: runtime,
    },
  ];

  if (registry) {
    providers.push({
      provide: WASSER_REGISTRY,
      useValue: registry,
    });
  }

  return makeEnvironmentProviders(providers);
}

export function wasserComponent(
  component: Type<unknown>,
  inputs?: WasserAngularComponentInputs,
): WasserAngularComponent {
  return Object.freeze({
    kind: "wasser.angular.component",
    component,
    ...(inputs ? { inputs: Object.freeze({ ...inputs }) } : {}),
  });
}

@Component({
  selector: "wasser-fallback",
  standalone: true,
  template:
    '<span [attr.data-wasser-fallback]="code" [attr.data-wasser-node-id]="nodeId ?? null" [attr.data-wasser-component-type]="componentType ?? null"></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WasserFallbackComponent {
  @Input() code: WasserRenderDiagnosticCode = "render_binding_error";
  @Input() nodeId?: string;
  @Input() componentType?: string;
}

@Component({
  selector: "wasser-outlet",
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (isArray(value)) {
      @for (child of asArray(value); track $index) {
        <wasser-outlet [value]="child" />
      }
    } @else if (isComponent(value)) {
      <ng-container *ngComponentOutlet="value.component; inputs: value.inputs ?? emptyInputs" />
    } @else {
      {{ stringifyPrimitive(value) }}
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WasserOutletComponent {
  @Input() value: WasserAngularChild = null;

  readonly emptyInputs = emptyInputs;

  isArray(value: WasserAngularChild): value is readonly WasserAngularChild[] {
    return Array.isArray(value);
  }

  asArray(value: WasserAngularChild): readonly WasserAngularChild[] {
    return Array.isArray(value) ? value : [];
  }

  isComponent(value: WasserAngularChild): value is WasserAngularComponent {
    return isRecord(value) && value.kind === "wasser.angular.component";
  }

  stringifyPrimitive(value: WasserAngularChild): string {
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    return "";
  }
}

@Component({
  selector: "wasser-renderer",
  standalone: true,
  imports: [WasserOutletComponent],
  template: '<wasser-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WasserRendererComponent implements OnChanges {
  @Input({ required: true }) ui?: VerifiedSchemaUI;
  @Input() registry?: WasserRegistry;
  @Input() runtime?: WasserRuntime;
  @Input() fallback?: WasserAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WasserRenderDiagnostic[]>();

  rendered: WasserAngularChild = null;

  private readonly context = injectWasserRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const diagnostics: WasserRenderDiagnostic[] = [];

    if (!isVerifiedSchemaUI(this.ui)) {
      diagnostics.push(
        diagnostic("invalid_renderer_input", "$", "WasserRenderer accepts only VerifiedSchemaUI."),
      );
      this.emitDiagnostics(diagnostics);
      this.rendered = renderFallback(this.fallback, diagnostics[0]);
      return;
    }

    this.rendered = renderNode(this.ui.root, {
      ui: this.ui,
      registry: this.registry ?? this.context.registry ?? this.context.runtime.registry,
      runtime: this.runtime ?? this.context.runtime,
      diagnostics,
      fallback: this.fallback,
    });

    this.emitDiagnostics(diagnostics);
  }

  private emitDiagnostics(diagnostics: readonly WasserRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

@Component({
  selector: "wasser-stream-renderer",
  standalone: true,
  imports: [WasserOutletComponent],
  template: '<wasser-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WasserStreamRendererComponent implements OnChanges {
  @Input() ui?: VerifiedSchemaUI;
  @Input() stream?: StreamState;
  @Input() registry?: WasserRegistry;
  @Input() runtime?: WasserRuntime;
  @Input() fallback?: WasserAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WasserRenderDiagnostic[]>();

  rendered: WasserAngularChild = null;

  private readonly context = injectWasserRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const verifiedUi = this.ui ?? this.stream?.ui;
    if (!verifiedUi) {
      this.rendered = this.fallback ?? null;
      this.emitDiagnostics([]);
      return;
    }

    const diagnostics: WasserRenderDiagnostic[] = [];
    this.rendered = renderVerifiedUI(verifiedUi, {
      registry: this.registry,
      runtime: this.runtime,
      fallback: this.fallback,
      context: this.context,
      diagnostics,
    });
    this.emitDiagnostics(diagnostics);
  }

  private emitDiagnostics(diagnostics: readonly WasserRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

@Component({
  selector: "wasser-node-renderer",
  standalone: true,
  imports: [WasserOutletComponent],
  template: '<wasser-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeRendererComponent implements OnChanges {
  @Input() ui?: VerifiedSchemaUI;
  @Input() registry?: WasserRegistry;
  @Input() runtime?: WasserRuntime;
  @Input({ required: true }) nodeId = "";
  @Input() fallback?: WasserAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WasserRenderDiagnostic[]>();

  rendered: WasserAngularChild = null;

  private readonly context = injectWasserRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const activeRuntime = this.runtime ?? this.context.runtime;
    const ui = this.ui ?? getVerifiedUIFromRuntime(activeRuntime);
    const diagnostics: WasserRenderDiagnostic[] = [];

    if (!ui) {
      diagnostics.push(
        diagnostic(
          "invalid_renderer_input",
          "$",
          "NodeRenderer requires runtime.ui to contain VerifiedSchemaUI.",
        ),
      );
      this.emitDiagnostics(diagnostics);
      this.rendered = renderFallback(this.fallback, diagnostics[0]);
      return;
    }

    this.rendered = renderNode(this.nodeId, {
      ui,
      registry: this.registry ?? this.context.registry ?? activeRuntime.registry,
      runtime: activeRuntime,
      diagnostics,
      fallback: this.fallback,
    });
    this.emitDiagnostics(diagnostics);
  }

  private emitDiagnostics(diagnostics: readonly WasserRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

@Component({
  selector: "wasser-slot-renderer",
  standalone: true,
  imports: [WasserOutletComponent],
  template: '<wasser-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotRendererComponent implements OnChanges {
  @Input() ui?: VerifiedSchemaUI;
  @Input() registry?: WasserRegistry;
  @Input() runtime?: WasserRuntime;
  @Input({ required: true }) nodeId = "";
  @Input({ required: true }) name = "";
  @Input() fallback?: WasserAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WasserRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WasserRenderDiagnostic[]>();

  rendered: WasserAngularChild = null;

  private readonly context = injectWasserRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const activeRuntime = this.runtime ?? this.context.runtime;
    const ui = this.ui ?? getVerifiedUIFromRuntime(activeRuntime);
    const diagnostics: WasserRenderDiagnostic[] = [];

    if (!ui) {
      diagnostics.push(
        diagnostic(
          "invalid_renderer_input",
          "$",
          "SlotRenderer requires runtime.ui to contain VerifiedSchemaUI.",
        ),
      );
      this.emitDiagnostics(diagnostics);
      this.rendered = renderFallback(this.fallback, diagnostics[0]);
      return;
    }

    this.rendered = renderSlot(this.nodeId, this.name, {
      ui,
      registry: this.registry ?? this.context.registry ?? activeRuntime.registry,
      runtime: activeRuntime,
      diagnostics,
      fallback: this.fallback,
    });
    this.emitDiagnostics(diagnostics);
  }

  private emitDiagnostics(diagnostics: readonly WasserRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

function renderVerifiedUI(
  ui: VerifiedSchemaUI,
  options: {
    registry?: WasserRegistry;
    runtime?: WasserRuntime;
    fallback?: WasserAngularChild;
    context: WasserRuntimeContextValue;
    diagnostics: WasserRenderDiagnostic[];
  },
): WasserAngularChild {
  if (!isVerifiedSchemaUI(ui)) {
    const failure = diagnostic(
      "invalid_renderer_input",
      "$",
      "WasserRenderer accepts only VerifiedSchemaUI.",
    );
    options.diagnostics.push(failure);
    return renderFallback(options.fallback, failure);
  }

  const runtime = options.runtime ?? options.context.runtime;
  return renderNode(ui.root, {
    ui,
    registry: options.registry ?? options.context.registry ?? runtime.registry,
    runtime,
    diagnostics: options.diagnostics,
    fallback: options.fallback,
  });
}

function renderNode(nodeId: string, session: RenderSession): WasserAngularChild {
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

function renderSlot(nodeId: string, slotName: string, session: RenderSession): WasserAngularChild {
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
  return references.map((slotNodeId) => renderNode(slotNodeId, session));
}

function renderSlots(
  nodeId: string,
  node: SchemaUINode,
  session: RenderSession,
): Readonly<Record<string, WasserAngularChild>> {
  const slots: Record<string, WasserAngularChild> = Object.create(null);

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
  fallback: WasserAngularChild | undefined,
  diagnostic: WasserRenderDiagnostic,
): WasserAngularChild {
  if (fallback !== undefined) {
    return fallback;
  }

  return wasserComponent(WasserFallbackComponent, {
    code: diagnostic.code,
    nodeId: diagnostic.nodeId,
    componentType: diagnostic.componentType,
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

function injectWasserRuntimeContext(): WasserRuntimeContextValue {
  const runtime = inject(WASSER_RUNTIME);
  const registry = inject(WASSER_REGISTRY);

  return {
    runtime,
    registry: registry ?? runtime.registry,
  };
}
