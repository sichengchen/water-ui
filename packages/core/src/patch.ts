import {
  assertVerifiedSchemaUI,
  verifyDocument,
  type RuntimeCapabilityDescription,
  type VerificationDiagnostic,
  type VerificationDiagnosticCode,
  type VerifiedSchemaUI,
} from "./verification.js";
import {
  parseSchemaUIPatch,
  type SchemaUIDocument,
  type SchemaUINode,
  type SchemaUIPatch,
} from "./protocol.js";
import type { WasserRegistry } from "./index.js";

export type PatchDiagnosticCode =
  | "invalid_patch_input"
  | "invalid_patch_target_reference"
  | "invalid_patch_node_reference"
  | "invalid_patch_child_reference"
  | "invalid_patch_slot_reference"
  | "invalid_patch_operation_state"
  | VerificationDiagnosticCode;

export type PatchDiagnostic = {
  code: PatchDiagnosticCode;
  severity: "error" | "warning";
  path: string;
  message: string;
  opIndex?: number;
  nodeId?: string;
  componentType?: string;
};

export type ApplyPatchOptions = {
  registry: WasserRegistry;
  runtime?: RuntimeCapabilityDescription;
};

export type PatchHistoryEntry = {
  index: number;
  patch: SchemaUIPatch;
  before: VerifiedSchemaUI;
  after: VerifiedSchemaUI;
  timestamp: number;
};

export type PatchHistory = {
  add(entry: Omit<PatchHistoryEntry, "index" | "timestamp">): PatchHistoryEntry;
  list(): readonly PatchHistoryEntry[];
  clear(): void;
};

export type PatchResult =
  | {
      ok: true;
      ui: VerifiedSchemaUI;
      patch: SchemaUIPatch;
      diagnostics: readonly PatchDiagnostic[];
      historyEntry?: PatchHistoryEntry;
    }
  | {
      ok: false;
      diagnostics: readonly PatchDiagnostic[];
      patch?: SchemaUIPatch;
    };

type DraftDocument = SchemaUIDocument;

export function validatePatch(
  ui: VerifiedSchemaUI,
  patchInput: unknown,
  options: ApplyPatchOptions,
): PatchResult {
  return applyPatch(ui, patchInput, options);
}

export function applyPatch(
  ui: VerifiedSchemaUI,
  patchInput: unknown,
  options: ApplyPatchOptions & { history?: PatchHistory },
): PatchResult {
  try {
    assertVerifiedSchemaUI(ui);
  } catch {
    return fail([
      diagnostic("invalid_patch_input", "$", "applyPatch requires VerifiedSchemaUI as input."),
    ]);
  }

  const parsed = parseSchemaUIPatch(patchInput);
  if (!parsed.ok) {
    return fail(parsed.diagnostics);
  }

  const patch = parsed.value;
  const draft = cloneDocument(ui);
  const diagnostics: PatchDiagnostic[] = [];

  if (!draft.nodes[patch.target]) {
    diagnostics.push(
      diagnostic(
        "invalid_patch_target_reference",
        "$.target",
        `Patch target '${patch.target}' must reference an existing node.`,
        {
          nodeId: patch.target,
        },
      ),
    );
  }

  patch.ops.forEach((operation, index) => {
    if (hasErrors(diagnostics)) {
      return;
    }

    applyOperation(draft, operation, index, diagnostics);
  });

  if (hasErrors(diagnostics)) {
    return {
      ok: false,
      patch,
      diagnostics: Object.freeze(diagnostics),
    };
  }

  const verification = verifyDocument(draft, {
    registry: options.registry,
    runtime: options.runtime,
  });

  if (!verification.ok) {
    return {
      ok: false,
      patch,
      diagnostics: Object.freeze(verification.diagnostics.map(fromVerificationDiagnostic)),
    };
  }

  const historyEntry = options.history?.add({
    patch,
    before: ui,
    after: verification.ui,
  });

  return Object.freeze({
    ok: true,
    ui: verification.ui,
    patch,
    diagnostics: Object.freeze([]),
    ...(historyEntry ? { historyEntry } : {}),
  });
}

export function createPatchHistory(): PatchHistory {
  const entries: PatchHistoryEntry[] = [];

  return Object.freeze({
    add(entry: Omit<PatchHistoryEntry, "index" | "timestamp">): PatchHistoryEntry {
      const next = Object.freeze({
        ...entry,
        index: entries.length,
        timestamp: Date.now(),
      });
      entries.push(next);
      return next;
    },
    list() {
      return Object.freeze([...entries]);
    },
    clear() {
      entries.length = 0;
    },
  });
}

