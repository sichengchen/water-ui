import {
  parseSchemaUIStreamEvent,
  type SchemaUIDocument,
  type SchemaUINode,
  type SchemaUIStreamEvent,
} from "./protocol.js";
import {
  verifyDocument,
  type RuntimeCapabilityDescription,
  type VerificationDiagnostic,
  type VerificationDiagnosticCode,
  type VerifiedSchemaUI,
} from "./verification.js";
import type { WasserRegistry } from "./index.js";

export type StreamDiagnosticCode =
  | "duplicate_stream_seq"
  | "buffered_stream_reference"
  | "invalid_stream_reference"
  | "invalid_stream_root"
  | VerificationDiagnosticCode;

export type StreamDiagnostic = {
  code: StreamDiagnosticCode;
  severity: "error" | "warning";
  path: string;
  message: string;
  seq?: number;
  nodeId?: string;
  componentType?: string;
};

export type StreamState = {
  readonly root?: string;
  readonly document: SchemaUIDocument;
  readonly ui?: VerifiedSchemaUI;
  readonly done: boolean;
  readonly diagnostics: readonly StreamDiagnostic[];
  readonly bufferedEvents: readonly SchemaUIStreamEvent[];
  readonly seenSeq: ReadonlySet<number>;
};

export type CreateStreamStateOptions = {
  root?: string;
};

export type StreamEngineOptions = {
  registry: WasserRegistry;
  runtime?: RuntimeCapabilityDescription;
};

export type StreamEventResult = {
  state: StreamState;
  event?: SchemaUIStreamEvent;
  ui?: VerifiedSchemaUI;
  diagnostics: readonly StreamDiagnostic[];
  buffered: boolean;
};

type MutableStreamState = {
  root?: string;
  document: SchemaUIDocument;
  ui?: VerifiedSchemaUI;
  done: boolean;
  diagnostics: StreamDiagnostic[];
  bufferedEvents: SchemaUIStreamEvent[];
  seenSeq: Set<number>;
};

export const parseStreamEvent = parseSchemaUIStreamEvent;

export function createStreamState(options: CreateStreamStateOptions = {}): StreamState {
  return toPublicState({
    root: options.root,
    document: createDocument(options.root),
    done: false,
    diagnostics: [],
    bufferedEvents: [],
    seenSeq: new Set(),
  });
}

export function applyStreamEvent(
  state: StreamState,
  eventInput: unknown,
  options: StreamEngineOptions,
): StreamEventResult {
  const mutable = toMutableState(state);
  const parsed = parseSchemaUIStreamEvent(eventInput);
  if (!parsed.ok) {
    const diagnostics = parsed.diagnostics.map((item) =>
      diagnostic(item.code as StreamDiagnosticCode, item.path, item.message),
    );
    mutable.diagnostics.push(...diagnostics);
    return result(mutable, undefined, diagnostics, false);
  }

  const event = parsed.value;
  if (mutable.seenSeq.has(event.seq)) {
    const diagnostics = [
      diagnostic(
        "duplicate_stream_seq",
        "$.seq",
        `Stream event seq '${event.seq}' has already been processed.`,
        {
          seq: event.seq,
        },
      ),
    ];
    mutable.diagnostics.push(...diagnostics);
    return result(mutable, event, diagnostics, false);
  }

  mutable.seenSeq.add(event.seq);

  if (event.kind === "done") {
    mutable.done = true;
    const diagnostics = flushBufferedEvents(mutable, options);
    const verificationDiagnostics = verifyCurrentState(mutable, options, true);
    const nextDiagnostics = [...diagnostics, ...verificationDiagnostics];
    mutable.diagnostics.push(...nextDiagnostics);
    return result(mutable, event, nextDiagnostics, false);
  }

  const diagnostics = applyEventOrBuffer(mutable, event, options);
  const buffered = mutable.bufferedEvents.includes(event);
  if (!buffered) {
    diagnostics.push(...flushBufferedEvents(mutable, options));
    verifyCurrentState(mutable, options, false);
  }

  mutable.diagnostics.push(...diagnostics);
  return result(mutable, event, diagnostics, buffered);
}

export function finalizeStreamState(
  state: StreamState,
  options: StreamEngineOptions,
): StreamEventResult {
  return applyStreamEvent(
    state,
    {
      seq: getNextSeq(state),
      kind: "done",
    },
    options,
  );
}

