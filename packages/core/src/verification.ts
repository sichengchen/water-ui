import { normalizeSchemaUIDocument } from "./protocol.js";
import type { DiagnosticSeverity, WaterComponentEntry, WaterRegistry } from "./index.js";
import type { SchemaUIDiagnostic, SchemaUIDocument, SchemaUINode } from "./protocol.js";

const verifiedSchemaUIBrand: unique symbol = Symbol("VerifiedSchemaUI");

export type RuntimeCapabilitySet =
  | readonly string[]
  | Readonly<Record<string, unknown>>
  | ReadonlySet<string>;

export type RuntimeCapabilityDescription = {
  actions?: RuntimeCapabilitySet;
  dataRefs?: RuntimeCapabilitySet;
  state?: RuntimeCapabilitySet;
  stateKeys?: RuntimeCapabilitySet;
};

export type VerificationDiagnosticCode =
  | SchemaUIDiagnostic["code"]
  | "invalid_document_root_reference"
  | "invalid_node_reference"
  | "unreachable_node"
  | "cycle_detected"
  | "unknown_component_type"
  | "invalid_component_props"
  | "invalid_component_children"
  | "invalid_component_slots"
  | "invalid_runtime_action"
  | "invalid_runtime_data_ref"
  | "invalid_runtime_state_key";

export type VerificationRepairMetadata = {
  kind: "remove_reference" | "remove_node" | "register_component" | "register_runtime_capability";
  path: string;
};

export type VerificationDiagnostic = {
  code: VerificationDiagnosticCode;
  severity: DiagnosticSeverity;
  path: string;
  message: string;
  nodeId?: string;
  componentType?: string;
  repair?: VerificationRepairMetadata;
};

export type VerifiedSchemaUI = SchemaUIDocument & {
  readonly [verifiedSchemaUIBrand]: true;
};

export type VerificationResult =
  | {
      ok: true;
      ui: VerifiedSchemaUI;
      diagnostics: readonly VerificationDiagnostic[];
    }
  | {
      ok: false;
      diagnostics: readonly VerificationDiagnostic[];
    };

export type VerifyDocumentOptions = {
  registry: WaterRegistry;
  runtime?: RuntimeCapabilityDescription;
};

type PropsVerificationResult =
  | {
      ok: true;
      props?: Record<string, unknown>;
    }
  | {
      ok: false;
    };

export function verifyDocument(input: unknown, options: VerifyDocumentOptions): VerificationResult {
  const parsed = normalizeSchemaUIDocument(input);
  if (!parsed.ok) {
    return fail(parsed.diagnostics);
  }

  const document = parsed.value;
  const verifiedNodes = cloneNodeMap(document.nodes);
  const diagnostics: VerificationDiagnostic[] = [];
  const root = document.nodes[document.root];

  if (!root) {
    diagnostics.push(
      diagnostic(
        "invalid_document_root_reference",
        "$.root",
        `Document root '${document.root}' must reference an existing node.`,
        {
          repair: {
            kind: "remove_reference",
            path: "$.root",
          },
        },
      ),
    );
  }

  verifyNodeReferences(document, diagnostics);
  verifyReachability(document, diagnostics);
  verifyRegistry(document, options, verifiedNodes, diagnostics);

  if (hasErrors(diagnostics)) {
    return fail(diagnostics);
  }

  return Object.freeze({
    ok: true,
    ui: brandVerifiedSchemaUI({
      ...document,
      nodes: Object.freeze(verifiedNodes),
    }),
    diagnostics: Object.freeze([]),
  });
}

export function isVerifiedSchemaUI(input: unknown): input is VerifiedSchemaUI {
  return (
    typeof input === "object" &&
    input !== null &&
    (input as VerifiedSchemaUI)[verifiedSchemaUIBrand] === true
  );
}

export function assertVerifiedSchemaUI(input: unknown): asserts input is VerifiedSchemaUI {
  if (!isVerifiedSchemaUI(input)) {
    throw new TypeError("Expected VerifiedSchemaUI.");
  }
}

function verifyNodeReferences(
  document: SchemaUIDocument,
  diagnostics: VerificationDiagnostic[],
): void {
  for (const [nodeId, node] of Object.entries(document.nodes)) {
    node.children?.forEach((childId, index) => {
      if (!document.nodes[childId]) {
        diagnostics.push(
          diagnostic(
            "invalid_node_reference",
            `$.nodes.${toPathKey(nodeId)}.children[${index}]`,
            `Node '${nodeId}' references missing child node '${childId}'.`,
            {
              nodeId,
              repair: {
                kind: "remove_reference",
                path: `$.nodes.${toPathKey(nodeId)}.children[${index}]`,
              },
            },
          ),
        );
      }
    });

    if (!node.slots) {
      continue;
    }

    for (const [slotName, slotValue] of Object.entries(node.slots)) {
      const references = Array.isArray(slotValue) ? slotValue : [slotValue];
      references.forEach((slotNodeId, index) => {
        if (!document.nodes[slotNodeId]) {
          const path =
            references.length === 1
              ? `$.nodes.${toPathKey(nodeId)}.slots.${toPathKey(slotName)}`
              : `$.nodes.${toPathKey(nodeId)}.slots.${toPathKey(slotName)}[${index}]`;
          diagnostics.push(
            diagnostic(
              "invalid_node_reference",
              path,
              `Node '${nodeId}' slot '${slotName}' references missing node '${slotNodeId}'.`,
              {
                nodeId,
                repair: {
                  kind: "remove_reference",
                  path,
                },
              },
            ),
          );
        }
      });
    }
  }
}

