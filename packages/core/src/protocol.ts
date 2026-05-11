export type SchemaUIVersion = "water.ui.v1";
export type SchemaUINodeId = string;

export type SchemaUIDiagnosticCode =
  | "invalid_json"
  | "invalid_protocol_input"
  | "invalid_protocol_kind"
  | "invalid_protocol_version"
  | "invalid_document_root"
  | "invalid_document_nodes"
  | "invalid_node"
  | "invalid_node_type"
  | "invalid_node_props"
  | "invalid_node_children"
  | "invalid_node_slots"
  | "invalid_patch_target"
  | "invalid_patch_ops"
  | "invalid_patch_operation"
  | "invalid_stream_seq"
  | "invalid_stream_event_kind"
  | "invalid_stream_event";

export type SchemaUIDiagnostic = {
  code: SchemaUIDiagnosticCode;
  severity: "error" | "warning";
  path: string;
  message: string;
};

export type SchemaUIParseResult<T> =
  | {
      ok: true;
      value: T;
      diagnostics: readonly SchemaUIDiagnostic[];
    }
  | {
      ok: false;
      value?: undefined;
      diagnostics: readonly SchemaUIDiagnostic[];
    };

export type SchemaUIDocument = {
  kind: "water.ui.document";
  version: SchemaUIVersion;
  root: SchemaUINodeId;
  nodes: Record<SchemaUINodeId, SchemaUINode>;
  meta?: Record<string, unknown>;
};

export type SchemaUINode = {
  type: string;
  props?: Record<string, unknown>;
  children?: SchemaUINodeId[];
  slots?: Record<string, SchemaUINodeId | SchemaUINodeId[]>;
};

export type SchemaUIPatch = {
  kind: "water.ui.patch";
  version: SchemaUIVersion;
  target: SchemaUINodeId;
  ops: SchemaUIPatchOperation[];
  meta?: Record<string, unknown>;
};

export type SchemaUIPatchOperation =
  | { op: "upsertNode"; id: SchemaUINodeId; node: SchemaUINode }
  | { op: "removeNode"; id: SchemaUINodeId }
  | { op: "replaceNode"; id: SchemaUINodeId; node: SchemaUINode }
  | { op: "updateProps"; id: SchemaUINodeId; props: Record<string, unknown> }
  | { op: "appendChild"; parent: SchemaUINodeId; child: SchemaUINodeId }
  | { op: "prependChild"; parent: SchemaUINodeId; child: SchemaUINodeId }
  | {
      op: "insertChildBefore";
      parent: SchemaUINodeId;
      before: SchemaUINodeId;
      child: SchemaUINodeId;
    }
  | {
      op: "insertChildAfter";
      parent: SchemaUINodeId;
      after: SchemaUINodeId;
      child: SchemaUINodeId;
    }
  | { op: "removeChild"; parent: SchemaUINodeId; child: SchemaUINodeId }
  | {
      op: "moveNode";
      id: SchemaUINodeId;
      parent?: SchemaUINodeId;
      before?: SchemaUINodeId;
      after?: SchemaUINodeId;
    }
  | { op: "replaceChildren"; parent: SchemaUINodeId; children: SchemaUINodeId[] }
  | {
      op: "setSlot";
      id: SchemaUINodeId;
      slot: string;
      value: SchemaUINodeId | SchemaUINodeId[];
    }
  | { op: "unsetSlot"; id: SchemaUINodeId; slot: string };

