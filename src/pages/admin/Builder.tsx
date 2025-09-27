// src/pages/admin/Builder.tsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import { getBotSettings } from "@/lib/botSettings";

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
  type?: "default" | "input" | "output" | "group" | "message" | "choice" | "action";
  data?: any;
};

const OV_KEY = (bot: string, mode: "basic" | "custom") => `botOverrides:${bot}_${mode}`;

function getOverrides(bot: string, mode: "basic" | "custom") {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}

function saveOverrides(bot: string, mode: "basic" | "custom", overrides: Record<string, any>) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(overrides));
}

/* -------------------------------- Component ------------------------------- */

export default function Builder() {
  const { currentBot } = useAdminStore();
  const mode = (getBotSettings(currentBot as any).mode || "basic") as "basic" | "custom";

  const tplKey = `${currentBot}_${mode}`;
  const base = useMemo(
    () => (templates as any)[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined,
    [tplKey]
  );

  const [overrides, setOverridesState] = useState<Record<string, any>>(() =>
    getOverrides(currentBot, mode)
  );

  const buildNodes = useCallback(
    (srcNodes: RFNode[], ov: Record<string, any>) =>
      srcNodes.map((n) => {
        const o = ov[n.id];
        return o?.data ? { ...n, data: { ...(n.data || {}), ...(o.data || {}) } } : n;
      }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    base ? buildNodes(base.nodes, overrides) : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(base ? base.edges : []);

  // rebuild when bot/mode changes (ensures correct flow shows)
  useEffect(() => {
    const nextBase = (templates as any)[`${currentBot}_${mode}`];
    const nextOv = getOverrides(currentBot, mode);
    setOverridesState(nextOv);
    if (nextBase) {
      setNodes(buildNodes(nextBase.nodes, nextOv) as Node[]);
      setEdges(nextBase.edges as Edge[]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [currentBot, mode, setNodes, setEdges, buildNodes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  useEffect(() => {
    if (!selectedId) return setEditorValues({});
    const n = nodes.find((x) => x.id === selectedId);
    setEditorValues(n?.data || {});
  }, [selectedId, nodes]);

  const onNodeClick = useCallback((_: any, n: Node) => setSelectedId(n?.id || null), []);
  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge(c, eds)),
    [setEdges]
  );

  const updateEditorValue = (key: string, value: any) =>
    setEditorValues((prev: any) => ({ ...prev, [key]: value }));

  const saveChanges = useCallback(() => {
    if (!selectedId) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedId ? { ...n, data: { ...editorValues } } : n)));
    const nextOv = { ...overrides, [selectedId]: { data: { ...editorValues } } };
    setOverridesState(nextOv);
    saveOverrides(currentBot, mode, nextOv);
  }, [selectedId, editorValues, overrides, setNodes, currentBot, mode]);

  /* ---------- HARD BLOCK of RF hotkeys when typing in inputs ----------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const isField =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          (t as HTMLElement).isContentEditable);
      if (!isField) return;
      // stop RF global listeners from seeing keystrokes
      e.stopPropagation();
      // don’t let Backspace/Delete hit RF or the browser history
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
      }
    };
    // capture-phase so we beat RF’s listeners
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true } as any);
  }, []);

  /* ------------------------------ Editor UI ------------------------------- */

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">{children}</div>
  );

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  const stop = (e: React.KeyboardEvent) => e.stopPropagation();

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
              onBlur={saveChanges}
              onKeyDown={stop}
              placeholder="Enter label…"
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.placeholder || ""}
              onChange={(e) => updateEditorValue("placeholder", e.target.value)}
              onBlur={saveChanges}
              onKeyDown={stop}
              placeholder="Enter placeholder…"
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
              onBlur={saveChanges}
              onKeyDown={stop}
              placeholder="Enter label…"
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
              onKeyDown={stop}
              placeholder={"Option 1\nOption 2\nOption 3"}
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
              onBlur={saveChanges}
              onKeyDown={stop}
              placeholder="Enter label…"
            />
          </div>
          <div>
            <FieldLabel>Email / Target</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.to || ""}
              onChange={(e) => updateEditorValue("to", e.target.value)}
              onBlur={saveChanges}
              onKeyDown={stop}
              placeholder="email@example.com"
            />
          </div>
        </div>
      );
    }

    // default = message
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            className={inputClass}
            value={editorValues.title || ""}
            onChange={(e) => updateEditorValue("title", e.target.value)}
            onBlur={saveChanges}
            onKeyDown={stop}
            placeholder="Enter title…"
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
            onKeyDown={stop}
            placeholder="Enter message text…"
          />
        </div>
      </div>
    );
  };

  /* --------------------------------- UI ----------------------------------- */

  return (
    <div className="w-full h-full grid grid-rows-[1fr_auto] gap-4">
      {/* Canvas wrapper (pastel) */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-1 shadow-xl">
        <div
          className="rounded-xl overflow-hidden border border-white/50 shadow-inner"
          style={{
            width: "100%",
            minHeight: 480,
            height: "70vh",
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
            /* Hard-disable delete/backspace shortcut */
            deleteKeyCode={null}
          >
            <Background gap={20} size={1} color="#e9d5ff" style={{ opacity: 0.3 }} />
            <Controls
              showInteractive={false}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Editor (pastel) */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg">
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
              Changes auto-save when you click away from a field
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
