// src/pages/admin/Builder.tsx
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useSearchParams } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";
import { getTemplate, listTemplateDefs, type BotKey } from "@/lib/templates";
import { getBotSettings, setBotSettings } from "@/lib/botSettings";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/* =========================================================================
   0)  Instance support (duplicated bots)
   ========================================================================= */

type InstMeta = { baseKey: string; mode: "basic" | "custom" } | null;

function readInstMeta(instId: string): InstMeta {
  try {
    const raw = localStorage.getItem(`botSettingsInst:${instId}`);
    if (raw) return JSON.parse(raw) as InstMeta;
  } catch {}
  return null;
}

function readInstOverrides(instId: string, mode: "basic" | "custom") {
  try {
    const raw = localStorage.getItem(`botOverridesInst:${instId}_${mode}`);
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}

function writeInstOverrides(
  instId: string,
  mode: "basic" | "custom",
  ov: Record<string, any>
) {
  localStorage.setItem(
    `botOverridesInst:${instId}_${mode}`,
    JSON.stringify(ov || {})
  );
}

function writeInstMeta(instId: string, meta: InstMeta) {
  localStorage.setItem(`botSettingsInst:${instId}`, JSON.stringify(meta ?? {}));
}

/* =========================================================================
   1)  Custom Node components (INCLUDING NEW PHONE & CALENDAR NODES)
   ========================================================================= */

const MessageNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.title || "Message"}</div>
    <div className="text-gray-500 text-sm">{data?.text || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ChoiceNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Choice"}</div>
    <div className="text-xs text-gray-600 mt-1">
      {(data?.options || []).join(" | ") || "No options"}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Action"}</div>
    <div className="text-xs text-gray-600">{data?.to || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const InputNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Input"}</div>
    <div className="text-xs text-gray-600">{data?.placeholder || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

/* NEW: Phone Node */
const PhoneNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-sky-50 border-2 border-sky-400">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2">
      <span className="text-xl">☎️</span>
      <div>
        <div className="font-bold text-sm">{data?.label || "Phone"}</div>
        <div className="text-xs text-gray-600">
          {data?.phoneAction || "Handle call"}
        </div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

/* NEW: Calendar Node */
const CalendarNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-emerald-50 border-2 border-emerald-400">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2">
      <span className="text-xl">📅</span>
      <div>
        <div className="font-bold text-sm">{data?.label || "Calendar"}</div>
        <div className="text-xs text-gray-600">
          {data?.calendarAction || "Book appointment"}
        </div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

/* Register node types */
const nodeTypes = {
  message: MessageNode,
  choice: ChoiceNode,
  action: ActionNode,
  input: InputNode,
  phone: PhoneNode,
  calendar: CalendarNode,
};

/* =========================================================================
   2)  Helpers: per-bot+mode (or instance+mode) overrides in localStorage
   ========================================================================= */

type RFNode = Node & {
  type?:
    | "default"
    | "input"
    | "output"
    | "group"
    | "message"
    | "choice"
    | "action"
    | "phone"
    | "calendar";
  data?: any;
};

const OV_KEY = (bot: string, mode: "basic" | "custom") =>
  `botOverrides:${bot}_${mode}`;

function getOverrides(
  bot: string,
  mode: "basic" | "custom",
  instId?: string
) {
  if (instId) return readInstOverrides(instId, mode);
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}

function saveOverrides(
  bot: string,
  mode: "basic" | "custom",
  ov: Record<string, any>,
  instId?: string
) {
  if (instId) {
    writeInstOverrides(instId, mode, ov);
    return;
  }
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(ov));
}

/* =========================================================================
   3)  The actual Builder body (inside ReactFlowProvider)
   ========================================================================= */

type Source =
  | { kind: "tpl"; bot: string }
  | { kind: "inst"; id: string; meta: InstMeta };

const sourceToValue = (s: Source) =>
  s.kind === "tpl" ? `tpl:${s.bot}` : `inst:${s.id}`;

function BuilderInner() {
  const [search, setSearch] = useSearchParams();

  const queryInst = search.get("inst") || undefined;
  const queryBot = (search.get("bot") as string | null) || null;

  const [defs, setDefs] = useState(() => listTemplateDefs());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "botTemplates:index") {
        setDefs(listTemplateDefs());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const BUILTIN_KEYS = new Set<BotKey>([
    "LeadQualifier",
    "AppointmentBooking",
    "CustomerSupport",
    "Waitlist",
    "SocialMedia",
    "Receptionist",
  ] as BotKey[]);

  const { currentBot, setCurrentBot } = useAdminStore() as {
    currentBot: any;
    setCurrentBot?: (key: any) => void;
  };

  const [instances, setInstances] = useState<InstanceMeta[]>(() =>
    listInstances()
  );
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const initialSource: Source = useMemo(() => {
    if (queryInst) {
      return { kind: "inst", id: queryInst, meta: readInstMeta(queryInst) };
    }
    const defaultKey = queryBot || defs[0]?.key || "LeadQualifier";
    return { kind: "tpl", bot: defaultKey };
  }, [queryInst, queryBot, defs]);

  const [source, setSource] = useState<Source>(initialSource);

  const initialBot: string =
    source.kind === "tpl"
      ? source.bot
      : (source.meta?.baseKey as string) || defs[0]?.key || "LeadQualifier";

  const [bot, setBot] = useState<string>(initialBot);

  const initialMode: "basic" | "custom" =
    source.kind === "inst"
      ? (source.meta?.mode as "basic" | "custom") || "custom"
      : (getBotSettings(initialBot as any).mode as "basic" | "custom") ||
        "custom";

  const [mode, setMode] = useState<"basic" | "custom">(initialMode);

  useEffect(() => {
    if (source.kind === "tpl" && BUILTIN_KEYS.has(bot as BotKey)) {
      if (setCurrentBot && bot !== currentBot) setCurrentBot(bot);
    }
  }, [bot, source.kind]);

  useEffect(() => {
    if (
      source.kind === "tpl" &&
      BUILTIN_KEYS.has(currentBot as BotKey) &&
      currentBot &&
      currentBot !== bot
    ) {
      setBot(currentBot);
      setMode(
        (getBotSettings(currentBot as any).mode as "basic" | "custom") ||
          "custom"
      );
    }
  }, [currentBot]);

  const activeInstId = source.kind === "inst" ? source.id : undefined;

  const [overrides, setOv] = useState<Record<string, any>>(() =>
    getOverrides(bot, mode, activeInstId)
  );

  const mergeOverrides = useCallback(
    (src: RFNode[], ov: Record<string, any>) =>
      src.map((n) =>
        ov[n.id]?.data
          ? { ...n, data: { ...(n.data || {}), ...ov[n.id].data } }
          : n
      ),
    []
  );

  const base = useMemo(() => getTemplate(bot, mode), [bot, mode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode[]>(
    base ? (mergeOverrides((base as any).nodes, overrides) as RFNode[]) : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(
    base ? (base as any).edges : []
  );

  useEffect(() => {
    const found = getTemplate(bot, mode);
    const nextOv = getOverrides(bot, mode, activeInstId);
    setOv(nextOv);

    if (found) {
      setNodes(mergeOverrides((found as any).nodes, nextOv) as Node[]);
      setEdges((found as any).edges as Edge[]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [bot, mode, activeInstId, setNodes, setEdges, mergeOverrides]);

  function onModeChange(next: "basic" | "custom") {
    setMode(next);
    if (source.kind === "inst") {
      writeInstMeta(source.id, { baseKey: bot, mode: next });
    } else {
      setBotSettings(bot as any, { mode: next });
    }
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  useEffect(() => {
    if (!selectedId) return setEditorValues({});
    const n = nodes.find((x) => x.id === selectedId);
    setEditorValues(n?.data || {});
  }, [selectedId, nodes]);

  const onNodeClick = useCallback(
    (_: any, n: Node) => setSelectedId(n?.id || null),
    []
  );

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge(c, eds)),
    [setEdges]
  );

  const updateEditorValue = (k: string, v: any) =>
    setEditorValues((p: any) => ({ ...p, [k]: v }));

  const saveChanges = useCallback(() => {
    if (!selectedId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedId ? { ...n, data: { ...editorValues } } : n
      )
    );
    const nextOv = {
      ...overrides,
      [selectedId]: { data: { ...editorValues } },
    };
    setOv(nextOv);
    saveOverrides(bot, mode, nextOv, activeInstId);
  }, [selectedId, editorValues, overrides, setNodes, bot, mode, activeInstId]);

  const rf = useReactFlow<RFNode, Edge>();
  const [pendingType, setPendingType] = useState<
    | null
    | "message"
    | "choice"
    | "input"
    | "action"
    | "phone"
    | "calendar"
  >(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const nextId = () =>
    `node_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  const defaultDataFor = (t: Exclude<typeof pendingType, null>) => {
    switch (t) {
      case "message":
        return { title: "New Message", text: "Edit me…" };
      case "choice":
        return { label: "Choose one", options: ["Option A", "Option B"] };
      case "input":
        return { label: "Your input", placeholder: "Type here…" };
      case "action":
        return { label: "Action", to: "mailto:example@domain.com" };
      case "phone":
        return { label: "Phone Handler", phoneAction: "answer" };
      case "calendar":
        return {
          label: "Calendar Booking",
          calendarAction: "check-availability",
        };
      default:
        return {};
    }
  };

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (!pendingType) return;
      const flowPos = rf.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const id = nextId();
      const data = defaultDataFor(pendingType);

      const newNode: RFNode = {
        id,
        type: pendingType,
        position: flowPos,
        data,
      };

      setNodes((prev) => [...prev, newNode]);

      if (selectedId) {
        setEdges((prev) => [
          ...prev,
          {
            id: `e_${selectedId}_${id}`,
            source: selectedId,
            target: id,
            type: "smoothstep",
          },
        ]);
      }

      const nextOv = { ...overrides, [id]: { data } };
      setOv(nextOv);
      saveOverrides(bot, mode, nextOv, activeInstId);

      setSelectedId(id);
      setPendingType(null);
      setAddMenuOpen(false);
    },
    [
      pendingType,
      rf,
      selectedId,
      overrides,
      bot,
      mode,
      activeInstId,
      setEdges,
      setNodes,
    ]
  );

  const deleteSelected = () => {
    if (!selectedId) return;

    setNodes((prev) => prev.filter((n) => n.id !== selectedId));
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedId && e.target !== selectedId)
    );

    const nextOv = { ...overrides };
    delete nextOv[selectedId];
    setOv(nextOv);
    saveOverrides(bot, mode, nextOv, activeInstId);

    setSelectedId(null);
  };

  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const stop = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    };
    ["keydown", "keyup", "keypress"].forEach((evt) =>
      el.addEventListener(evt, stop, true)
    );
    return () => {
      ["keydown", "keyup", "keypress"].forEach((evt) =>
        el.removeEventListener(evt, stop, true)
      );
    };
  }, []);

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const selectValue = sourceToValue(source);

  function onSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;

    if (v.startsWith("inst:")) {
      const id = v.slice(5);
      const meta = readInstMeta(id);
      const baseKey =
        (meta?.baseKey as string | undefined) || defs[0]?.key || "LeadQualifier";
      const m = (meta?.mode as "basic" | "custom") || "custom";

      setSource({ kind: "inst", id, meta });
      setBot(baseKey);
      setMode(m);

      setSearch((s) => {
        s.set("inst", id);
        s.delete("bot");
        return s;
      });
      return;
    }

    if (v.startsWith("tpl:")) {
      const key = v.slice(4);
      const m =
        (getBotSettings(key as any).mode as "basic" | "custom") || "custom";

      setSource({ kind: "tpl", bot: key });
      setBot(key);
      setMode(m);

      setSearch((s) => {
        s.set("bot", key);
        s.delete("inst");
        return s;
      });
      return;
    }
  }

  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">
      {children}
    </div>
  );

  /* Editor with Phone and Calendar support */
  const Editor = () => {
    if (!selected)
      return (
        <div className="text-sm text-purple-600">
          Select a node above to edit its text and labels.
        </div>
      );

    if (selected.type === "phone") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              placeholder="Phone Handler"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Phone Action</FieldLabel>
            <select
              className={inputClass}
              value={editorValues.phoneAction || "answer"}
              onChange={(e) => updateEditorValue("phoneAction", e.target.value)}
            >
              <option value="answer">Answer Call</option>
              <option value="transfer">Transfer to Human</option>
              <option value="voicemail">Take Voicemail</option>
              <option value="collect-info">Collect Information</option>
            </select>
          </div>
        </div>
      );
    }

    if (selected.type === "calendar") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              placeholder="Calendar Action"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Calendar Action</FieldLabel>
            <select
              className={inputClass}
              value={editorValues.calendarAction || "check-availability"}
              onChange={(e) =>
                updateEditorValue("calendarAction", e.target.value)
              }
            >
              <option value="check-availability">Check Availability</option>
              <option value="book">Book Appointment</option>
              <option value="cancel">Cancel Appointment</option>
              <option value="reschedule">Reschedule Appointment</option>
            </select>
          </div>
        </div>
      );
    }

    if (selected.type === "input") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              placeholder="Enter label…"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.placeholder || ""}
              onChange={(e) => updateEditorValue("placeholder", e.target.value)}
              placeholder="Enter placeholder…"
              autoComplete="off"
            />
          </div>
        </div>
      );
    }

    if (selected.type === "choice") {
      const options: string[] = editorValues.options || [];
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              placeholder="Enter label…"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Options (one per line)</FieldLabel>
            <textarea
              className={inputClass}
              rows={5}
              value={options.join("\n")}
              onChange={(e) =>
                updateEditorValue(
                  "options",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder={"Option 1\nOption 2\nOption 3"}
              autoComplete="off"
            />
          </div>
        </div>
      );
    }

    if (selected.type === "action") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              placeholder="Enter label…"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Email / Target</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.to || ""}
              onChange={(e) => updateEditorValue("to", e.target.value)}
              placeholder="email@example.com"
              autoComplete="off"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            className={inputClass}
            value={editorValues.title || ""}
            onChange={(e) => updateEditorValue("title", e.target.value)}
            placeholder="Enter title…"
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel>Text</FieldLabel>
          <textarea
            className={inputClass}
            rows={4}
            value={editorValues.text || ""}
            onChange={(e) => updateEditorValue("text", e.target.value)}
            placeholder="Enter message text…"
            autoComplete="off"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] gap-4">
      {/* ===== Header ===== */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Builder {source.kind === "inst" ? "· Instance" : ""}
            </h1>
            <p className="text-sm text-foreground/70">
              Drag-and-drop flow editor.{" "}
              {source.kind === "inst"
                ? "Editing a duplicated bot instance."
                : "Pick a bot and edit the copy of each node below."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-foreground/70">
                Bot
              </label>
              <select
                className="rounded-lg border px-3 py-2 font-semibold bg-white min-w-[260px]"
                value={selectValue}
                onChange={onSelectChange}
                title="Choose a Template Bot or a Client Bot (instance)"
              >
                <optgroup label="Client Bots (instances)">
                  {instances.length === 0 ? (
                    <option value="inst:" disabled>
                      No client bots yet — duplicate or create one first
                    </option>
                  ) : (
                    instances
                      .slice()
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map((m) => (
                        <option key={m.id} value={`inst:${m.id}`}>
                          {(m.name || `${m.bot} Instance`).toString()} • {m.mode}
                        </option>
                      ))
                  )}
                </optgroup>

                <optgroup label="Templates">
                  {defs.map((d) => (
                    <option key={d.key} value={`tpl:${d.key}`}>
                      {d.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-foreground/70">
                Mode
              </span>
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-md px-2 py-1 text-xs font-bold ring-1 ring-border ${
                    mode === "basic"
                      ? "bg-indigo-100"
                      : "hover:bg-muted/40 bg-white"
                  }`}
                  onClick={() => onModeChange("basic")}
                >
                  basic
                </button>
                <button
                  className={`rounded-md px-2 py-1 text-xs font-bold ring-1 ring-border ${
                    mode === "custom"
                      ? "bg-indigo-100"
                      : "hover:bg-muted/40 bg-white"
                  }`}
                  onClick={() => onModeChange("custom")}
                >
                  custom
                </button>
              </div>
            </div>

            {/* Add Node */}
            <div className="relative">
              <button
                onClick={() => setAddMenuOpen((v) => !v)}
                className="rounded-md px-3 py-2 text-xs font-extrabold ring-1 ring-border bg-white hover:bg-gray-50"
                aria-expanded={addMenuOpen}
                aria-haspopup="menu"
              >
                + Add Node
              </button>
              {addMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 rounded-lg border-2 border-black bg-white shadow-xl z-20"
                >
                  {(
                    ["message", "choice", "input", "action", "phone", "calendar"] as const
                  ).map((t) => (
                    <button
                      key={t}
                      role="menuitem"
                      onClick={() => {
                        setPendingType(t);
                        setAddMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      {t === "phone"
                        ? "☎️ Phone"
                        : t === "calendar"
                        ? "📅 Calendar"
                        : t[0].toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Canvas ===== */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-1 shadow-xl">
        <div
          className="rounded-xl overflow-hidden border border-white/50 shadow-inner"
          style={{
            width: "100%",
            minHeight: 480,
            height: "60vh",
            background:
              "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            deleteKeyCode="Delete"
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={true}
          >
            <Background gap={20} size={1} color="#e9d5ff" style={{ opacity: 0.3 }} />
            <Controls
              showInteractive={false}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200"
            />
          </ReactFlow>
        </div>

        {!base && (
          <div className="px-4 py-3 text-sm text-foreground/80">
            No template found for <b>{bot}</b> in mode <b>{mode}</b>. Make sure your
            <code className="mx-1 px-1 rounded bg-muted/50">templates</code>{" "}
            storage includes a graph for this key+mode.
          </div>
        )}

        {pendingType && (
          <div className="mt-2 text-xs font-bold text-purple-700">
            Click on the canvas to place your new{" "}
            {pendingType === "phone"
              ? "Phone"
              : pendingType === "calendar"
              ? "Calendar"
              : pendingType[0].toUpperCase() + pendingType.slice(1)}{" "}
            node.
          </div>
        )}
      </div>

      {/* ===== Editor ===== */}
      <div
        ref={editorRef}
        className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg"
      >
        <div className="text-sm font-extrabold mb-3 text-purple-900">
          Edit Text <span className="font-normal text-purple-700">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={saveChanges}
              className="py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
            >
              Save Changes
            </button>
            <button
              onClick={deleteSelected}
              className="py-2 px-4 bg-white border-2 border-black rounded-lg hover:bg-rose-50 font-semibold text-sm"
              title="Delete selected node and its connections"
            >
              Delete Node
            </button>
            <div className="col-span-full text-xs text-purple-600 text-center">
              Changes are saved when you click the Save button
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   4)  Export with Provider wrapper to satisfy useReactFlow()
   ========================================================================= */

export default function Builder() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <BuilderInner />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