export type SchemaUIStreamEvent =
  | {
      seq: number;
      kind: "node.upsert";
      id: SchemaUINodeId;
      type: string;
      props?: Record<string, unknown>;
      children?: SchemaUINodeId[];
      slots?: Record<string, SchemaUINodeId | SchemaUINodeId[]>;
    }
  | { seq: number; kind: "node.remove"; id: SchemaUINodeId }
  | { seq: number; kind: "node.replace"; id: SchemaUINodeId; node: SchemaUINode }
  | { seq: number; kind: "node.props.update"; id: SchemaUINodeId; props: Record<string, unknown> }
  | { seq: number; kind: "child.append"; parent: SchemaUINodeId; child: SchemaUINodeId }
  | { seq: number; kind: "child.prepend"; parent: SchemaUINodeId; child: SchemaUINodeId }
  | {
      seq: number;
      kind: "child.insertBefore";
      parent: SchemaUINodeId;
      before: SchemaUINodeId;
      child: SchemaUINodeId;
    }
  | {
      seq: number;
      kind: "child.insertAfter";
      parent: SchemaUINodeId;
      after: SchemaUINodeId;
      child: SchemaUINodeId;
    }
  | { seq: number; kind: "child.remove"; parent: SchemaUINodeId; child: SchemaUINodeId }
  | {
      seq: number;
      kind: "slot.set";
      id: SchemaUINodeId;
      slot: string;
      value: SchemaUINodeId | SchemaUINodeId[];
    }
  | { seq: number; kind: "slot.unset"; id: SchemaUINodeId; slot: string }
  | { seq: number; kind: "done" };

const SCHEMA_UI_VERSION: SchemaUIVersion = "water.ui.v1";

export function parseSchemaUIDocument(input: unknown): SchemaUIParseResult<SchemaUIDocument> {
  const prepared = prepareProtocolInput(input);
  if (!prepared.ok) {
    return fail(prepared.diagnostics);
  }

  const diagnostics: SchemaUIDiagnostic[] = [];
  const raw = prepared.value;

  if (!isRecord(raw)) {
    diagnostics.push(
      diagnostic("invalid_protocol_input", "$", "Schema UI document must be an object."),
    );
    return fail(diagnostics);
  }

  validateKind(raw.kind, "water.ui.document", "$.kind", diagnostics);
  validateVersion(raw.version, "$.version", diagnostics);

  const root = parseNodeId(raw.root, "$.root", "invalid_document_root", diagnostics);
  const nodes = parseNodeMap(raw.nodes, "$.nodes", diagnostics);
  const meta =
    raw.meta === undefined ? undefined : parseOptionalRecord(raw.meta, "$.meta", diagnostics);

  if (hasErrors(diagnostics) || root === undefined || nodes === undefined) {
    return fail(diagnostics);
  }

  return succeed(
    freezeDocument({ kind: "water.ui.document", version: SCHEMA_UI_VERSION, root, nodes, meta }),
  );
}

export function normalizeSchemaUIDocument(input: unknown): SchemaUIParseResult<SchemaUIDocument> {
  const parsed = parseSchemaUIDocument(input);
  if (!parsed.ok) {
    return parsed;
  }

  const nodeIds = Object.keys(parsed.value.nodes).sort();
  const nodes: Record<string, SchemaUINode> = Object.create(null);

  for (const nodeId of nodeIds) {
    const node = parsed.value.nodes[nodeId];
    nodes[nodeId] = freezeNode({
      type: node.type,
      props: node.props,
      children: node.children ? [...node.children] : undefined,
      slots: node.slots ? normalizeSlots(node.slots) : undefined,
    });
  }

  return succeed(
    freezeDocument({
      kind: "water.ui.document",
      version: SCHEMA_UI_VERSION,
      root: parsed.value.root,
      nodes,
      meta: parsed.value.meta,
    }),
  );
}

export function parseSchemaUIPatch(input: unknown): SchemaUIParseResult<SchemaUIPatch> {
  const prepared = prepareProtocolInput(input);
  if (!prepared.ok) {
    return fail(prepared.diagnostics);
  }

  const diagnostics: SchemaUIDiagnostic[] = [];
  const raw = prepared.value;

  if (!isRecord(raw)) {
    diagnostics.push(
      diagnostic("invalid_protocol_input", "$", "Schema UI patch must be an object."),
    );
    return fail(diagnostics);
  }

  validateKind(raw.kind, "water.ui.patch", "$.kind", diagnostics);
  validateVersion(raw.version, "$.version", diagnostics);

  const target = parseNodeId(raw.target, "$.target", "invalid_patch_target", diagnostics);
  const ops = parsePatchOperations(raw.ops, "$.ops", diagnostics);
  const meta =
    raw.meta === undefined ? undefined : parseOptionalRecord(raw.meta, "$.meta", diagnostics);

  if (hasErrors(diagnostics) || target === undefined || ops === undefined) {
    return fail(diagnostics);
  }

  return succeed(
    Object.freeze({
      kind: "water.ui.patch",
      version: SCHEMA_UI_VERSION,
      target,
      ops: Object.freeze(ops),
      ...(meta ? { meta: Object.freeze({ ...meta }) } : {}),
    }) as SchemaUIPatch,
  );
}

