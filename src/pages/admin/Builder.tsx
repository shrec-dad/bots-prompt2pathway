// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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

  // Per-bot/mode overrides
  const [overrides, setOv] = useState<Record<string, any>>(() => getOverrides(currentBot, mode));

  // Apply overrides to the base template
  const merged = useMemo(() => {
    const nodes = base.nodes.map((n) => {
      const o = overrides[n.id];
      return o ? { ...n, data: mergeDeep(n.data || {}, o.data || {}) } : n;
    });
    const edges = base.edges;
    return { nodes, edges };
  }, [base.nodes, base.edges, overrides]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(merged.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(merged.edges);

  // Keep RF state in sync when merged changes (only on template/mode change)
  useEffect(() => {
    setNodes(merged.nodes as Node[]);
    setEdges(merged.edges as Edge[]);
  }, [tplKey]); // Only update when template key changes, not on every override change

  // Selection + editor binding
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedId(node?.id || null);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  // Save editor changes (persist + live update)
  const saveField = useCallback((patch: Partial<RFNode["data"]>) => {
    if (!selectedId) return;
    
    // Update overrides
    const currentOverride = overrides[selectedId] || {};
    const newData = { ...((currentOverride.data) || {}), ...patch };
    const next = {
      ...overrides,
      [selectedId]: { data: newData },
    };
    
    setOv(next);
    setOverrides(currentBot, mode, next);

    // Live update selected node in RF state
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === selectedId) {
          return { ...n, data: { ...(n.data || {}), ...patch } };
        }
        return n;
      })
    );
  }, [selectedId, overrides, currentBot, mode, setNodes]);

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

    const common = "w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold";

    if (selected.type === "message" || selected.type === "default" || !selected.type) {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Title</FieldLabel>
            <input
              className={common}
              value={selected.data?.title ?? ""}
              onChange={(e) => saveField({ title: e.target.value })}
              placeholder="Enter title..."
            />
          </div>
          <div>
            <FieldLabel>Text</FieldLabel>
            <textarea
              className={common}
              rows={4}
              value={selected.data?.text ?? ""}
              onChange={(e) => saveField({ text: e.target.value })}
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
              value={selected.data?.label ?? ""}
              onChange={(e) => saveField({ label: e.target.value })}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={common}
              value={selected.data?.placeholder ?? ""}
              onChange={(e) => saveField({ placeholder: e.target.value })}
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
              value={selected.data?.label ?? ""}
              onChange={(e) => saveField({ label: e.target.value })}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Options (one per line)</FieldLabel>
            <textarea
              className={common}
              rows={5}
              value={options.join("\n")}
              onChange={(e) =>
                saveField({
                  options: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
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
              value={selected.data?.label ?? ""}
              onChange={(e) => saveField({ label: e.target.value })}
              placeholder="Enter label..."
            />
          </div>
          <div>
            <FieldLabel>Email / Target</FieldLabel>
            <input
              className={common}
              value={selected.data?.to ?? ""}
              onChange={(e) => saveField({ to: e.target.value })}
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
      {/* Canvas wrapper with a subtle gradient */}
      <div className="rounded-2xl border bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-emerald-50 p-1">
        {/* EXPLICIT HEIGHT FIX: React Flow needs a concrete height */}
        <div
          className="rounded-xl overflow-hidden border bg-white"
          style={{ width: "100%", minHeight: 480, height: "70vh" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes} // Register custom node types here
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} color="#d1d5db" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {/* Side editor box */}
      <div className="rounded-2xl border bg-card p-4 ring-1 ring-border">
        <div className="text-sm font-extrabold mb-2">
          Edit Text <span className="font-normal text-foreground/70">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-3 text-xs text-foreground/70">
            Changes save automatically for this bot (<b>{currentBot}</b>) in <b>{mode}</b> mode.
          </div>
        )}
      </div>
    </div>
  );
}
