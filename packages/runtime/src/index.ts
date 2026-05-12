import type { z } from "zod";
import type { RuntimeCapabilityDescription } from "@wasser-ui/core";

export type WasserRuntimeRisk = "low" | "medium" | "high" | "destructive";

export type MaybePromise<T> = T | Promise<T>;

export type RuntimeCapabilitySummary = {
  id: string;
  label?: string;
  description?: string;
  risk?: WasserRuntimeRisk;
};

export type StateDefinition<Value = unknown> = {
  key: string;
  initialValue: Value;
  schema?: z.ZodType<Value>;
  label?: string;
  description?: string;
};

export type QueryDefinition<Output = unknown, Input = unknown> = {
  id: string;
  dataRef?: string;
  label?: string;
  description?: string;
  inputSchema?: z.ZodType<Input>;
  outputSchema?: z.ZodType<Output>;
  handler: (input: Input, context: QueryContext) => MaybePromise<Output>;
};

export type ActionDefinition<Input = unknown, Output = unknown> = {
  id: string;
  label?: string;
  description?: string;
  risk?: WasserRuntimeRisk;
  inputSchema?: z.ZodType<Input>;
  outputSchema?: z.ZodType<Output>;
  handler: (input: Input, context: ActionContext) => MaybePromise<Output>;
};

export type MutationDefinition<Input = unknown, Output = unknown> = {
  id: string;
  label?: string;
  description?: string;
  risk?: WasserRuntimeRisk;
  inputSchema?: z.ZodType<Input>;
  outputSchema?: z.ZodType<Output>;
  handler: (input: Input, context: MutationContext) => MaybePromise<Output>;
};

export type QueryContext = {
  queryId: string;
  dataRef: string;
};

export type ActionContext = {
  actionId: string;
  risk: WasserRuntimeRisk;
};

export type MutationContext = {
  mutationId: string;
  risk: WasserRuntimeRisk;
};

export type PermissionDecision = {
  allowed: boolean;
  reason?: string;
};

export type PermissionDecisionInput =
  | {
      kind: "query";
      id: string;
      dataRef: string;
    }
  | {
      kind: "action";
      id: string;
      risk: WasserRuntimeRisk;
    }
  | {
      kind: "mutation";
      id: string;
      risk: WasserRuntimeRisk;
    }
  | {
      kind: "state.set";
      key: string;
    }
  | {
      kind: "render";
      permission: string;
    };

export type PermissionGuard =
  | ((input: PermissionDecisionInput) => MaybePromise<boolean | PermissionDecision>)
  | {
      canResolveQuery?: (
        input: Extract<PermissionDecisionInput, { kind: "query" }>,
      ) => MaybePromise<boolean | PermissionDecision>;
      canRunAction?: (
        input: Extract<PermissionDecisionInput, { kind: "action" }>,
      ) => MaybePromise<boolean | PermissionDecision>;
      canRunMutation?: (
        input: Extract<PermissionDecisionInput, { kind: "mutation" }>,
      ) => MaybePromise<boolean | PermissionDecision>;
      canSetState?: (
        input: Extract<PermissionDecisionInput, { kind: "state.set" }>,
      ) => MaybePromise<boolean | PermissionDecision>;
      canRender?: (
        input: Extract<PermissionDecisionInput, { kind: "render" }>,
      ) => MaybePromise<boolean | PermissionDecision>;
    };

export type RuntimeEvent =
  | {
      kind: "runtime.capability.register";
      capability: "state" | "query" | "action" | "mutation";
      id: string;
    }
  | {
      kind: "runtime.query.resolve";
      queryId: string;
      dataRef: string;
    }
  | {
      kind: "runtime.action.run";
      actionId: string;
    }
  | {
      kind: "runtime.mutation.run";
      mutationId: string;
    }
  | {
      kind: "runtime.state.set";
      key: string;
    }
  | {
      kind: "runtime.permission.decision";
      target: PermissionDecisionInput;
      allowed: boolean;
      reason?: string;
    }
  | {
      kind: "runtime.block";
      code: RuntimeErrorCode;
      id: string;
      reason?: string;
    };

export type RuntimeEventRecord = RuntimeEvent & {
  seq: number;
  timestamp: number;
};

export type RuntimeEventListener = (event: RuntimeEventRecord) => void;

export type RuntimeErrorCode =
  | "duplicate_capability"
  | "unknown_state"
  | "unknown_query"
  | "unknown_action"
  | "unknown_mutation"
  | "invalid_input"
  | "invalid_output"
  | "permission_denied";