export function parseSchemaUIStreamEvent(input: unknown): SchemaUIParseResult<SchemaUIStreamEvent> {
  const prepared = prepareProtocolInput(input);
  if (!prepared.ok) {
    return fail(prepared.diagnostics);
  }

  const diagnostics: SchemaUIDiagnostic[] = [];
  const raw = prepared.value;

  if (!isRecord(raw)) {
    diagnostics.push(
      diagnostic("invalid_protocol_input", "$", "Schema UI stream event must be an object."),
    );
    return fail(diagnostics);
  }

  const seq = parseSequence(raw.seq, "$.seq", diagnostics);
  if (typeof raw.kind !== "string" || raw.kind.trim() === "") {
    diagnostics.push(
      diagnostic(
        "invalid_stream_event_kind",
        "$.kind",
        "Stream event kind must be a non-empty string.",
      ),
    );
    return fail(diagnostics);
  }

  const kind = raw.kind.trim();
  const event = parseStreamEventByKind(seq, kind, raw, "$", diagnostics);

  if (hasErrors(diagnostics) || event === undefined) {
    return fail(diagnostics);
  }

  return succeed(Object.freeze(event) as SchemaUIStreamEvent);
}

function prepareProtocolInput(input: unknown): SchemaUIParseResult<unknown> {
  if (typeof input !== "string") {
    return succeed(input);
  }

  try {
    return succeed(JSON.parse(input) as unknown);
  } catch {
    return fail([
      diagnostic("invalid_json", "$", "Protocol input string must contain valid JSON."),
    ]);
  }
}

function parseNodeMap(
  input: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): Record<string, SchemaUINode> | undefined {
  if (!isRecord(input)) {
    diagnostics.push(
      diagnostic("invalid_document_nodes", path, "Document nodes must be an object map."),
    );
    return undefined;
  }

  const nodes: Record<string, SchemaUINode> = Object.create(null);

  for (const [rawNodeId, rawNode] of Object.entries(input)) {
    const nodeId = rawNodeId.trim();
    const nodePath = `${path}.${toPathKey(rawNodeId)}`;

    if (nodeId === "") {
      diagnostics.push(
        diagnostic("invalid_document_nodes", nodePath, "Document node IDs must be non-empty."),
      );
      continue;
    }

    const node = parseNode(rawNode, nodePath, diagnostics);
    if (node) {
      nodes[nodeId] = node;
    }
  }

  return Object.freeze(nodes);
}

function parseNode(
  input: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): SchemaUINode | undefined {
  if (!isRecord(input)) {
    diagnostics.push(diagnostic("invalid_node", path, "Schema UI nodes must be objects."));
    return undefined;
  }

  const type = parseNonEmptyString(
    input.type,
    `${path}.type`,
    "invalid_node_type",
    "Node type",
    diagnostics,
  );
  const props =
    input.props === undefined
      ? undefined
      : parseOptionalRecord(input.props, `${path}.props`, diagnostics);
  const children =
    input.children === undefined
      ? undefined
      : parseNodeIdArray(input.children, `${path}.children`, "invalid_node_children", diagnostics);
  const slots =
    input.slots === undefined ? undefined : parseSlots(input.slots, `${path}.slots`, diagnostics);

  if (
    type === undefined ||
    (input.props !== undefined && props === undefined) ||
    (input.children !== undefined && children === undefined) ||
    (input.slots !== undefined && slots === undefined)
  ) {
    return undefined;
  }

  return freezeNode({ type, props, children, slots });
}