function applyOperation(
  draft: DraftDocument,
  operation: SchemaUIPatch["ops"][number],
  opIndex: number,
  diagnostics: PatchDiagnostic[],
): void {
  switch (operation.op) {
    case "upsertNode": {
      draft.nodes[operation.id] = cloneNode(operation.node);
      return;
    }

    case "replaceNode": {
      if (!requireNode(draft, operation.id, opIndex, "$.ops", diagnostics)) {
        return;
      }
      draft.nodes[operation.id] = cloneNode(operation.node);
      return;
    }

    case "removeNode": {
      if (!requireNode(draft, operation.id, opIndex, "$.ops", diagnostics)) {
        return;
      }

      delete draft.nodes[operation.id];
      removeNodeReferences(draft, operation.id);
      return;
    }

    case "updateProps": {
      const node = requireNode(draft, operation.id, opIndex, "$.ops", diagnostics);
      if (!node) {
        return;
      }

      draft.nodes[operation.id] = cloneNode({
        ...node,
        props: {
          ...node.props,
          ...operation.props,
        },
      });
      return;
    }

    case "appendChild": {
      if (!requireParentAndChild(draft, operation.parent, operation.child, opIndex, diagnostics)) {
        return;
      }

      const parent = draft.nodes[operation.parent];
      parent.children = [...(parent.children ?? []), operation.child];
      return;
    }

    case "prependChild": {
      if (!requireParentAndChild(draft, operation.parent, operation.child, opIndex, diagnostics)) {
        return;
      }

      const parent = draft.nodes[operation.parent];
      parent.children = [operation.child, ...(parent.children ?? [])];
      return;
    }

    case "insertChildBefore": {
      if (!requireParentAndChild(draft, operation.parent, operation.child, opIndex, diagnostics)) {
        return;
      }

      insertChildRelative(draft, operation.parent, operation.child, {
        before: operation.before,
        opIndex,
        diagnostics,
      });
      return;
    }

    case "insertChildAfter": {
      if (!requireParentAndChild(draft, operation.parent, operation.child, opIndex, diagnostics)) {
        return;
      }

      insertChildRelative(draft, operation.parent, operation.child, {
        after: operation.after,
        opIndex,
        diagnostics,
      });
      return;
    }

    case "removeChild": {
      const parent = requireNode(draft, operation.parent, opIndex, "$.ops", diagnostics);
      if (!parent) {
        return;
      }

      parent.children = (parent.children ?? []).filter((childId) => childId !== operation.child);
      return;
    }

    case "moveNode": {
      if (!requireNode(draft, operation.id, opIndex, "$.ops", diagnostics)) {
        return;
      }

      removeNodeReferences(draft, operation.id);
      if (!operation.parent) {
        return;
      }

      if (!requireNode(draft, operation.parent, opIndex, "$.ops", diagnostics)) {
        return;
      }

      if (operation.before) {
        insertChildRelative(draft, operation.parent, operation.id, {
          before: operation.before,
          opIndex,
          diagnostics,
        });
        return;
      }

      if (operation.after) {
        insertChildRelative(draft, operation.parent, operation.id, {
          after: operation.after,
          opIndex,
          diagnostics,
        });
        return;
      }

      const parent = draft.nodes[operation.parent];
      parent.children = [...(parent.children ?? []), operation.id];
      return;
    }

    case "replaceChildren": {
      const parent = requireNode(draft, operation.parent, opIndex, "$.ops", diagnostics);
      if (!parent) {
        return;
      }

      const missingChild = operation.children.find((childId) => !draft.nodes[childId]);
      if (missingChild) {
        diagnostics.push(
          diagnostic(
            "invalid_patch_child_reference",
            `$.ops[${opIndex}].children`,
            `Patch operation references missing child node '${missingChild}'.`,
            {
              opIndex,
              nodeId: missingChild,
            },
          ),
        );
        return;
      }

      parent.children = [...operation.children];
      return;
    }

    case "setSlot": {
      const node = requireNode(draft, operation.id, opIndex, "$.ops", diagnostics);
      if (!node) {
        return;
      }

      const references = Array.isArray(operation.value) ? operation.value : [operation.value];
      const missingReference = references.find((nodeId) => !draft.nodes[nodeId]);
      if (missingReference) {
        diagnostics.push(
          diagnostic(
            "invalid_patch_slot_reference",
            `$.ops[${opIndex}].value`,
            `Patch operation references missing slot node '${missingReference}'.`,
            {
              opIndex,
              nodeId: missingReference,
            },
          ),
        );
        return;
      }

      node.slots = {
        ...node.slots,
        [operation.slot]: Array.isArray(operation.value) ? [...operation.value] : operation.value,
      };
      return;
    }

    case "unsetSlot": {
      const node = requireNode(draft, operation.id, opIndex, "$.ops", diagnostics);
      if (!node) {
        return;
      }

      const slots = { ...node.slots };
      delete slots[operation.slot];
      node.slots = slots;
      return;
    }
  }
}

