// src/pages/admin/Builder.tsx
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
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
/* Custom Node Components                                            */
/* ------------------------------------------------------------------ */

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

// Register custom node types
const nodeTypes = {
  message: MessageNode,
  choice: ChoiceNode,
  action: ActionNode,
  input: InputNode,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function Builder() {
  const { currentBot } = useAdminStore();
  const mode = (getBotSettings(currentBot as any).mode || "basic") as "basic" | "custom";
  const tplKey = `${currentBot}_${mode}`;
  const base = templates[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined;

  // Store overrides in state
  const [overrides, setOverridesState] = useState<Record<string, any>>(() => 
    getOverrides(currentBot, mode)
  );

  // ---- Missing-template guard
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

  // Merge base template with overrides
  const getInitialNodes = () => {
    return base.nodes.map((baseNode) => {
      const override = overrides[baseNode.id];
      if (override && override.data) {
        return {
          ...baseNode,
          data: { ...(baseNode.data || {}), ...(override.data || {}) }
        };
      }
      return baseNode;
    });
  };

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(base.edges);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Local form state for the editor (this prevents the re-render issues)
  const [editorValues, setEditorValues] = useState<any>({});

  // When selection changes, populate editor values from the selected node
  useEffect(() => {
    if (selectedId) {
      const node = nodes.find(n => n.id === selectedId);
      if (node) {
        setEditorValues(node.data || {});
      }
    } else {
      setEditorValues({});
    }
  }, [selectedId, nodes]);

  // Get selected node
  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  // Handle node click
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedId(node?.id || null);
  }, []);

  // Handle connections
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  // Update local editor state
  const updateEditorValue = (field: string, value: any) => {
    setEditorValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save changes (called on blur or with debounce)
  const saveChanges = useCallback(() => {
    if (!selectedId || !editorValues) return;

    // Update nodes
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === selectedId) {
          return {
            ...node,
            data: { ...editorValues }
          };
        }
        return node;
      })
    );

    // Update and persist overrides
    const newOverrides = {
      ...overrides,
      [selectedId]: { data: editorValues }
    };
    setOverridesState(newOverrides);
    saveOverrides(currentBot, mode, newOverrides);
  }, [selectedId, editorValues, currentBot, mode, setNodes, overrides]);

  // Small label helper
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">{children}</div>
  );

  // Side editor UI
  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-purple-600">
          Select a node above to edit its text and labels.
        </div>
      );
    }

    const inputClass = "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

    if (selected.type === "message" || selected.type === "default" || !selected.type) {
      return (
        <div className="space-y-3">
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
        <div className="space-y-3">
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
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Options (one per line)</FieldLabel>
            <textarea
              className={inputClass}
              rows={5}
              value={options.join("\n")}
              onChange={(e) => {
                const newOptions = e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                updateEditorValue("options", newOptions);
              }}
              onBlur={saveChanges}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
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
      {/* Canvas wrapper with beautiful pastel gradient */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-1 shadow-xl">
        {/* React Flow container */}
        <div
          className="rounded-xl overflow-hidden border border-white/50 shadow-inner"
          style={{ 
            width: "100%", 
            minHeight: 480, 
            height: "70vh",
            background: "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)"
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

      {/* Side editor box */}
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