function parseSlots(
  input: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): Record<string, string | string[]> | undefined {
  if (!isRecord(input)) {
    diagnostics.push(diagnostic("invalid_node_slots", path, "Node slots must be an object map."));
    return undefined;
  }

  const slots: Record<string, string | string[]> = Object.create(null);

  for (const [rawSlotName, rawSlotValue] of Object.entries(input)) {
    const slotName = rawSlotName.trim();
    const slotPath = `${path}.${toPathKey(rawSlotName)}`;

    if (slotName === "") {
      diagnostics.push(diagnostic("invalid_node_slots", slotPath, "Slot names must be non-empty."));
      continue;
    }

    if (typeof rawSlotValue === "string") {
      const value = rawSlotValue.trim();
      if (value === "") {
        diagnostics.push(
          diagnostic("invalid_node_slots", slotPath, "Slot node IDs must be non-empty."),
        );
        continue;
      }
      slots[slotName] = value;
      continue;
    }

    const values = parseNodeIdArray(rawSlotValue, slotPath, "invalid_node_slots", diagnostics);
    if (values) {
      slots[slotName] = values;
    }
  }

  return Object.freeze(slots);
}

function parsePatchOperations(
  input: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): SchemaUIPatchOperation[] | undefined {
  if (!Array.isArray(input)) {
    diagnostics.push(diagnostic("invalid_patch_ops", path, "Patch ops must be an array."));
    return undefined;
  }

  const ops: SchemaUIPatchOperation[] = [];

  input.forEach((rawOperation, index) => {
    const operation = parsePatchOperation(rawOperation, `${path}[${index}]`, diagnostics);
    if (operation) {
      ops.push(operation);
    }
  });

  return ops;
}