function applyEventOrBuffer(
  state: MutableStreamState,
  event: SchemaUIStreamEvent,
  options: StreamEngineOptions,
): StreamDiagnostic[] {
  switch (event.kind) {
    case "node.upsert": {
      const nodeDiagnostics = verifyNodeEvent(event.id, event, options);
      if (nodeDiagnostics.length > 0) {
        return nodeDiagnostics;
      }

      if (!state.root) {
        state.root = event.id;
        state.document.root = event.id;
      }

      state.document.nodes[event.id] = cloneNode({
        type: event.type,
        ...(event.props ? { props: event.props } : {}),
        ...(event.children ? { children: event.children } : {}),
        ...(event.slots ? { slots: event.slots } : {}),
      });
      verifyCurrentState(state, options, false);
      return [];
    }

    case "node.replace": {
      if (!state.document.nodes[event.id]) {
        return bufferEvent(state, event, `Node '${event.id}' does not exist yet.`);
      }

      const nodeDiagnostics = verifyNodeEvent(event.id, event.node, options);
      if (nodeDiagnostics.length > 0) {
        return nodeDiagnostics;
      }

      state.document.nodes[event.id] = cloneNode(event.node);
      verifyCurrentState(state, options, false);
      return [];
    }

    case "node.remove": {
      if (!state.document.nodes[event.id]) {
        return [
          diagnostic(
            "invalid_stream_reference",
            "$.id",
            `Stream event references missing node '${event.id}'.`,
            {
              seq: event.seq,
              nodeId: event.id,
            },
          ),
        ];
      }

      delete state.document.nodes[event.id];
      removeNodeReferences(state.document, event.id);
      if (state.root === event.id) {
        state.root = undefined;
        state.document.root = "";
        state.ui = undefined;
      } else {
        verifyCurrentState(state, options, false);
      }
      return [];
    }

    case "node.props.update": {
      const node = state.document.nodes[event.id];
      if (!node) {
        return bufferEvent(state, event, `Node '${event.id}' does not exist yet.`);
      }

      const previousProps = node.props;
      node.props = {
        ...node.props,
        ...event.props,
      };
      const diagnostics = verifyNodeEvent(event.id, node, options);
      if (diagnostics.length > 0) {
        node.props = previousProps;
        verifyCurrentState(state, options, false);
        return diagnostics;
      }
      verifyCurrentState(state, options, false);
      return [];
    }

    case "child.append":
    case "child.prepend":
    case "child.insertBefore":
    case "child.insertAfter":
    case "child.remove": {
      if (!state.document.nodes[event.parent] || !state.document.nodes[event.child]) {
        return bufferEvent(
          state,
          event,
          `Parent '${event.parent}' or child '${event.child}' does not exist yet.`,
        );
      }

      return applyChildEvent(state, event, options);
    }

    case "slot.set": {
      const references = Array.isArray(event.value) ? event.value : [event.value];
      if (
        !state.document.nodes[event.id] ||
        references.some((nodeId) => !state.document.nodes[nodeId])
      ) {
        return bufferEvent(
          state,
          event,
          `Slot node references for '${event.id}' are not ready yet.`,
        );
      }

      const node = state.document.nodes[event.id];
      node.slots = {
        ...node.slots,
        [event.slot]: Array.isArray(event.value) ? [...event.value] : event.value,
      };
      const diagnostics = verifyCurrentState(state, options, false);
      return diagnostics;
    }

    case "slot.unset": {
      const node = state.document.nodes[event.id];
      if (!node) {
        return bufferEvent(state, event, `Node '${event.id}' does not exist yet.`);
      }

      const slots = { ...node.slots };
      delete slots[event.slot];
      node.slots = slots;
      verifyCurrentState(state, options, false);
      return [];
    }

    case "done":
      return [];
  }
}