export type StateRegistry = {
  register<Value>(definition: StateDefinition<Value>): StateDefinition<Value>;
  has(key: string): boolean;
  get<Value = unknown>(key: string): Value;
  set<Value = unknown>(key: string, value: Value): Promise<Value>;
  list(): readonly StateDefinition[];
  keys(): readonly string[];
};

export type QueryRegistry = {
  register<Output, Input = unknown>(
    definition: QueryDefinition<Output, Input>,
  ): QueryDefinition<Output, Input>;
  has(id: string): boolean;
  hasDataRef(dataRef: string): boolean;
  get(id: string): QueryDefinition | undefined;
  getByDataRef(dataRef: string): QueryDefinition | undefined;
  resolve<Output = unknown, Input = unknown>(id: string, input?: Input): Promise<Output>;
  resolveDataRef<Output = unknown>(dataRef: string): Promise<Output>;
  list(): readonly QueryDefinition[];
  dataRefs(): readonly string[];
};

export type ActionRegistry = {
  register<Input = unknown, Output = unknown>(
    definition: ActionDefinition<Input, Output>,
  ): ActionDefinition<Input, Output>;
  has(id: string): boolean;
  get(id: string): ActionDefinition | undefined;
  run<Output = unknown, Input = unknown>(id: string, input?: Input): Promise<Output>;
  list(): readonly ActionDefinition[];
  ids(): readonly string[];
};

export type MutationRegistry = {
  register<Input = unknown, Output = unknown>(
    definition: MutationDefinition<Input, Output>,
  ): MutationDefinition<Input, Output>;
  has(id: string): boolean;
  get(id: string): MutationDefinition | undefined;
  run<Output = unknown, Input = unknown>(id: string, input?: Input): Promise<Output>;
  list(): readonly MutationDefinition[];
  ids(): readonly string[];
};

export type RuntimeEventBus = {
  emit(event: RuntimeEvent): RuntimeEventRecord;
  subscribe(listener: RuntimeEventListener): () => void;
  getSnapshot(): readonly RuntimeEventRecord[];
  clear(): void;
};

export type WasserRuntime = {
  state: StateRegistry;
  queries: QueryRegistry;
  actions: ActionRegistry;
  mutations: MutationRegistry;
  events: RuntimeEventBus;
  describe(): RuntimeCapabilityDescription;
  resolveData(dataRef: string): Promise<unknown>;
  runAction(actionId: string, payload?: unknown): Promise<unknown>;
  runMutation(mutationId: string, payload?: unknown): Promise<unknown>;
  canRender(input: { permission: string }): boolean;
};

export type CreateWasserRuntimeOptions = {
  permissions?: PermissionGuard;
  telemetry?: RuntimeEventListener;
};

export class WasserRuntimeError extends Error {
  readonly code: RuntimeErrorCode;
  readonly id: string;

  constructor(code: RuntimeErrorCode, id: string, message: string) {
    super(message);
    this.name = "WasserRuntimeError";
    this.code = code;
    this.id = id;
  }
}

