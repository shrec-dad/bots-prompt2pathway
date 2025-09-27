// src/pages/admin/Builder.tsx
import React, { useMemo, useState, useCallback } from "react";
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
/* Helpers: deep-merge + per-bot/mode overrides persisted to storage */
/* ------------------------------------------------------------------ */

type RFNode = Node & {
  type?: "default" | "input" | "output" | "group" | "message" | "choice" | "action";
  data?: any;
};

function mergeDeep<T>(base: T, patch: Partial<T>): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k in patch) {
    const v: any = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = mergeDeep((out as any)[k], v);
    else out[k] = v;
  }
  return out;
}

const OV_KEY = (bot: string, mode: "basic" | "custom") => `botOverrides:${bot}_${mode}`;

function getOverrides(bot: string, mode: "basic" | "custom") {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}

function setOverrides(bot: string, mode: "basic" | "custom", next: Record<string, any>) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(next));
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function Builder() {
  const { currentBot } = useAdminStore();
  const mode = (getBotSettings(currentBot as any).mode || "basic") as "basic" | "custom";
  const tplKey = `${currentBot}_${mode}`;
  const base = templates[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined;

  // ---- Missing-template guard (so we don't render a blank canvas)
  if (!base) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-lg font-extrabold mb-1">No flow template found</div>
        <div className="text-sm text-foreground/70">
          I couldn't find a template for <b>{currentBot}</b> in <b>{mode}</b> mode.&nbsp;
          Make sure there is an entry in <code>templates</code> for{" "}
          <code>{tplKey}</code>.
        </div>
      </div>
    );
  }

  // Per-bot/mode overrides - store as state
  const [overrides, setOverridesState] = useState<Record<string, any>>(() => 
    getOverrides(currentBot, mode)
  );

  // Apply overrides to the base template to get initial nodes
  const initialNodes = useMemo(() => {
    return base.nodes.map((n) => {
      const o = overrides[n.id];
      return o ? { ...n, data: mergeDeep(n.data || {}, o.data || {}) } : n;
    });
  }, [base.nodes, overrides]);

  // React Flow state - initialize with merged nodes
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(base.edges);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Find selected node from current nodes state
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

  // Save editor changes
  const saveField = useCallback((fieldName: string, value: any) => {
    if (!selectedId) return;
    
    // Create the patch object
    const patch = { [fieldName]: value };
    
    // Update nodes state immediately for UI responsiveness
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === selectedId) {
          return {
            ...node,
            data: {
              ...(node.data || {}),
              ...patch
            }
          };
        }
        return node;
      })
    );
    
    // Update overrides for persistence
    setOverridesState((prevOverrides) => {
      const currentOverride = prevOverrides[selectedId] || {};
      const newOverrides = {
        ...prevOverrides,
        [selectedId]: { 
          data: { 
            ...(currentOverride.data || {}), 
            ...patch 
          } 
        },
      };
      
      // Save to localStorage
      setOverrides(currentBot, mode, newOverrides);
      
      return newOverrides;
    });
  }, [selectedId, currentBot, mode, setNodes]);

  // Small label helper
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-foreground/80 mb-1">{children}</div>
  );

  // Side editor UI (per node type)
  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-foreground/70">
          Select a node above to edit its text and labels.
        </div>
      );
    }

    const common = "w-full rounded-lg border bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400";

    if (selected.type === "message" || selected.type === "default" || !selected.type) {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Title</FieldLabel>
            <input
              className={common}
              value={selected.data?.title || ""}
              onChange={(e) => saveField("title", e.target.value)}
              placeholder="Enter title..."
            />
          </div>
          <div>
            <FieldLabel>Text</FieldLabel>
            <textarea
              className={common}
              rows={4}
              value={selected.data?.text || ""}
              onChange={(e) => saveField("text", e.target.value)}
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
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField("label", e.target.value)}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={common}
              value={selected.data?.placeholder || ""}
              onChange={(e) => saveField("placeholder", e.target.value)}
              placeholder="Enter placeholder text..."
            />
          </div>
        </div>
      );
    }

    if (selected.type === "choice") {
      const options: string[] = selected.data?.options || [];
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField("label", e.target.value)}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Options (one per line)</FieldLabel>
            <textarea
              className={common}
              rows={5}
              value={options.join("\n")}
              onChange={(e) => {
                const newOptions = e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
                saveField("options", newOptions);
              }}
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
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField("label", e.target.value)}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Email / Target</FieldLabel>
            <input
              className={common}
              value={selected.data?.to || ""}
              onChange={(e) => saveField("to", e.target.value)}
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
        {/* React Flow container with pastel background */}
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

      {/* Side editor box with matching pastel theme */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg">
        <div className="text-sm font-extrabold mb-2 text-purple-900">
          Edit Text <span className="font-normal text-purple-700">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-3 text-xs text-purple-600">
            Changes save automatically for this bot (<b>{currentBot}</b>) in <b>{mode}</b> mode.
          </div>
        )}
      </div>
    </div>
  );
}
