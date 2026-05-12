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
import { assertVerifiedSchemaUI, getWaterComponent, isVerifiedSchemaUI } from "@water-ui/core";
import type { EnvironmentProviders, OnChanges, Provider, SimpleChanges, Type } from "@angular/core";
import type {
  SchemaUINode,
  StreamState,
  VerifiedSchemaUI,
  WaterComponentEntry,
  WaterRegistry,
} from "@water-ui/core";

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

export type WaterAngularPrimitive = string | number | boolean | null | undefined;

export type WaterAngularComponentInputs = Readonly<Record<string, unknown>>;

export type WaterAngularComponent = Readonly<{
  kind: "water.angular.component";
  component: Type<unknown>;
  inputs?: WaterAngularComponentInputs;
}>;

export type WaterAngularChild =
  | WaterAngularPrimitive
  | WaterAngularComponent
  | readonly WaterAngularChild[];

export type WaterRenderContext<Props = Record<string, unknown>> = {
  props: Props;
  nodeId: string;
  node: SchemaUINode;
  component: WaterComponentEntry<Props>;
  runtime: WaterRuntime;
  bindings: WaterRenderBindings;
  children: readonly WaterAngularChild[];
  slots: Readonly<Record<string, WaterAngularChild>>;
  renderNode: (nodeId: string) => WaterAngularChild;
  renderSlot: (nodeId: string, slotName: string) => WaterAngularChild;
};

export type WaterRenderBinding<Props = Record<string, unknown>> = (
  context: WaterRenderContext<Props>,
) => WaterAngularChild;

export type WaterRuntimeProviderOptions = {
  runtime: WaterRuntime;
  registry?: WaterRegistry;
};

export type WaterRendererInputs = {
  ui: VerifiedSchemaUI;
  registry?: WaterRegistry;
  runtime?: WaterRuntime;
  fallback?: WaterAngularChild;
  onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
};

export type WaterStreamRendererInputs = Omit<WaterRendererInputs, "ui"> & {
  ui?: VerifiedSchemaUI;
  stream?: StreamState;
};

export type NodeRendererInputs = {
  ui?: VerifiedSchemaUI;
  registry?: WaterRegistry;
  runtime?: WaterRuntime;
  nodeId: string;
  fallback?: WaterAngularChild;
  onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
};

export type SlotRendererInputs = {
  ui?: VerifiedSchemaUI;
  registry?: WaterRegistry;
  runtime?: WaterRuntime;
  nodeId: string;
  name: string;
  fallback?: WaterAngularChild;
  onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
};

type WaterRuntimeContextValue = {
  runtime: WaterRuntime;
  registry?: WaterRegistry;
};

type RenderSession = {
  ui: VerifiedSchemaUI;
  registry?: WaterRegistry;
  runtime: WaterRuntime;
  diagnostics: WaterRenderDiagnostic[];
  fallback?: WaterAngularChild;
};

const emptyRuntime: WaterRuntime = Object.freeze({});
const emptyInputs = Object.freeze({});

export const WATER_RUNTIME = new InjectionToken<WaterRuntime>("WATER_RUNTIME", {
  factory: () => emptyRuntime,
});

export const WATER_REGISTRY = new InjectionToken<WaterRegistry | undefined>("WATER_REGISTRY", {
  factory: () => undefined,
});

export function provideWaterRuntime({
  runtime,
  registry,
}: WaterRuntimeProviderOptions): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: WATER_RUNTIME,
      useValue: runtime,
    },
  ];

  if (registry) {
    providers.push({
      provide: WATER_REGISTRY,
      useValue: registry,
    });
  }

  return makeEnvironmentProviders(providers);
}

export function waterComponent(
  component: Type<unknown>,
  inputs?: WaterAngularComponentInputs,
): WaterAngularComponent {
  return Object.freeze({
    kind: "water.angular.component",
    component,
    ...(inputs ? { inputs: Object.freeze({ ...inputs }) } : {}),
  });
}