export function createWasserRuntime(options: CreateWasserRuntimeOptions = {}): WasserRuntime {
  const events = createRuntimeEventBus(options.telemetry);
  const permissionGuard = options.permissions;

  const stateDefinitions = new Map<string, StateDefinition>();
  const stateValues = new Map<string, unknown>();
  const queryDefinitions = new Map<string, QueryDefinition>();
  const queryDataRefs = new Map<string, QueryDefinition>();
  const actionDefinitions = new Map<string, ActionDefinition>();
  const mutationDefinitions = new Map<string, MutationDefinition>();

  const runtime: WasserRuntime = {
    state: {
      register<Value>(definition: StateDefinition<Value>) {
        const key = normalizeId(definition.key, "state key");
        ensureUnique(!stateDefinitions.has(key), "state", key, events);
        const normalized = Object.freeze({ ...definition, key });
        const parsedValue = parseWithSchema(definition.schema, definition.initialValue, key);
        stateDefinitions.set(key, normalized);
        stateValues.set(key, parsedValue);
        events.emit({ kind: "runtime.capability.register", capability: "state", id: key });
        return normalized;
      },
      has(key) {
        return stateDefinitions.has(key);
      },
      get<Value = unknown>(key: string): Value {
        const normalized = normalizeId(key, "state key");
        if (!stateDefinitions.has(normalized)) {
          throw block(
            "unknown_state",
            normalized,
            `State '${normalized}' is not registered.`,
            events,
          );
        }

        return stateValues.get(normalized) as Value;
      },
      async set<Value = unknown>(key: string, value: Value): Promise<Value> {
        const normalized = normalizeId(key, "state key");
        const definition = stateDefinitions.get(normalized);
        if (!definition) {
          throw block(
            "unknown_state",
            normalized,
            `State '${normalized}' is not registered.`,
            events,
          );
        }

        const decision = await decide(permissionGuard, { kind: "state.set", key: normalized });
        emitDecision(events, { kind: "state.set", key: normalized }, decision);
        if (!decision.allowed) {
          throw block(
            "permission_denied",
            normalized,
            decision.reason ?? `Permission denied for state '${normalized}'.`,
            events,
          );
        }

        const parsedValue = parseWithSchema(definition.schema, value, normalized);
        stateValues.set(normalized, parsedValue);
        events.emit({ kind: "runtime.state.set", key: normalized });
        return parsedValue as Value;
      },
      list() {
        return Object.freeze([...stateDefinitions.values()]);
      },
      keys() {
        return Object.freeze([...stateDefinitions.keys()].sort());
      },
    },
    queries: {
      register<Output, Input = unknown>(definition: QueryDefinition<Output, Input>) {
        const id = normalizeId(definition.id, "query id");
        const dataRef = normalizeId(definition.dataRef ?? `queries.${id}.data`, "dataRef");
        ensureUnique(!queryDefinitions.has(id), "query", id, events);
        ensureUnique(!queryDataRefs.has(dataRef), "query", dataRef, events);
        const normalized = Object.freeze({ ...definition, id, dataRef });
        queryDefinitions.set(id, normalized as unknown as QueryDefinition);
        queryDataRefs.set(dataRef, normalized as unknown as QueryDefinition);
        events.emit({ kind: "runtime.capability.register", capability: "query", id });
        return normalized;
      },
      has(id) {
        return queryDefinitions.has(id);
      },
      hasDataRef(dataRef) {
        return queryDataRefs.has(dataRef);
      },
      get(id) {
        return queryDefinitions.get(id);
      },
      getByDataRef(dataRef) {
        return queryDataRefs.get(dataRef);
      },
      async resolve<Output = unknown, Input = unknown>(id: string, input?: Input): Promise<Output> {
        const normalized = normalizeId(id, "query id");
        const definition = queryDefinitions.get(normalized);
        if (!definition) {
          throw block(
            "unknown_query",
            normalized,
            `Query '${normalized}' is not registered.`,
            events,
          );
        }

        return resolveQueryDefinition(
          definition,
          input,
          permissionGuard,
          events,
        ) as Promise<Output>;
      },
      async resolveDataRef<Output = unknown>(dataRef: string): Promise<Output> {
        const normalized = normalizeId(dataRef, "dataRef");
        const definition = queryDataRefs.get(normalized);
        if (!definition) {
          throw block(
            "unknown_query",
            normalized,
            `Data ref '${normalized}' is not registered.`,
            events,
          );
        }

        return resolveQueryDefinition(
          definition,
          undefined,
          permissionGuard,
          events,
        ) as Promise<Output>;
      },
      list() {
        return Object.freeze([...queryDefinitions.values()]);
      },
      dataRefs() {
        return Object.freeze([...queryDataRefs.keys()].sort());
      },
    },
    actions: {
      register<Input = unknown, Output = unknown>(definition: ActionDefinition<Input, Output>) {
        const id = normalizeId(definition.id, "action id");
        ensureUnique(!actionDefinitions.has(id), "action", id, events);
        const normalized = Object.freeze({
          ...definition,
          id,
          risk: definition.risk ?? "low",
        }) as ActionDefinition<Input, Output>;
        actionDefinitions.set(id, normalized as unknown as ActionDefinition);
        events.emit({ kind: "runtime.capability.register", capability: "action", id });
        return normalized;
      },
      has(id) {
        return actionDefinitions.has(id);
      },
      get(id) {
        return actionDefinitions.get(id);
      },
      async run<Output = unknown, Input = unknown>(id: string, input?: Input): Promise<Output> {
        const normalized = normalizeId(id, "action id");
        const definition = actionDefinitions.get(normalized);
        if (!definition) {
          throw block(
            "unknown_action",
            normalized,
            `Action '${normalized}' is not registered.`,
            events,
          );
        }

        return runActionDefinition(definition, input, permissionGuard, events) as Promise<Output>;
      },
      list() {
        return Object.freeze([...actionDefinitions.values()]);
      },
      ids() {
        return Object.freeze([...actionDefinitions.keys()].sort());
      },
    },
    mutations: {
      register<Input = unknown, Output = unknown>(definition: MutationDefinition<Input, Output>) {
        const id = normalizeId(definition.id, "mutation id");
        ensureUnique(!mutationDefinitions.has(id), "mutation", id, events);
        const normalized = Object.freeze({
          ...definition,
          id,
          risk: definition.risk ?? "medium",
        }) as MutationDefinition<Input, Output>;
        mutationDefinitions.set(id, normalized as unknown as MutationDefinition);
        events.emit({ kind: "runtime.capability.register", capability: "mutation", id });
        return normalized;
      },
      has(id) {
        return mutationDefinitions.has(id);
      },
      get(id) {
        return mutationDefinitions.get(id);
      },
      async run<Output = unknown, Input = unknown>(id: string, input?: Input): Promise<Output> {
        const normalized = normalizeId(id, "mutation id");
        const definition = mutationDefinitions.get(normalized);
        if (!definition) {
          throw block(
            "unknown_mutation",
            normalized,
            `Mutation '${normalized}' is not registered.`,
            events,
          );
        }

        return runMutationDefinition(definition, input, permissionGuard, events) as Promise<Output>;
      },
      list() {
        return Object.freeze([...mutationDefinitions.values()]);
      },
      ids() {
        return Object.freeze([...mutationDefinitions.keys()].sort());
      },
    },
    events,
    describe() {
      return Object.freeze({
        actions: runtime.actions.ids(),
        dataRefs: runtime.queries.dataRefs(),
        stateKeys: runtime.state.keys(),
      });
    },
    resolveData(dataRef) {
      return runtime.queries.resolveDataRef(dataRef);
    },
    runAction(actionId, payload) {
      return runtime.actions.run(actionId, payload);
    },
    runMutation(mutationId, payload) {
      return runtime.mutations.run(mutationId, payload);
    },
    canRender(input) {
      const decision = decideSync(permissionGuard, {
        kind: "render",
        permission: input.permission,
      });
      emitDecision(events, { kind: "render", permission: input.permission }, decision);
      return decision.allowed;
    },
  };

  return Object.freeze(runtime);
}