function applyChildEvent(
  state: MutableStreamState,
  event: Extract<
    SchemaUIStreamEvent,
    {
      kind:
        | "child.append"
        | "child.prepend"
        | "child.insertBefore"
        | "child.insertAfter"
        | "child.remove";
    }
  >,
  options: StreamEngineOptions,
): StreamDiagnostic[] {
  const parent = state.document.nodes[event.parent];
  const children = [...(parent.children ?? [])];

  switch (event.kind) {
    case "child.append":
      parent.children = [...children, event.child];
      break;
    case "child.prepend":
      parent.children = [event.child, ...children];
      break;
    case "child.remove":
      parent.children = children.filter((childId) => childId !== event.child);
      break;
    case "child.insertBefore": {
      const index = children.indexOf(event.before);
      if (index === -1) {
        return bufferEvent(state, event, `Sibling '${event.before}' does not exist yet.`);
      }
      children.splice(index, 0, event.child);
      parent.children = children;
      break;
    }
    case "child.insertAfter": {
      const index = children.indexOf(event.after);
      if (index === -1) {
        return bufferEvent(state, event, `Sibling '${event.after}' does not exist yet.`);
      }
      children.splice(index + 1, 0, event.child);
      parent.children = children;
      break;
    }
  }

  const diagnostics = verifyCurrentState(state, options, false);
  return diagnostics;
}

function flushBufferedEvents(
  state: MutableStreamState,
  options: StreamEngineOptions,
): StreamDiagnostic[] {
  const diagnostics: StreamDiagnostic[] = [];
  let progressed = true;

  while (progressed && state.bufferedEvents.length > 0) {
    progressed = false;
    const pending = state.bufferedEvents;
    state.bufferedEvents = [];

    for (const bufferedEvent of pending) {
      const eventDiagnostics = applyEventOrBuffer(state, bufferedEvent, options);
      const wasBufferedAgain = state.bufferedEvents.some(
        (event) => event.seq === bufferedEvent.seq,
      );
      if (!wasBufferedAgain && eventDiagnostics.length === 0) {
        progressed = true;
      } else if (!wasBufferedAgain) {
        diagnostics.push(...eventDiagnostics);
      }
    }
  }

  return diagnostics;
}

function bufferEvent(
  state: MutableStreamState,
  event: SchemaUIStreamEvent,
  message: string,
): StreamDiagnostic[] {
  if (!state.bufferedEvents.some((item) => item.seq === event.seq)) {
    state.bufferedEvents.push(event);
  }

  return [
    diagnostic("buffered_stream_reference", "$", message, {
      seq: event.seq,
      severity: "warning",
    }),
  ];
}

function verifyCurrentState(
  state: MutableStreamState,
  options: StreamEngineOptions,
  requireComplete: boolean,
): StreamDiagnostic[] {
  if (!state.root || !state.document.nodes[state.root]) {
    if (!requireComplete) {
      state.ui = undefined;
      return [];
    }

    state.ui = undefined;
    return [
      diagnostic("invalid_stream_root", "$.root", "Stream must contain a root node before done."),
    ];
  }

  const document = requireComplete ? state.document : createReachableDocument(state.document);
  const verification = verifyDocument(document, {
    registry: options.registry,
    runtime: options.runtime,
  });
  if (verification.ok) {
    state.ui = verification.ui;
    return [];
  }

  state.ui = undefined;
  return verification.diagnostics.map(fromVerificationDiagnostic);
}

function verifyNodeEvent(
  nodeId: string,
  node: SchemaUINode,
  options: StreamEngineOptions,
): StreamDiagnostic[] {
  const verification = verifyDocument(
    {
      kind: "wasser.ui.document",
      version: "wasser.ui.v1",
      root: nodeId,
      nodes: {
        [nodeId]: {
          type: node.type,
          ...(node.props ? { props: node.props } : {}),
        },
      },
    },
    {
      registry: options.registry,
      runtime: options.runtime,
    },
  );

  return verification.ok ? [] : verification.diagnostics.map(fromVerificationDiagnostic);
}

function createReachableDocument(document: SchemaUIDocument): SchemaUIDocument {
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

  visit(document.root);

  return {
    kind: "wasser.ui.document",
    version: document.version,
    root: document.root,
    nodes: Object.fromEntries(
      [...reachable].map((nodeId) => [nodeId, cloneNode(document.nodes[nodeId])]),
    ),
    ...(document.meta ? { meta: cloneRecord(document.meta) } : {}),
  };
}

function createDocument(root?: string): SchemaUIDocument {
  return {
    kind: "wasser.ui.document",
    version: "wasser.ui.v1",
    root: root ?? "",
    nodes: {},
  };
}

function toMutableState(state: StreamState): MutableStreamState {
  return {
    root: state.root,
    document: cloneDocument(state.document),
    ui: state.ui,
    done: state.done,
    diagnostics: [...state.diagnostics],
    bufferedEvents: [...state.bufferedEvents],
    seenSeq: new Set(state.seenSeq),
  };
}