function parsePatchOperation(
  input: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): SchemaUIPatchOperation | undefined {
  if (!isRecord(input)) {
    diagnostics.push(
      diagnostic("invalid_patch_operation", path, "Patch operations must be objects."),
    );
    return undefined;
  }

  if (typeof input.op !== "string" || input.op.trim() === "") {
    diagnostics.push(
      diagnostic(
        "invalid_patch_operation",
        `${path}.op`,
        "Patch operation op must be a non-empty string.",
      ),
    );
    return undefined;
  }

  const op = input.op.trim();

  switch (op) {
    case "upsertNode":
    case "replaceNode": {
      const id = parsePatchNodeId(input.id, `${path}.id`, diagnostics);
      const node = parseNode(input.node, `${path}.node`, diagnostics);
      return id && node ? Object.freeze({ op, id, node }) : undefined;
    }

    case "removeNode": {
      const id = parsePatchNodeId(input.id, `${path}.id`, diagnostics);
      return id ? Object.freeze({ op, id }) : undefined;
    }

    case "updateProps": {
      const id = parsePatchNodeId(input.id, `${path}.id`, diagnostics);
      const props = parseOptionalRecord(input.props, `${path}.props`, diagnostics);
      return id && props
        ? Object.freeze({ op, id, props: Object.freeze({ ...props }) })
        : undefined;
    }

    case "appendChild":
    case "prependChild":
    case "removeChild": {
      const parent = parsePatchNodeId(input.parent, `${path}.parent`, diagnostics);
      const child = parsePatchNodeId(input.child, `${path}.child`, diagnostics);
      return parent && child ? Object.freeze({ op, parent, child }) : undefined;
    }

    case "insertChildBefore": {
      const parent = parsePatchNodeId(input.parent, `${path}.parent`, diagnostics);
      const before = parsePatchNodeId(input.before, `${path}.before`, diagnostics);
      const child = parsePatchNodeId(input.child, `${path}.child`, diagnostics);
      return parent && before && child ? Object.freeze({ op, parent, before, child }) : undefined;
    }

    case "insertChildAfter": {
      const parent = parsePatchNodeId(input.parent, `${path}.parent`, diagnostics);
      const after = parsePatchNodeId(input.after, `${path}.after`, diagnostics);
      const child = parsePatchNodeId(input.child, `${path}.child`, diagnostics);
      return parent && after && child ? Object.freeze({ op, parent, after, child }) : undefined;
    }

    case "moveNode": {
      const id = parsePatchNodeId(input.id, `${path}.id`, diagnostics);
      const parent =
        input.parent === undefined
          ? undefined
          : parsePatchNodeId(input.parent, `${path}.parent`, diagnostics);
      const before =
        input.before === undefined
          ? undefined
          : parsePatchNodeId(input.before, `${path}.before`, diagnostics);
      const after =
        input.after === undefined
          ? undefined
          : parsePatchNodeId(input.after, `${path}.after`, diagnostics);

      return id && noFailedOptionalNodeIds(input, { parent, before, after })
        ? Object.freeze({
            op,
            id,
            ...(parent ? { parent } : {}),
            ...(before ? { before } : {}),
            ...(after ? { after } : {}),
          })
        : undefined;
    }

    case "replaceChildren": {
      const parent = parsePatchNodeId(input.parent, `${path}.parent`, diagnostics);
      const children = parseNodeIdArray(
        input.children,
        `${path}.children`,
        "invalid_patch_operation",
        diagnostics,
      );
      return parent && children ? Object.freeze({ op, parent, children }) : undefined;
    }

    case "setSlot": {
      const id = parsePatchNodeId(input.id, `${path}.id`, diagnostics);
      const slot = parseNonEmptyString(
        input.slot,
        `${path}.slot`,
        "invalid_patch_operation",
        "Slot name",
        diagnostics,
      );
      const value = parseSlotValue(
        input.value,
        `${path}.value`,
        "invalid_patch_operation",
        diagnostics,
      );
      return id && slot && value ? Object.freeze({ op, id, slot, value }) : undefined;
    }

    case "unsetSlot": {
      const id = parsePatchNodeId(input.id, `${path}.id`, diagnostics);
      const slot = parseNonEmptyString(
        input.slot,
        `${path}.slot`,
        "invalid_patch_operation",
        "Slot name",
        diagnostics,
      );
      return id && slot ? Object.freeze({ op, id, slot }) : undefined;
    }

    default:
      diagnostics.push(
        diagnostic("invalid_patch_operation", `${path}.op`, `Unsupported patch operation '${op}'.`),
      );
      return undefined;
  }
}