@Component({
  selector: "water-fallback",
  standalone: true,
  template:
    '<span [attr.data-water-fallback]="code" [attr.data-water-node-id]="nodeId ?? null" [attr.data-water-component-type]="componentType ?? null"></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaterFallbackComponent {
  @Input() code: WaterRenderDiagnosticCode = "render_binding_error";
  @Input() nodeId?: string;
  @Input() componentType?: string;
}

@Component({
  selector: "water-outlet",
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (isArray(value)) {
      @for (child of asArray(value); track $index) {
        <water-outlet [value]="child" />
      }
    } @else if (isComponent(value)) {
      <ng-container *ngComponentOutlet="value.component; inputs: value.inputs ?? emptyInputs" />
    } @else {
      {{ stringifyPrimitive(value) }}
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaterOutletComponent {
  @Input() value: WaterAngularChild = null;

  readonly emptyInputs = emptyInputs;

  isArray(value: WaterAngularChild): value is readonly WaterAngularChild[] {
    return Array.isArray(value);
  }

  asArray(value: WaterAngularChild): readonly WaterAngularChild[] {
    return Array.isArray(value) ? value : [];
  }

  isComponent(value: WaterAngularChild): value is WaterAngularComponent {
    return isRecord(value) && value.kind === "water.angular.component";
  }

  stringifyPrimitive(value: WaterAngularChild): string {
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    return "";
  }
}

@Component({
  selector: "water-renderer",
  standalone: true,
  imports: [WaterOutletComponent],
  template: '<water-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaterRendererComponent implements OnChanges {
  @Input({ required: true }) ui?: VerifiedSchemaUI;
  @Input() registry?: WaterRegistry;
  @Input() runtime?: WaterRuntime;
  @Input() fallback?: WaterAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WaterRenderDiagnostic[]>();

  rendered: WaterAngularChild = null;

  private readonly context = injectWaterRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const diagnostics: WaterRenderDiagnostic[] = [];

    if (!isVerifiedSchemaUI(this.ui)) {
      diagnostics.push(
        diagnostic("invalid_renderer_input", "$", "WaterRenderer accepts only VerifiedSchemaUI."),
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

  private emitDiagnostics(diagnostics: readonly WaterRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

@Component({
  selector: "water-stream-renderer",
  standalone: true,
  imports: [WaterOutletComponent],
  template: '<water-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaterStreamRendererComponent implements OnChanges {
  @Input() ui?: VerifiedSchemaUI;
  @Input() stream?: StreamState;
  @Input() registry?: WaterRegistry;
  @Input() runtime?: WaterRuntime;
  @Input() fallback?: WaterAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WaterRenderDiagnostic[]>();

  rendered: WaterAngularChild = null;

  private readonly context = injectWaterRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const verifiedUi = this.ui ?? this.stream?.ui;
    if (!verifiedUi) {
      this.rendered = this.fallback ?? null;
      this.emitDiagnostics([]);
      return;
    }

    const diagnostics: WaterRenderDiagnostic[] = [];
    this.rendered = renderVerifiedUI(verifiedUi, {
      registry: this.registry,
      runtime: this.runtime,
      fallback: this.fallback,
      context: this.context,
      diagnostics,
    });
    this.emitDiagnostics(diagnostics);
  }

  private emitDiagnostics(diagnostics: readonly WaterRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

@Component({
  selector: "water-node-renderer",
  standalone: true,
  imports: [WaterOutletComponent],
  template: '<water-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeRendererComponent implements OnChanges {
  @Input() ui?: VerifiedSchemaUI;
  @Input() registry?: WaterRegistry;
  @Input() runtime?: WaterRuntime;
  @Input({ required: true }) nodeId = "";
  @Input() fallback?: WaterAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WaterRenderDiagnostic[]>();

  rendered: WaterAngularChild = null;

  private readonly context = injectWaterRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const activeRuntime = this.runtime ?? this.context.runtime;
    const ui = this.ui ?? getVerifiedUIFromRuntime(activeRuntime);
    const diagnostics: WaterRenderDiagnostic[] = [];

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

  private emitDiagnostics(diagnostics: readonly WaterRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

@Component({
  selector: "water-slot-renderer",
  standalone: true,
  imports: [WaterOutletComponent],
  template: '<water-outlet [value]="rendered" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotRendererComponent implements OnChanges {
  @Input() ui?: VerifiedSchemaUI;
  @Input() registry?: WaterRegistry;
  @Input() runtime?: WaterRuntime;
  @Input({ required: true }) nodeId = "";
  @Input({ required: true }) name = "";
  @Input() fallback?: WaterAngularChild;
  @Input() onDiagnostics?: (diagnostics: readonly WaterRenderDiagnostic[]) => void;
  @Output() diagnosticsChange = new EventEmitter<readonly WaterRenderDiagnostic[]>();

  rendered: WaterAngularChild = null;

  private readonly context = injectWaterRuntimeContext();

  ngOnChanges(_changes: SimpleChanges): void {
    const activeRuntime = this.runtime ?? this.context.runtime;
    const ui = this.ui ?? getVerifiedUIFromRuntime(activeRuntime);
    const diagnostics: WaterRenderDiagnostic[] = [];

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

  private emitDiagnostics(diagnostics: readonly WaterRenderDiagnostic[]): void {
    const frozen = Object.freeze([...diagnostics]);
    this.onDiagnostics?.(frozen);
    this.diagnosticsChange.emit(frozen);
  }
}

function renderVerifiedUI(
  ui: VerifiedSchemaUI,
  options: {
    registry?: WaterRegistry;
    runtime?: WaterRuntime;
    fallback?: WaterAngularChild;
    context: WaterRuntimeContextValue;
    diagnostics: WaterRenderDiagnostic[];
  },
): WaterAngularChild {
  if (!isVerifiedSchemaUI(ui)) {
    const failure = diagnostic(
      "invalid_renderer_input",
      "$",
      "WaterRenderer accepts only VerifiedSchemaUI.",
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

function renderNode(nodeId: string, session: RenderSession): WaterAngularChild {
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

function renderSlot(nodeId: string, slotName: string, session: RenderSession): WaterAngularChild {
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
): Readonly<Record<string, WaterAngularChild>> {
  const slots: Record<string, WaterAngularChild> = Object.create(null);

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
  fallback: WaterAngularChild | undefined,
  diagnostic: WaterRenderDiagnostic,
): WaterAngularChild {
  if (fallback !== undefined) {
    return fallback;
  }

  return waterComponent(WaterFallbackComponent, {
    code: diagnostic.code,
    nodeId: diagnostic.nodeId,
    componentType: diagnostic.componentType,
  });
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPathKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function injectWaterRuntimeContext(): WaterRuntimeContextValue {
  const runtime = inject(WATER_RUNTIME);
  const registry = inject(WATER_REGISTRY);

  return {
    runtime,
    registry: registry ?? runtime.registry,
  };
}
