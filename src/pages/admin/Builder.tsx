// src/pages/admin/Builder.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background, Controls, addEdge,
  useEdgesState, useNodesState,
  Connection, Edge, Node, Handle, Position
} from "reactflow";
import "reactflow/dist/style.css";

import { useSearchParams, useNavigate } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings, BotKey } from "@/lib/botSettings";

/* ----------------------- Custom pastel nodes ----------------------- */
const MessageNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data.title || "Message"}</div>
    <div className="text-gray-500 text-sm">{data.text || "..."}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ChoiceNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data.label || "Choice"}</div>
    <div className="text-xs text-gray-600 mt-1">
      {(data.options || []).join(" | ") || "No options"}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data.label || "Action"}</div>
    <div className="text-xs text-gray-600">{data.to || "..."}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const InputNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data.label || "Input"}</div>
    <div className="text-xs text-gray-600">{data.placeholder || "..."}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = { message: MessageNode, choice: ChoiceNode, action: ActionNode, input: InputNode };

/* ----------------------------- Helpers ----------------------------- */
type RFNode = Node & {
  type?: "default" | "input" | "output" | "group" | "message" | "choice" | "action";
  data?: any;
};

const BOT_OPTIONS: { key: BotKey; label: string }[] = [
  { key: "LeadQualifier", label: "Lead Qualifier" },
  { key: "AppointmentBooking", label: "Appointment Booking" },
  { key: "CustomerSupport", label: "Customer Support" },
  { key: "Waitlist", label: "Waitlist" },
  { key: "SocialMedia", label: "Social Media" },
];

const OV_KEY = (bot: string, mode: "basic" | "custom") => `botOverrides:${bot}_${mode}`;

function getOverrides(bot: string, mode: "basic" | "custom") {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}
function saveOverrides(bot: string, mode: "basic" | "custom", ov: Record<string, any>) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(ov));
}

/* ----------------------------- Component --------------------------- */
export default function Builder() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // current bot from store, but allow ?bot= to override
  const { currentBot, setCurrentBot } = useAdminStore();
  const urlBot = (sp.get("bot") as BotKey) || currentBot || "Waitlist";

  // update store if url differs
  useEffect(() => {
    if (urlBot !== currentBot) setCurrentBot(urlBot);
  }, [urlBot, currentBot, setCurrentBot]);

  const mode = (getBotSettings(urlBot).mode || "basic") as "basic" | "custom";
  const tplKey = `${urlBot}_${mode}`;
  const base = templates[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined;

  const [overrides, setOverridesState] = useState<Record<string, any>>(() =>
    getOverrides(urlBot, mode)
  );

  const getInitialNodes = useCallback(() => {
    if (!base) return [];
    return base.nodes.map((bn) => {
      const ov = overrides[bn.id];
      if (ov && ov.data) return { ...bn, data: { ...(bn.data || {}), ...(ov.data || {}) } };
      return bn;
    });
  }, [base, overrides]);

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(base?.edges || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  // Reload when bot or mode changes
  useEffect(() => {
    setOverridesState(getOverrides(urlBot, mode));
  }, [urlBot, mode]);

  useEffect(() => {
    setNodes(getInitialNodes());
    setEdges(base?.edges || []);
    setSelectedId(null);
    setEditorValues({});
  }, [getInitialNodes, base, setNodes, setEdges]);

  useEffect(() => {
    if (selectedId) {
      const n = nodes.find((n) => n.id === selectedId);
      setEditorValues(n?.data || {});
    } else {
      setEditorValues({});
    }
  }, [selectedId, nodes]);

  const onNodeClick = useCallback((_, node: Node) => setSelectedId(node?.id || null), []);
  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);

  const updateEditorValue = (field: string, value: any) =>
    setEditorValues((p: any) => ({ ...p, [field]: value }));

  const saveChanges = useCallback(() => {
    if (!selectedId) return;

    setNodes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, data: { ...editorValues } } : n))
    );

    const nextOv = { ...overrides, [selectedId]: { data: editorValues } };
    setOverridesState(nextOv);
    saveOverrides(urlBot, mode, nextOv);
  }, [selectedId, editorValues, overrides, urlBot, mode, setNodes]);

  // header UI
  const Header = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="text-xl font-extrabold">Builder</div>
        <select
          value={urlBot}
          onChange={(e) => {
            const bot = e.target.value as BotKey;
            setSp((old) => {
              const next = new URLSearchParams(old);
              next.set("bot", bot);
              return next;
            });
            setCurrentBot(bot);
            // nodes reload is handled by useEffect watching urlBot/mode
          }}
          className="rounded-lg border px-3 py-2 font-bold"
        >
          {BOT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => navigate("/admin/preview")}
        className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
      >
        Open Preview
      </button>
    </div>
  );

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">{children}</div>
  );
  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  const Editor = () => {
    if (!selectedId) return <div className="text-sm text-purple-600">Select a node to edit.</div>;

    const n = nodes.find((x) => x.id === selectedId);
    if (!n) return null;

    if (n.type === "choice") {
      const options = editorValues.options || [];
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onBlur={saveChanges}
              placeholder="Label…"
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
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                )
              }
              onBlur={saveChanges}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
          </div>
        </div>
      );
    }

    if (n.type === "action") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onBlur={saveChanges}
              placeholder="Label…"
            />
          </div>
          <div>
            <FieldLabel>Email / Target</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.to || ""}
              onChange={(e) => updateEditorValue("to", e.target.value)}
              onBlur={saveChanges}
              placeholder="email@example.com"
            />
          </div>
        </div>
      );
    }

    if (n.type === "input") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onBlur={saveChanges}
              placeholder="Label…"
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.placeholder || ""}
              onChange={(e) => updateEditorValue("placeholder", e.target.value)}
              onBlur={saveChanges}
              placeholder="Enter text…"
            />
          </div>
        </div>
      );
    }

    // default/message
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            className={inputClass}
            value={editorValues.title || ""}
            onChange={(e) => updateEditorValue("title", e.target.value)}
            onBlur={saveChanges}
            placeholder="Title…"
          />
        </div>
        <div>
          <FieldLabel>Text</FieldLabel>
          <textarea
            className={inputClass}
            rows={4}
            value={editorValues.text || ""}
            onChange={(e) => updateEditorValue("text", e.target.value)}
            onBlur={saveChanges}
            placeholder="Enter message text…"
          />
        </div>
      </div>
    );
  };

  if (!base) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <Header />
        <div className="text-sm">No template found for <b>{tplKey}</b>.</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] gap-4 p-1">
      <Header />

      {/* Canvas wrapper with pastel gradient */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-1 shadow-xl">
        <div
          className="rounded-xl overflow-hidden border border-white/50 shadow-inner"
          style={{
            width: "100%",
            minHeight: 480,
            height: "60vh",
            background:
              "linear-gradient(135deg,#ffeef8 0%,#f3e7fc 25%,#e7f0ff 50%,#e7fcf7 75%,#fff9e7 100%)",
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
          >
            <Background gap={20} size={1} color="#e9d5ff" style={{ opacity: 0.3 }} />
            <Controls
              showInteractive={false}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Editor box */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg">
        <div className="text-sm font-extrabold mb-3 text-purple-900">
          Edit Text <span className="font-normal text-purple-700">(per node)</span>
        </div>
        <Editor />
        {selectedId && (
          <div className="mt-4 space-y-2">
            <button
              onClick={saveChanges}
              className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
            >
              Save Changes
            </button>
            <div className="text-xs text-purple-600 text-center">
              Changes auto-save when you click away from a field
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