function parseStreamEventByKind(
  seq: number | undefined,
  kind: string,
  raw: Record<string, unknown>,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): SchemaUIStreamEvent | undefined {
  if (seq === undefined) {
    return undefined;
  }

  switch (kind) {
    case "node.upsert": {
      const id = parseStreamNodeId(raw.id, `${path}.id`, diagnostics);
      const type = parseNonEmptyString(
        raw.type,
        `${path}.type`,
        "invalid_stream_event",
        "Node type",
        diagnostics,
      );
      const props =
        raw.props === undefined
          ? undefined
          : parseOptionalRecord(raw.props, `${path}.props`, diagnostics);
      const children =
        raw.children === undefined
          ? undefined
          : parseNodeIdArray(raw.children, `${path}.children`, "invalid_stream_event", diagnostics);
      const slots =
        raw.slots === undefined ? undefined : parseSlots(raw.slots, `${path}.slots`, diagnostics);

      if (
        !id ||
        !type ||
        (raw.props !== undefined && props === undefined) ||
        (raw.children !== undefined && children === undefined) ||
        (raw.slots !== undefined && slots === undefined)
      ) {
        return undefined;
      }

      return {
        seq,
        kind,
        id,
        type,
        ...(props ? { props } : {}),
        ...(children ? { children } : {}),
        ...(slots ? { slots } : {}),
      };
    }

    case "node.remove": {
      const id = parseStreamNodeId(raw.id, `${path}.id`, diagnostics);
      return id ? { seq, kind, id } : undefined;
    }

    case "node.replace": {
      const id = parseStreamNodeId(raw.id, `${path}.id`, diagnostics);
      const node = parseNode(raw.node, `${path}.node`, diagnostics);
      return id && node ? { seq, kind, id, node } : undefined;
    }

    case "node.props.update": {
      const id = parseStreamNodeId(raw.id, `${path}.id`, diagnostics);
      const props = parseOptionalRecord(raw.props, `${path}.props`, diagnostics);
      return id && props ? { seq, kind, id, props: Object.freeze({ ...props }) } : undefined;
    }

    case "child.append":
    case "child.prepend":
    case "child.remove": {
      const parent = parseStreamNodeId(raw.parent, `${path}.parent`, diagnostics);
      const child = parseStreamNodeId(raw.child, `${path}.child`, diagnostics);
      return parent && child ? { seq, kind, parent, child } : undefined;
    }

    case "child.insertBefore": {
      const parent = parseStreamNodeId(raw.parent, `${path}.parent`, diagnostics);
      const before = parseStreamNodeId(raw.before, `${path}.before`, diagnostics);
      const child = parseStreamNodeId(raw.child, `${path}.child`, diagnostics);
      return parent && before && child ? { seq, kind, parent, before, child } : undefined;
    }

    case "child.insertAfter": {
      const parent = parseStreamNodeId(raw.parent, `${path}.parent`, diagnostics);
      const after = parseStreamNodeId(raw.after, `${path}.after`, diagnostics);
      const child = parseStreamNodeId(raw.child, `${path}.child`, diagnostics);
      return parent && after && child ? { seq, kind, parent, after, child } : undefined;
    }

    case "slot.set": {
      const id = parseStreamNodeId(raw.id, `${path}.id`, diagnostics);
      const slot = parseNonEmptyString(
        raw.slot,
        `${path}.slot`,
        "invalid_stream_event",
        "Slot name",
        diagnostics,
      );
      const value = parseSlotValue(raw.value, `${path}.value`, "invalid_stream_event", diagnostics);
      return id && slot && value ? { seq, kind, id, slot, value } : undefined;
    }

    case "slot.unset": {
      const id = parseStreamNodeId(raw.id, `${path}.id`, diagnostics);
      const slot = parseNonEmptyString(
        raw.slot,
        `${path}.slot`,
        "invalid_stream_event",
        "Slot name",
        diagnostics,
      );
      return id && slot ? { seq, kind, id, slot } : undefined;
    }

    case "done":
      return { seq, kind };

    default:
      diagnostics.push(
        diagnostic(
          "invalid_stream_event_kind",
          "$.kind",
          `Unsupported stream event kind '${kind}'.`,
        ),
      );
      return undefined;
  }
}

function validateKind(
  value: unknown,
  expected: "water.ui.document" | "water.ui.patch",
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): void {
  if (value !== expected) {
    diagnostics.push(
      diagnostic("invalid_protocol_kind", path, `Protocol kind must be '${expected}'.`),
    );
  }
}

function validateVersion(value: unknown, path: string, diagnostics: SchemaUIDiagnostic[]): void {
  if (value !== SCHEMA_UI_VERSION) {
    diagnostics.push(
      diagnostic(
        "invalid_protocol_version",
        path,
        `Protocol version must be '${SCHEMA_UI_VERSION}'.`,
      ),
    );
  }
}

function parseSequence(
  value: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): number | undefined {
  if (!Number.isInteger(value) || Number(value) < 0) {
    diagnostics.push(
      diagnostic("invalid_stream_seq", path, "Stream event seq must be a non-negative integer."),
    );
    return undefined;
  }

  return Number(value);
}

function parseNodeId(
  value: unknown,
  path: string,
  code: SchemaUIDiagnosticCode,
  diagnostics: SchemaUIDiagnostic[],
): string | undefined {
  return parseNonEmptyString(value, path, code, "Node ID", diagnostics);
}

function parsePatchNodeId(
  value: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): string | undefined {
  return parseNodeId(value, path, "invalid_patch_operation", diagnostics);
}

function parseStreamNodeId(
  value: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): string | undefined {
  return parseNodeId(value, path, "invalid_stream_event", diagnostics);
}