export function createRuntimeEventBus(telemetry?: RuntimeEventListener): RuntimeEventBus {
  const listeners = new Set<RuntimeEventListener>();
  const records: RuntimeEventRecord[] = [];
  let seq = 0;

  if (telemetry) {
    listeners.add(telemetry);
  }

  return Object.freeze({
    emit(event: RuntimeEvent): RuntimeEventRecord {
      const record = Object.freeze({
        ...event,
        seq: ++seq,
        timestamp: Date.now(),
      }) as RuntimeEventRecord;
      records.push(record);
      listeners.forEach((listener) => listener(record));
      return record;
    },
    subscribe(listener: RuntimeEventListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return Object.freeze([...records]);
    },
    clear() {
      records.length = 0;
    },
  });
}

async function resolveQueryDefinition(
  definition: QueryDefinition,
  input: unknown,
  permissionGuard: PermissionGuard | undefined,
  events: RuntimeEventBus,
): Promise<unknown> {
  const dataRef = definition.dataRef ?? `queries.${definition.id}.data`;
  const decisionInput = { kind: "query" as const, id: definition.id, dataRef };
  const decision = await decide(permissionGuard, decisionInput);
  emitDecision(events, decisionInput, decision);
  if (!decision.allowed) {
    throw block(
      "permission_denied",
      definition.id,
      decision.reason ?? `Permission denied for query '${definition.id}'.`,
      events,
    );
  }

  const parsedInput = parseWithSchema(definition.inputSchema, input, definition.id);
  const output = await definition.handler(parsedInput, {
    queryId: definition.id,
    dataRef,
  });
  const parsedOutput = parseWithSchema(definition.outputSchema, output, definition.id);
  events.emit({ kind: "runtime.query.resolve", queryId: definition.id, dataRef });
  return parsedOutput;
}

async function runActionDefinition(
  definition: ActionDefinition,
  input: unknown,
  permissionGuard: PermissionGuard | undefined,
  events: RuntimeEventBus,
): Promise<unknown> {
  const risk = definition.risk ?? "low";
  const decisionInput = { kind: "action" as const, id: definition.id, risk };
  const decision = await decide(permissionGuard, decisionInput);
  emitDecision(events, decisionInput, decision);
  if (!decision.allowed) {
    throw block(
      "permission_denied",
      definition.id,
      decision.reason ?? `Permission denied for action '${definition.id}'.`,
      events,
    );
  }

  const parsedInput = parseWithSchema(definition.inputSchema, input, definition.id);
  const output = await definition.handler(parsedInput, {
    actionId: definition.id,
    risk,
  });
  const parsedOutput = parseWithSchema(definition.outputSchema, output, definition.id);
  events.emit({ kind: "runtime.action.run", actionId: definition.id });
  return parsedOutput;
}