function insertChildRelative(
  draft: DraftDocument,
  parentId: string,
  childId: string,
  options: {
    before?: string;
    after?: string;
    opIndex: number;
    diagnostics: PatchDiagnostic[];
  },
): void {
  const parent = draft.nodes[parentId];
  const children = [...(parent.children ?? [])];
  const relativeId = options.before ?? options.after;
  const relativeIndex = relativeId ? children.indexOf(relativeId) : -1;

  if (relativeId && relativeIndex === -1) {
    options.diagnostics.push(
      diagnostic(
        "invalid_patch_child_reference",
        `$.ops[${options.opIndex}].${options.before ? "before" : "after"}`,
        `Patch operation references missing sibling node '${relativeId}'.`,
        {
          opIndex: options.opIndex,
          nodeId: relativeId,
        },
      ),
    );
    return;
  }

  const insertIndex = options.before ? relativeIndex : relativeIndex + 1;
  children.splice(insertIndex, 0, childId);
  parent.children = children;
}

function requireParentAndChild(
  draft: DraftDocument,
  parentId: string,
  childId: string,
  opIndex: number,
  diagnostics: PatchDiagnostic[],
): boolean {
  const parent = requireNode(draft, parentId, opIndex, "$.ops", diagnostics);
  if (!parent) {
    return false;
  }

  if (!draft.nodes[childId]) {
    diagnostics.push(
      diagnostic(
        "invalid_patch_child_reference",
        `$.ops[${opIndex}].child`,
        `Patch operation references missing child node '${childId}'.`,
        {
          opIndex,
          nodeId: childId,
        },
      ),
    );
    return false;
  }

  return true;
}

function requireNode(
  draft: DraftDocument,
  nodeId: string,
  opIndex: number,
  pathPrefix: string,
  diagnostics: PatchDiagnostic[],
): SchemaUINode | undefined {
  const node = draft.nodes[nodeId];
  if (node) {
    return node;
  }

  diagnostics.push(
    diagnostic(
      "invalid_patch_node_reference",
      `${pathPrefix}[${opIndex}]`,
      `Patch operation references missing node '${nodeId}'.`,
      {
        opIndex,
        nodeId,
      },
    ),
  );
  return undefined;
}

function removeNodeReferences(draft: DraftDocument, nodeId: string): void {
  for (const node of Object.values(draft.nodes)) {
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

function cloneDocument(ui: VerifiedSchemaUI): DraftDocument {
  return {
    kind: "wasser.ui.document",
    version: ui.version,
    root: ui.root,
    nodes: Object.fromEntries(
      Object.entries(ui.nodes).map(([nodeId, node]) => [nodeId, cloneNode(node)]),
    ),
    ...(ui.meta ? { meta: cloneRecord(ui.meta) } : {}),
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

function fromVerificationDiagnostic(diagnostic: VerificationDiagnostic): PatchDiagnostic {
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
  code: PatchDiagnosticCode,
  path: string,
  message: string,
  extra: Partial<Omit<PatchDiagnostic, "code" | "severity" | "path" | "message">> = {},
): PatchDiagnostic {
  return Object.freeze({
    code,
    severity: "error" as const,
    path,
    message,
    ...extra,
  });
}

function fail(
  diagnostics: readonly {
    code: string;
    severity: "error" | "warning";
    path: string;
    message: string;
  }[],
): PatchResult {
  return Object.freeze({
    ok: false,
    diagnostics: Object.freeze(
      diagnostics.map((item) =>
        diagnostic(item.code as PatchDiagnosticCode, item.path, item.message),
      ),
    ),
  });
}

function hasErrors(diagnostics: readonly PatchDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