function toPublicState(state: MutableStreamState): StreamState {
  const document = freezeDocument(state.document);
  return Object.freeze({
    ...(state.root ? { root: state.root } : {}),
    document,
    ...(state.ui ? { ui: state.ui } : {}),
    done: state.done,
    diagnostics: Object.freeze([...state.diagnostics]),
    bufferedEvents: Object.freeze([...state.bufferedEvents]),
    seenSeq: new Set(state.seenSeq),
  });
}

function result(
  state: MutableStreamState,
  event: SchemaUIStreamEvent | undefined,
  diagnostics: readonly StreamDiagnostic[],
  buffered: boolean,
): StreamEventResult {
  const publicState = toPublicState(state);
  return Object.freeze({
    state: publicState,
    ...(event ? { event } : {}),
    ...(publicState.ui ? { ui: publicState.ui } : {}),
    diagnostics: Object.freeze([...diagnostics]),
    buffered,
  });
}

function cloneDocument(document: SchemaUIDocument): SchemaUIDocument {
  return {
    kind: "wasser.ui.document",
    version: document.version,
    root: document.root,
    nodes: Object.fromEntries(
      Object.entries(document.nodes).map(([nodeId, node]) => [nodeId, cloneNode(node)]),
    ),
    ...(document.meta ? { meta: cloneRecord(document.meta) } : {}),
  };
}

function cloneNode(node: SchemaUINode): SchemaUINode {
  return {
    type: node.type,
    ...(node.props ? { props: cloneRecord(node.props) } : {}),
    ...(node.children ? { children: [...node.children] } : {}),
    ...(node.slots ? { slots: cloneSlots(node.slots) } : {}),
  };
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
}

function cloneSlots(slots: Record<string, string | string[]>): Record<string, string | string[]> {
  return Object.fromEntries(
    Object.entries(slots).map(([slotName, slotValue]) => [
      slotName,
      Array.isArray(slotValue) ? [...slotValue] : slotValue,
    ]),
  );
}

function freezeDocument(document: SchemaUIDocument): SchemaUIDocument {
  return Object.freeze({
    kind: document.kind,
    version: document.version,
    root: document.root,
    nodes: Object.freeze(
      Object.fromEntries(
        Object.entries(document.nodes).map(([nodeId, node]) => [
          nodeId,
          Object.freeze(cloneNode(node)),
        ]),
      ),
    ),
    ...(document.meta ? { meta: Object.freeze(cloneRecord(document.meta)) } : {}),
  });
}

function removeNodeReferences(document: SchemaUIDocument, nodeId: string): void {
  for (const node of Object.values(document.nodes)) {
    if (node.children) {
      node.children = node.children.filter((childId) => childId !== nodeId);
    }

    if (!node.slots) {
      continue;
    }

    const slots = { ...node.slots };
    for (const [slotName, slotValue] of Object.entries(slots)) {
      if (Array.isArray(slotValue)) {
        const nextValue = slotValue.filter((slotNodeId) => slotNodeId !== nodeId);
        if (nextValue.length === 0) {
          delete slots[slotName];
        } else {
          slots[slotName] = nextValue;
        }
        continue;
      }

      if (slotValue === nodeId) {
        delete slots[slotName];
      }
    }
    node.slots = slots;
  }
}

function fromVerificationDiagnostic(diagnostic: VerificationDiagnostic): StreamDiagnostic {
  return Object.freeze({
    code: diagnostic.code,
    severity: diagnostic.severity,
    path: diagnostic.path,
    message: diagnostic.message,
    ...(diagnostic.nodeId ? { nodeId: diagnostic.nodeId } : {}),
    ...(diagnostic.componentType ? { componentType: diagnostic.componentType } : {}),
  });
}

function diagnostic(
  code: StreamDiagnosticCode,
  path: string,
  message: string,
  extra: Partial<Omit<StreamDiagnostic, "code" | "path" | "message">> = {},
): StreamDiagnostic {
  return Object.freeze({
    code,
    severity: extra.severity ?? "error",
    path,
    message,
    ...(extra.seq !== undefined ? { seq: extra.seq } : {}),
    ...(extra.nodeId ? { nodeId: extra.nodeId } : {}),
    ...(extra.componentType ? { componentType: extra.componentType } : {}),
  });
}

function getNextSeq(state: StreamState): number {
  if (state.seenSeq.size === 0) {
    return 0;
  }

  return Math.max(...state.seenSeq) + 1;
}