async function runMutationDefinition(
  definition: MutationDefinition,
  input: unknown,
  permissionGuard: PermissionGuard | undefined,
  events: RuntimeEventBus,
): Promise<unknown> {
  const risk = definition.risk ?? "medium";
  const decisionInput = { kind: "mutation" as const, id: definition.id, risk };
  const decision = await decide(permissionGuard, decisionInput);
  emitDecision(events, decisionInput, decision);
  if (!decision.allowed) {
    throw block(
      "permission_denied",
      definition.id,
      decision.reason ?? `Permission denied for mutation '${definition.id}'.`,
      events,
    );
  }

  const parsedInput = parseWithSchema(definition.inputSchema, input, definition.id);
  const output = await definition.handler(parsedInput, {
    mutationId: definition.id,
    risk,
  });
  const parsedOutput = parseWithSchema(definition.outputSchema, output, definition.id);
  events.emit({ kind: "runtime.mutation.run", mutationId: definition.id });
  return parsedOutput;
}

function parseWithSchema<T>(schema: z.ZodType<T> | undefined, value: unknown, id: string): unknown {
  if (!schema) {
    return value;
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    throw new WasserRuntimeError(
      "invalid_input",
      id,
      `Runtime value for '${id}' failed schema validation: ${result.error.issues[0]?.message ?? "Invalid value"}.`,
    );
  }

  return result.data;
}

async function decide(
  guard: PermissionGuard | undefined,
  input: PermissionDecisionInput,
): Promise<PermissionDecision> {
  return normalizeDecision(await callGuard(guard, input));
}

function decideSync(
  guard: PermissionGuard | undefined,
  input: PermissionDecisionInput,
): PermissionDecision {
  const result = callGuard(guard, input);
  if (result instanceof Promise) {
    throw new WasserRuntimeError(
      "permission_denied",
      input.kind,
      "Synchronous permission checks cannot use an async permission guard.",
    );
  }

  return normalizeDecision(result);
}

function callGuard(
  guard: PermissionGuard | undefined,
  input: PermissionDecisionInput,
): MaybePromise<boolean | PermissionDecision | undefined> {
  if (!guard) {
    return true;
  }

  if (typeof guard === "function") {
    return guard(input);
  }

  switch (input.kind) {
    case "query":
      return guard.canResolveQuery?.(input) ?? true;
    case "action":
      return guard.canRunAction?.(input) ?? true;
    case "mutation":
      return guard.canRunMutation?.(input) ?? true;
    case "state.set":
      return guard.canSetState?.(input) ?? true;
    case "render":
      return guard.canRender?.(input) ?? true;
  }
}

function normalizeDecision(decision: boolean | PermissionDecision | undefined): PermissionDecision {
  if (decision === undefined) {
    return Object.freeze({ allowed: true });
  }

  if (typeof decision === "boolean") {
    return Object.freeze({ allowed: decision });
  }

  return Object.freeze({
    allowed: decision.allowed,
    ...(decision.reason ? { reason: decision.reason } : {}),
  });
}

function emitDecision(
  events: RuntimeEventBus,
  target: PermissionDecisionInput,
  decision: PermissionDecision,
): void {
  events.emit({
    kind: "runtime.permission.decision",
    target,
    allowed: decision.allowed,
    ...(decision.reason ? { reason: decision.reason } : {}),
  });
}

function normalizeId(value: string, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`Runtime ${label} must be a non-empty string.`);
  }

  return value.trim();
}

function ensureUnique(
  condition: boolean,
  capability: "state" | "query" | "action" | "mutation",
  id: string,
  events: RuntimeEventBus,
): void {
  if (condition) {
    return;
  }

  throw block(
    "duplicate_capability",
    id,
    `${capability} capability '${id}' is already registered.`,
    events,
  );
}

function block(
  code: RuntimeErrorCode,
  id: string,
  message: string,
  events: RuntimeEventBus,
): WasserRuntimeError {
  events.emit({
    kind: "runtime.block",
    code,
    id,
    reason: message,
  });
  return new WasserRuntimeError(code, id, message);
}
