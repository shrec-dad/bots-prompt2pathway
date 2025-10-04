// src/pages/admin/Builder.tsx
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import ReactFlow, {
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
} from "reactflow";
import "reactflow/dist/style.css";

import { useSearchParams } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";
import { getTemplate, listTemplateDefs, type BotKey } from "@/lib/templates";
import { getBotSettings, setBotSettings } from "@/lib/botSettings";
import { listInstances, type InstanceMeta } from "@/lib/instances";

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
   1)  Custom Node components (same visual style you liked)
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

const nodeTypes = {
  message: MessageNode,
  choice: ChoiceNode,
  action: ActionNode,
  input: InputNode,
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
    | "action";
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

  // existing query-string support
  const queryInst = search.get("inst") || undefined;
  const queryBot = (search.get("bot") as string | null) || null;

  // templates (dynamic: built-in + custom)
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
  ] as BotKey[]);

  // NOTE: AdminStore in your project uses fixed built-ins.
  // To avoid conflicts, only sync when the key is one of the built-ins.
  const { currentBot, setCurrentBot } = useAdminStore() as {
    currentBot: any;
    setCurrentBot?: (key: any) => void;
  };

  // list client instances for dropdown
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

  // Build initial source from URL or default to first template
  const initialSource: Source = useMemo(() => {
    if (queryInst) {
      return { kind: "inst", id: queryInst, meta: readInstMeta(queryInst) };
    }
    const defaultKey =
      queryBot ||
      defs[0]?.key ||
      "LeadQualifier"; // safe fallback if nothing exists yet
    return { kind: "tpl", bot: defaultKey };
  }, [queryInst, queryBot, defs]);

  const [source, setSource] = useState<Source>(initialSource);

  // Derived: bot (base template) and mode based on source
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

  // Keep admin store in sync when editing a template (only for built-ins)
  useEffect(() => {
    if (source.kind === "tpl" && BUILTIN_KEYS.has(bot as BotKey)) {
      if (setCurrentBot && bot !== currentBot) setCurrentBot(bot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, source.kind]);

  // If user changes AdminStore elsewhere, reflect it for built-ins only
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBot]);

  // ReactFlow data (template + overrides)
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

  // Rebuild when bot/mode/source changes
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
      // persist on instance meta
      writeInstMeta(source.id, { baseKey: bot, mode: next });
    } else {
      setBotSettings(bot as any, { mode: next });
    }
  }

  // selection + editor
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  useEffect(() => {
    if (!selectedId) return setEditorValues({}); // clear if nothing selected
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

  // ====== Add/Place/Delete Node ======
  const rf = useReactFlow<RFNode, Edge>();
  const [pendingType, setPendingType] = useState<
    null | "message" | "choice" | "input" | "action"
  >(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const nextId = () =>
    `node_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  const defaultDataFor = (t: Exclude<typeof pendingType, null>) =>
    t === "message"
      ? { title: "New Message", text: "Edit me…" }
      : t === "choice"
      ? { label: "Choose one", options: ["Option A", "Option B"] }
      : t === "input"
      ? { label: "Your input", placeholder: "Type here…" }
      : { label: "Action", to: "mailto:example@domain.com" };

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

  // Avoid ReactFlow swallowing editor keystrokes
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

  // ====== Dropdown with Templates + Client Bots ======
  // Value is "tpl:<key>" OR "inst:<id>"
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

      // reflect in query string for deep-linking
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
        (getBotSettings(key as any).mode as "basic" | "custom") ||
        ("custom" as const);

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

  // UI helpers
  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">
      {children}
    </div>
  );

  const Editor = () => {
    if (!selected)
      return (
        <div className="text-sm text-purple-600">
          Select a node above to edit its text and labels.
        </div>
      );

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
              onChange={(e) =>
                updateEditorValue("placeholder", e.target.value)
              }
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

    // default => message
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
            {/* Combined dropdown */}
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-foreground/70">
                Mode
              </span>
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-md px-2 py-1 text-xs font-bold ring-1 ring-border ${
                    mode === "basic" ? "bg-indigo-100" : "hover:bg-muted/40 bg-white"
                  }`}
                  onClick={() => onModeChange("basic")}
                >
                  basic
                </button>
                <button
                  className={`rounded-md px-2 py-1 text-xs font-bold ring-1 ring-border ${
                    mode === "custom" ? "bg-indigo-100" : "hover:bg-muted/40 bg-white"
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
                  className="absolute right-0 mt-2 w-40 rounded-lg border-2 border-black bg-white shadow-xl z-20"
                >
                  {(["message", "choice", "input", "action"] as const).map(
                    (t) => (
                      <button
                        key={t}
                        role="menuitem"
                        onClick={() => {
                          setPendingType(t);
                          setAddMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                      >
                        {t[0].toUpperCase() + t.slice(1)} (click to place)
                      </button>
                    )
                  )}
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
            <Background
              gap={20}
              size={1}
              color="#e9d5ff"
              style={{ opacity: 0.3 }}
            />
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
            {pendingType[0].toUpperCase() + pendingType.slice(1)} node.
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
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}
