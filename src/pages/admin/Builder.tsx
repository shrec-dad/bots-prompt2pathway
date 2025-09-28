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
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings, BotKey } from "@/lib/botSettings";

/* ------------------------- Custom Node Components ------------------------- */

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

/* --------------------------------- Helpers -------------------------------- */

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

function getOverrides(bot: string, mode: "basic" | "custom") {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}
function saveOverrides(
  bot: string,
  mode: "basic" | "custom",
  ov: Record<string, any>
) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(ov));
}

/* -------------------------------- Component ------------------------------- */

const ALL_BOTS: BotKey[] = [
  "LeadQualifier",
  "AppointmentBooking",
  "CustomerSupport",
  "Waitlist",
  "SocialMedia",
];

export default function Builder() {
  const { currentBot, setCurrentBot } = useAdminStore();
  const activeBot: BotKey = (currentBot as BotKey) ?? "LeadQualifier";
  const mode = (getBotSettings(activeBot).mode || "basic") as
    | "basic"
    | "custom";

  const editorRef = useRef<HTMLDivElement>(null);

  const tplKey = `${activeBot}_${mode}`;
  const base = useMemo(
    () => (templates as any)[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined,
    [tplKey]
  );

  const [overrides, setOv] = useState<Record<string, any>>(() =>
    getOverrides(activeBot, mode)
  );

  const buildNodes = useCallback(
    (src: RFNode[], ov: Record<string, any>) =>
      src.map((n) =>
        ov[n.id]?.data ? { ...n, data: { ...(n.data || {}), ...ov[n.id].data } } : n
      ),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    base ? (buildNodes(base.nodes, overrides) as Node[]) : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(base ? base.edges : []);

  // Refresh when bot/mode changes
  useEffect(() => {
    const nextBase = (templates as any)[`${activeBot}_${mode}`];
    const nextOv = getOverrides(activeBot, mode);
    setOv(nextOv);
    if (nextBase) {
      setNodes(buildNodes(nextBase.nodes, nextOv) as Node[]);
      setEdges(nextBase.edges as Edge[]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [activeBot, mode, setNodes, setEdges, buildNodes]);

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
    const nextOv = { ...overrides, [selectedId]: { data: { ...editorValues } } };
    setOv(nextOv);
    saveOverrides(activeBot, mode, nextOv);
  }, [selectedId, editorValues, overrides, setNodes, activeBot, mode]);

  // ✅ FIX: remove capture-phase global blockers. Just stop bubbling so ReactFlow
  // doesn't intercept keys, but let inputs keep receiving keystrokes.
  const stopKeyBubble = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // do NOT preventDefault
  };

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">
      {children}
    </div>
  );

  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-purple-600">
          Select a node above to edit its text and labels.
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
              onKeyDown={stopKeyBubble}
              onKeyUp={stopKeyBubble}
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
              onKeyDown={stopKeyBubble}
              onKeyUp={stopKeyBubble}
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
              onKeyDown={stopKeyBubble}
              onKeyUp={stopKeyBubble}
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
                    .filter((s) => s.trim())
                    .map((s) => s.trim())
                )
              }
              placeholder={"Option 1\nOption 2\nOption 3"}
              autoComplete="off"
              onKeyDown={stopKeyBubble}
              onKeyUp={stopKeyBubble}
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
              onKeyDown={stopKeyBubble}
              onKeyUp={stopKeyBubble}
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
              onKeyDown={stopKeyBubble}
              onKeyUp={stopKeyBubble}
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
            onKeyDown={stopKeyBubble}
            onKeyUp={stopKeyBubble}
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
            onKeyDown={stopKeyBubble}
            onKeyUp={stopKeyBubble}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] gap-4">
      {/* Top bar with Bots dropdown (arrow is the native select caret) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase text-purple-700">
            Bot
          </label>
          <select
            className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={activeBot}
            onChange={(e) => {
              const val = e.target.value as BotKey;
              // update global store if available; otherwise persist locally
              setCurrentBot?.(val);
              if (!setCurrentBot) {
                localStorage.setItem("currentBot", val);
                // optional: refresh templates if your store relies on it
                window.location.reload();
              }
            }}
          >
            {ALL_BOTS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm font-extrabold text-purple-900">
          Mode: <span className="font-normal">{mode}</span>
        </div>
      </div>

      {/* Canvas (pastel) */}
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
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            deleteKeyCode="Delete"
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            panOnDrag
            zoomOnScroll
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
      </div>

      {/* Editor (pastel) */}
      <div
        ref={editorRef}
        className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg"
        onKeyDown={stopKeyBubble}
        onKeyUp={stopKeyBubble}
      >
        <div className="text-sm font-extrabold mb-3 text-purple-900">
          Edit Text <span className="font-normal text-purple-700">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-4 space-y-2">
            <button
              onClick={saveChanges}
              className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
            >
              Save Changes
            </button>
            <div className="text-xs text-purple-600 text-center">
              Changes are saved when you click the Save button
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