function parseNonEmptyString(
  value: unknown,
  path: string,
  code: SchemaUIDiagnosticCode,
  label: string,
  diagnostics: SchemaUIDiagnostic[],
): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    diagnostics.push(diagnostic(code, path, `${label} must be a non-empty string.`));
    return undefined;
  }

  return value.trim();
}

function parseNodeIdArray(
  value: unknown,
  path: string,
  code: SchemaUIDiagnosticCode,
  diagnostics: SchemaUIDiagnostic[],
): string[] | undefined {
  if (!Array.isArray(value)) {
    diagnostics.push(diagnostic(code, path, "Expected an array of node IDs."));
    return undefined;
  }

  const nodeIds: string[] = [];

  value.forEach((item, index) => {
    const nodeId = parseNodeId(item, `${path}[${index}]`, code, diagnostics);
    if (nodeId) {
      nodeIds.push(nodeId);
    }
  });

  return Object.freeze(nodeIds) as string[];
}

function parseSlotValue(
  value: unknown,
  path: string,
  code: SchemaUIDiagnosticCode,
  diagnostics: SchemaUIDiagnostic[],
): string | string[] | undefined {
  if (typeof value === "string") {
    return parseNodeId(value, path, code, diagnostics);
  }

  return parseNodeIdArray(value, path, code, diagnostics);
}

function parseOptionalRecord(
  value: unknown,
  path: string,
  diagnostics: SchemaUIDiagnostic[],
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    diagnostics.push(diagnostic("invalid_node_props", path, "Expected an object."));
    return undefined;
  }

  return Object.freeze({ ...value });
}

function noFailedOptionalNodeIds(
  input: Record<string, unknown>,
  values: { parent?: string; before?: string; after?: string },
): boolean {
  return (
    (input.parent === undefined || values.parent !== undefined) &&
    (input.before === undefined || values.before !== undefined) &&
    (input.after === undefined || values.after !== undefined)
  );
}

function normalizeSlots(
  slots: Record<string, string | string[]>,
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = Object.create(null);

  for (const slotName of Object.keys(slots).sort()) {
    const value = slots[slotName];
    normalized[slotName] = Array.isArray(value) ? (Object.freeze([...value]) as string[]) : value;
  }

  return Object.freeze(normalized);
}

function freezeDocument(document: {
  kind: "water.ui.document";
  version: SchemaUIVersion;
  root: string;
  nodes: Record<string, SchemaUINode>;
  meta?: Record<string, unknown>;
}): SchemaUIDocument {
  return Object.freeze({
    kind: document.kind,
    version: document.version,
    root: document.root,
    nodes: Object.freeze({ ...document.nodes }),
    ...(document.meta ? { meta: Object.freeze({ ...document.meta }) } : {}),
  });
}

function freezeNode(node: {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  slots?: Record<string, string | string[]>;
}): SchemaUINode {
  return Object.freeze({
    type: node.type,
    ...(node.props ? { props: Object.freeze({ ...node.props }) } : {}),
    ...(node.children ? { children: Object.freeze([...node.children]) } : {}),
    ...(node.slots ? { slots: normalizeSlots(node.slots) } : {}),
  }) as SchemaUINode;
}

function diagnostic(
  code: SchemaUIDiagnosticCode,
  path: string,
  message: string,
): SchemaUIDiagnostic {
  return Object.freeze({
    code,
    severity: "error",
    path,
    message,
  });
}

function succeed<T>(
  value: T,
  diagnostics: readonly SchemaUIDiagnostic[] = [],
): SchemaUIParseResult<T> {
  return Object.freeze({
    ok: true,
    value,
    diagnostics: Object.freeze([...diagnostics]),
  });
}

function fail<T>(diagnostics: readonly SchemaUIDiagnostic[]): SchemaUIParseResult<T> {
  return Object.freeze({
    ok: false,
    diagnostics: Object.freeze([...diagnostics]),
  });
}

function hasErrors(diagnostics: readonly SchemaUIDiagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === "error");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPathKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}