function verifyReachability(
  document: SchemaUIDocument,
  diagnostics: VerificationDiagnostic[],
): void {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (nodeId: string, path: string): void => {
    if (!document.nodes[nodeId]) {
      return;
    }

    if (visiting.has(nodeId)) {
      diagnostics.push(
        diagnostic("cycle_detected", path, `Node '${nodeId}' creates a cycle in the UI graph.`, {
          nodeId,
          repair: {
            kind: "remove_reference",
            path,
          },
        }),
      );
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    const node = document.nodes[nodeId];

    node.children?.forEach((childId, index) => {
      visit(childId, `$.nodes.${toPathKey(nodeId)}.children[${index}]`);
    });

    if (node.slots) {
      for (const [slotName, slotValue] of Object.entries(node.slots)) {
        const references = Array.isArray(slotValue) ? slotValue : [slotValue];
        references.forEach((slotNodeId, index) => {
          const path =
            references.length === 1
              ? `$.nodes.${toPathKey(nodeId)}.slots.${toPathKey(slotName)}`
              : `$.nodes.${toPathKey(nodeId)}.slots.${toPathKey(slotName)}[${index}]`;
          visit(slotNodeId, path);
        });
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  visit(document.root, "$.root");

  for (const nodeId of Object.keys(document.nodes).sort()) {
    if (!visited.has(nodeId)) {
      diagnostics.push(
        diagnostic(
          "unreachable_node",
          `$.nodes.${toPathKey(nodeId)}`,
          `Node '${nodeId}' is not reachable from document root '${document.root}'.`,
          {
            nodeId,
            repair: {
              kind: "remove_node",
              path: `$.nodes.${toPathKey(nodeId)}`,
            },
          },
        ),
      );
    }
  }
}

function verifyRegistry(
  document: SchemaUIDocument,
  options: VerifyDocumentOptions,
  verifiedNodes: Record<string, SchemaUINode>,
  diagnostics: VerificationDiagnostic[],
): void {
  for (const [nodeId, node] of Object.entries(document.nodes)) {
    const entry = options.registry.components[node.type];
    if (!entry) {
      diagnostics.push(
        diagnostic(
          "unknown_component_type",
          `$.nodes.${toPathKey(nodeId)}.type`,
          `Component type '${node.type}' is not registered.`,
          {
            nodeId,
            componentType: node.type,
            repair: {
              kind: "register_component",
              path: `$.nodes.${toPathKey(nodeId)}.type`,
            },
          },
        ),
      );
      continue;
    }

    verifyChildrenPolicy(nodeId, node, entry, diagnostics);
    verifySlotPolicy(nodeId, node, entry, diagnostics);
    const propsResult = verifyProps(nodeId, node, entry, diagnostics);
    if (propsResult.ok) {
      verifiedNodes[nodeId] = freezeNode({
        ...node,
        props: propsResult.props,
      });
    }

    verifyRuntimeReferences(
      nodeId,
      propsResult.ok ? { ...node, props: propsResult.props } : node,
      options.runtime ?? {},
      diagnostics,
    );
  }
}

function verifyChildrenPolicy(
  nodeId: string,
  node: SchemaUINode,
  entry: WaterComponentEntry,
  diagnostics: VerificationDiagnostic[],
): void {
  const children = node.children ?? [];
  const policy = entry.children ?? "none";

  if (policy === "none") {
    if (children.length > 0) {
      diagnostics.push(
        diagnostic(
          "invalid_component_children",
          `$.nodes.${toPathKey(nodeId)}.children`,
          `Component type '${entry.type}' does not accept children.`,
          {
            nodeId,
            componentType: entry.type,
          },
        ),
      );
    }
    return;
  }

  if (policy === "nodes") {
    return;
  }

  if (policy.min !== undefined && children.length < policy.min) {
    diagnostics.push(
      diagnostic(
        "invalid_component_children",
        `$.nodes.${toPathKey(nodeId)}.children`,
        `Component type '${entry.type}' requires at least ${policy.min} child nodes.`,
        {
          nodeId,
          componentType: entry.type,
        },
      ),
    );
  }

  if (policy.max !== undefined && children.length > policy.max) {
    diagnostics.push(
      diagnostic(
        "invalid_component_children",
        `$.nodes.${toPathKey(nodeId)}.children`,
        `Component type '${entry.type}' allows at most ${policy.max} child nodes.`,
        {
          nodeId,
          componentType: entry.type,
        },
      ),
    );
  }
}

function verifySlotPolicy(
  nodeId: string,
  node: SchemaUINode,
  entry: WaterComponentEntry,
  diagnostics: VerificationDiagnostic[],
): void {
  const slots = node.slots ?? {};
  const policy = entry.slots ?? {};
  const basePath = `$.nodes.${toPathKey(nodeId)}.slots`;

  for (const [slotName, slotPolicy] of Object.entries(policy)) {
    if (slotPolicy.required && slots[slotName] === undefined) {
      diagnostics.push(
        diagnostic(
          "invalid_component_slots",
          `${basePath}.${toPathKey(slotName)}`,
          `Component type '${entry.type}' requires slot '${slotName}'.`,
          {
            nodeId,
            componentType: entry.type,
          },
        ),
      );
    }
  }

  for (const [slotName, slotValue] of Object.entries(slots)) {
    const slotPolicy = policy[slotName];
    const path = `${basePath}.${toPathKey(slotName)}`;

    if (!slotPolicy) {
      diagnostics.push(
        diagnostic(
          "invalid_component_slots",
          path,
          `Component type '${entry.type}' does not define slot '${slotName}'.`,
          {
            nodeId,
            componentType: entry.type,
          },
        ),
      );
      continue;
    }

    if (Array.isArray(slotValue) && !slotPolicy.multiple) {
      diagnostics.push(
        diagnostic(
          "invalid_component_slots",
          path,
          `Component type '${entry.type}' slot '${slotName}' accepts one node.`,
          {
            nodeId,
            componentType: entry.type,
          },
        ),
      );
    }
  }
}

function verifyProps(
  nodeId: string,
  node: SchemaUINode,
  entry: WaterComponentEntry,
  diagnostics: VerificationDiagnostic[],
): PropsVerificationResult {
  if (!entry.propsSchema) {
    return { ok: true, props: node.props };
  }

  const propsPath = `$.nodes.${toPathKey(nodeId)}.props`;
  const result = entry.propsSchema.safeParse(node.props ?? {});
  if (result.success) {
    if (!isRecord(result.data)) {
      diagnostics.push(
        diagnostic(
          "invalid_component_props",
          propsPath,
          `Component type '${entry.type}' Zod props schema must return an object.`,
          {
            nodeId,
            componentType: entry.type,
          },
        ),
      );
      return { ok: false };
    }

    return { ok: true, props: Object.freeze({ ...result.data }) };
  }

  for (const issue of result.error.issues) {
    const paths = getZodIssuePaths(issue, propsPath);

    for (const path of paths) {
      diagnostics.push(
        diagnostic(
          "invalid_component_props",
          path,
          `Component type '${entry.type}' props failed Zod validation: ${issue.message}`,
          {
            nodeId,
            componentType: entry.type,
          },
        ),
      );
    }
  }

  return { ok: false };
}

function verifyRuntimeReferences(
  nodeId: string,
  node: SchemaUINode,
  runtime: RuntimeCapabilityDescription,
  diagnostics: VerificationDiagnostic[],
): void {
  scanRuntimeReferences(node.props ?? {}, `$.nodes.${toPathKey(nodeId)}.props`, {
    diagnostics,
    nodeId,
    runtime,
  });
}

function scanRuntimeReferences(
  value: unknown,
  path: string,
  context: {
    diagnostics: VerificationDiagnostic[];
    nodeId: string;
    runtime: RuntimeCapabilityDescription;
  },
  key?: string,
): void {
  if (key && isRuntimeReferenceKey(key)) {
    validateRuntimeReference(value, path, key, context);
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      scanRuntimeReferences(item, `${path}[${index}]`, context);
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    scanRuntimeReferences(childValue, `${path}.${toPathKey(childKey)}`, context, childKey);
  }
}

function validateRuntimeReference(
  value: unknown,
  path: string,
  key: string,
  context: {
    diagnostics: VerificationDiagnostic[];
    nodeId: string;
    runtime: RuntimeCapabilityDescription;
  },
): void {
  const runtimeKind = getRuntimeReferenceKind(key);
  if (!runtimeKind) {
    return;
  }

  const code =
    runtimeKind === "action"
      ? "invalid_runtime_action"
      : runtimeKind === "dataRef"
        ? "invalid_runtime_data_ref"
        : "invalid_runtime_state_key";

  if (typeof value !== "string" || value.trim() === "") {
    context.diagnostics.push(
      diagnostic(code, path, `${key} must reference a non-empty runtime capability ID.`, {
        nodeId: context.nodeId,
      }),
    );
    return;
  }

  const capability = value.trim();
  const capabilitySet =
    runtimeKind === "action"
      ? context.runtime.actions
      : runtimeKind === "dataRef"
        ? context.runtime.dataRefs
        : (context.runtime.stateKeys ?? context.runtime.state);

  if (!hasCapability(capabilitySet, capability)) {
    context.diagnostics.push(
      diagnostic(code, path, `Runtime capability '${capability}' is not registered.`, {
        nodeId: context.nodeId,
        repair: {
          kind: "register_runtime_capability",
          path,
        },
      }),
    );
  }
}

function brandVerifiedSchemaUI(document: SchemaUIDocument): VerifiedSchemaUI {
  return Object.freeze({
    ...document,
    [verifiedSchemaUIBrand]: true,
  }) as VerifiedSchemaUI;
}

function cloneNodeMap(nodes: Record<string, SchemaUINode>): Record<string, SchemaUINode> {
  const clonedNodes: Record<string, SchemaUINode> = Object.create(null);

  for (const [nodeId, node] of Object.entries(nodes)) {
    clonedNodes[nodeId] = freezeNode(node);
  }

  return clonedNodes;
}

function freezeNode(node: SchemaUINode): SchemaUINode {
  return Object.freeze({
    type: node.type,
    ...(node.props ? { props: Object.freeze({ ...node.props }) } : {}),
    ...(node.children ? { children: Object.freeze([...node.children]) } : {}),
    ...(node.slots ? { slots: freezeSlots(node.slots) } : {}),
  }) as SchemaUINode;
}

function freezeSlots(slots: Record<string, string | string[]>): Record<string, string | string[]> {
  const frozenSlots: Record<string, string | string[]> = Object.create(null);

  for (const [slotName, slotValue] of Object.entries(slots)) {
    frozenSlots[slotName] = Array.isArray(slotValue)
      ? (Object.freeze([...slotValue]) as string[])
      : slotValue;
  }

  return Object.freeze(frozenSlots);
}

function hasCapability(
  capabilities: RuntimeCapabilitySet | undefined,
  capability: string,
): boolean {
  if (!capabilities) {
    return false;
  }

  if (Array.isArray(capabilities)) {
    return capabilities.includes(capability);
  }

  if (capabilities instanceof Set) {
    return capabilities.has(capability);
  }

  return Object.hasOwn(capabilities, capability);
}

function isRuntimeReferenceKey(key: string): boolean {
  return getRuntimeReferenceKind(key) !== undefined;
}

function getRuntimeReferenceKind(key: string): "action" | "dataRef" | "stateKey" | undefined {
  if (key === "actionId" || key.endsWith("ActionId")) {
    return "action";
  }

  if (key === "dataRef" || key.endsWith("DataRef")) {
    return "dataRef";
  }

  if (key === "stateKey" || key.endsWith("StateKey")) {
    return "stateKey";
  }

  return undefined;
}

function getZodIssuePaths(
  issue: {
    path: readonly unknown[];
    code?: unknown;
    keys?: unknown;
  },
  basePath: string,
): string[] {
  if (
    issue.code === "unrecognized_keys" &&
    Array.isArray(issue.keys) &&
    issue.keys.every((key) => typeof key === "string")
  ) {
    return issue.keys.map((key) => appendJsonPath(basePath, [...issue.path, key]));
  }

  return [appendJsonPath(basePath, issue.path)];
}

function appendJsonPath(basePath: string, path: readonly unknown[]): string {
  let currentPath = basePath;

  for (const segment of path) {
    if (typeof segment === "number") {
      currentPath = `${currentPath}[${segment}]`;
      continue;
    }

    if (typeof segment === "string") {
      currentPath = `${currentPath}.${toPathKey(segment)}`;
      continue;
    }

    currentPath = `${currentPath}.${toPathKey(String(segment))}`;
  }

  return currentPath;
}

function diagnostic(
  code: VerificationDiagnosticCode,
  path: string,
  message: string,
  extra: Partial<Omit<VerificationDiagnostic, "code" | "severity" | "path" | "message">> = {},
): VerificationDiagnostic {
  return Object.freeze({
    code,
    severity: "error" as const,
    path,
    message,
    ...extra,
  });
}

function fail(
  diagnostics: readonly (VerificationDiagnostic | SchemaUIDiagnostic)[],
): VerificationResult {
  return Object.freeze({
    ok: false,
    diagnostics: Object.freeze([...diagnostics]) as readonly VerificationDiagnostic[],
  });
}

function hasErrors(diagnostics: readonly { severity: DiagnosticSeverity }[]): boolean {
  return diagnostics.some((item) => item.severity === "error");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPathKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}
