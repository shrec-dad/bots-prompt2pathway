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

/* ------------------------------------------------------------------ */
/* Custom Node Components (visuals kept the same; just added handle ids) */
/* ------------------------------------------------------------------ */

const cardBase =
  "px-4 py-2 shadow-md rounded-md border-2 bg-white text-[13px] leading-snug";

const MessageNode = ({ data }: { data: any }) => (
  <div className={`${cardBase} border-stone-400 select-none`}>
    <Handle id="in" type="target" position={Position.Top} />
    <div className="font-bold">{data?.title || "Message"}</div>
    <div className="text-gray-500 text-sm">{data?.text || "..."}</div>
    {/* default "out" for message */}
    <Handle id="out" type="source" position={Position.Bottom} />
  </div>
);

const ChoiceNode = ({ data }: { data: any }) => (
  <div className={`${cardBase} border-blue-400 bg-blue-50 select-none`}>
    <Handle id="in" type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Choice"}</div>
    <div className="text-xs text-gray-600 mt-1">
      {(data?.options || []).join(" · ") || "No options"}
    </div>
    {/* default "out" for choice */}
    <Handle id="out" type="source" position={Position.Bottom} />
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className={`${cardBase} border-green-400 bg-green-50 select-none`}>
    <Handle id="in" type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Action"}</div>
    <div className="text-xs text-gray-600">{data?.to || "..."}</div>
    {/* default "out" for action */}
    <Handle id="out" type="source" position={Position.Bottom} />
  </div>
);

const InputNode = ({ data }: { data: any }) => (
  <div className={`${cardBase} border-purple-400 bg-purple-50 select-none`}>
    <Handle id="in" type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Input"}</div>
    <div className="text-xs text-gray-600">{data?.placeholder || "..."}</div>
    {/* many templates point edges to sourceHandle: "submit" */}
    <Handle id="submit" type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = {
  message: MessageNode,
  choice: ChoiceNode,
  action: ActionNode,
  input: InputNode,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

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
  overrides: Record<string, any>
) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(overrides));
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function Builder() {
  const { currentBot } = useAdminStore();
  const mode = (getBotSettings(currentBot as any).mode ||
    "basic") as "basic" | "custom";
  const tplKey = `${currentBot}_${mode}`;
  const base = templates[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined;

  const [overrides, setOverridesState] = useState<Record<string, any>>(() =>
    getOverrides(currentBot, mode)
  );

  if (!base) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-lg font-extrabold mb-1">No flow template found</div>
        <div className="text-sm text-foreground/70">
          I couldn't find a template for <b>{currentBot}</b> in <b>{mode}</b> mode.&nbsp;
          Make sure there is an entry in <code>templates</code> for <code>{tplKey}</code>.
        </div>
      </div>
    );
  }

  const getInitialNodes = () =>
    base.nodes.map((n) => {
      const o = overrides[n.id];
      return o?.data ? { ...n, data: { ...(n.data || {}), ...o.data } } : n;
    });

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(base.edges);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  useEffect(() => {
    if (selectedId) {
      const node = nodes.find((n) => n.id === selectedId);
      setEditorValues(node?.data || {});
    } else {
      setEditorValues({});
    }
  }, [selectedId, nodes]);

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedId(node?.id || null);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Local editor updates (no canvas re-render)
  const updateEditorValue = (field: string, value: any) =>
    setEditorValues((p: any) => ({ ...p, [field]: value }));

  const saveChanges = useCallback(() => {
    if (!selectedId) return;

    setNodes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, data: { ...editorValues } } : n))
    );

    const next = { ...overrides, [selectedId]: { data: editorValues } };
    setOverridesState(next);
    saveOverrides(currentBot, mode, next);
  }, [selectedId, editorValues, overrides, currentBot, mode, setNodes]);

  // prevent the editor from bubbling events into the canvas
  const stopAll = (e: React.SyntheticEvent) => e.stopPropagation();

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">
      {children}
    </div>
  );

  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-purple-600">
          Select a node above to edit its text and labels.
        </div>
      );
    }

    if (selected.type === "message" || selected.type === "default" || !selected.type) {
      return (
        <div className="space-y-3" onMouseDown={stopAll} onClick={stopAll}>
          <div>
            <FieldLabel>Title</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.title || ""}
              onChange={(e) => updateEditorValue("title", e.target.value)}
              onBlur={saveChanges}
              placeholder="Enter title..."
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
              placeholder="Enter message text..."
            />
          </div>
        </div>
      );
    }

    if (selected.type === "input") {
      return (
        <div className="space-y-3" onMouseDown={stopAll} onClick={stopAll}>
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onBlur={saveChanges}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.placeholder || ""}
              onChange={(e) => updateEditorValue("placeholder", e.target.value)}
              onBlur={saveChanges}
              placeholder="Enter placeholder text..."
            />
          </div>
        </div>
      );
    }

    if (selected.type === "choice") {
      const options: string[] = editorValues.options || [];
      return (
        <div className="space-y-3" onMouseDown={stopAll} onClick={stopAll}>
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onBlur={saveChanges}
              placeholder="Enter label..."
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
              placeholder={"Option 1\nOption 2\nOption 3"}
            />
          </div>
        </div>
      );
    }

    if (selected.type === "action") {
      return (
        <div className="space-y-3" onMouseDown={stopAll} onClick={stopAll}>
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onBlur={saveChanges}
              placeholder="Enter label..."
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

    return null;
  };

  return (
    <div className="w-full h-full grid grid-rows-[1fr_auto] gap-4">
      {/* Pastel canvas wrapper (unchanged visuals) */}
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
            selectionOnDrag={false}
            nodesDraggable
            nodesConnectable
            nodesFocusable
            elevateNodesOnSelect
          >
            <Background gap={20} size={1} color="#e9d5ff" style={{ opacity: 0.3 }} />
            <Controls
              showInteractive={false}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Editor (unchanged visuals, events don’t bubble) */}
      <div
        className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg"
        onMouseDown={stopAll}
        onClick={stopAll}
      >
        <div className="text-sm font-extrabold mb-3 text-purple-900">
          Edit Text <span className="font-normal text-purple-700">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-4 space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveChanges();
              }}
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
