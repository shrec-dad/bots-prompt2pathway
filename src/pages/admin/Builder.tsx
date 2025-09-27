// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

/* --------------------------------- Types --------------------------------- */

type NodeData = {
  // Common fields we let the user edit.
  title?: string;        // for "message" nodes
  text?: string;         // for "message" nodes
  label?: string;        // for "input", "choice", "action"
  placeholder?: string;  // for "input"
  options?: string[];    // for "choice"
  to?: string;           // for "action" (email/target)
};

type RFNode = Node<NodeData>;

/* ------------------------------ Deep merge util ----------------------------- */

function deepMerge<T extends object>(base: T, patch: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k in patch) {
    const v: any = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge((out as any)[k] ?? {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/* ----------------------------- Per-bot overrides ---------------------------- */

const ovKey = (bot: string, mode: "basic" | "custom") => `botOverrides:${bot}_${mode}`;

function loadOverrides(bot: string, mode: "basic" | "custom"): Record<string, Partial<NodeData>> {
  try {
    const raw = localStorage.getItem(ovKey(bot, mode));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveOverrides(bot: string, mode: "basic" | "custom", value: Record<string, Partial<NodeData>>) {
  localStorage.setItem(ovKey(bot, mode), JSON.stringify(value));
}

/* ----------------------------- Custom node view ----------------------------- */
/* One visual component for all four logical types. Keeps things stable. */

const Card: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <div className="rounded-xl border border-black/60 bg-white shadow-sm">
      <div className="px-4 py-3">
        {title && <div className="font-bold">{title}</div>}
        {subtitle && <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>}
      </div>
    </div>
  );
};

const CustomNode: React.FC<{ data: NodeData }> = ({ data }) => {
  // Show best-available bits so nodes are always legible while editing.
  const title =
    data.title ??
    data.label ??
    (data.text ? data.text.slice(0, 24) + (data.text.length > 24 ? "…" : "") : "");
  const subtitle =
    data.placeholder ??
    (Array.isArray(data.options) && data.options.length
      ? data.options.join(" · ")
      : data.to);

  return (
    <div className="relative">
      {/* default single source/target handles so edges remain valid */}
      <Handle type="target" position={Position.Top} />
      <Card title={title} subtitle={subtitle} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  message: CustomNode,
  input: CustomNode,
  choice: CustomNode,
  action: CustomNode,
};

/* --------------------------------- Builder --------------------------------- */

export default function Builder() {
  const { currentBot } = useAdminStore();                // e.g. "LeadQualifier"
  const mode = getBotSettings(currentBot as any).mode as "basic" | "custom";
  const tplKey = `${currentBot}_${mode}`;

  // Load base template once per bot/mode.
  const base = templates[tplKey];

  // Local overrides (do NOT rebuild nodes on each keystroke).
  const [overrides, setOverrides] = useState<Record<string, Partial<NodeData>>>(() =>
    loadOverrides(currentBot, mode)
  );

  // Build initial nodes/edges ONLY when template or bot/mode changes.
  const initial = useMemo(() => {
    if (!base) return { nodes: [] as RFNode[], edges: [] as Edge[] };

    const nodes: RFNode[] = (base.nodes as RFNode[]).map((n) => {
      const ov = overrides[n.id] ?? {};
      return {
        ...n,
        type: n.type || "message", // safe default if missing
        data: deepMerge<NodeData>(n.data || {}, ov || {}),
        selected: false,
      };
    });

    const edges: Edge[] = base.edges as Edge[];
    return { nodes, edges };
    // NOTE: We intentionally DO NOT depend on `overrides` here,
    // so typing does not rebuild nodes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplKey, base]);

  const [nodes, setNodes] = useState<RFNode[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // When bot/mode (template) changes, reset canvas from initial.
  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplKey]);

  /* ----------------------------- React Flow handlers ----------------------------- */

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const onConnect = (_: Connection) => {
    // keep canvas valid but do nothing special here
  };

  const onNodeClick = (_: React.MouseEvent, node: RFNode) => {
    setSelectedId(node.id);
  };

  /* ---------------------------- Editing / persistence ---------------------------- */

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  // Generic helper to update the selected node's data immutably and persist override
  const patchSelected = (patch: Partial<NodeData>) => {
    if (!selected) return;
    const id = selected.id;

    // 1) update nodes in place (no rebuild)
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    );

    // 2) update overrides + persist (still no rebuild)
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      saveOverrides(currentBot, mode, next);
      return next;
    });
  };

  /* ---------------------------------- UI ---------------------------------- */

  const labelCls = "text-xs font-bold uppercase text-foreground/80";
  const inputCls =
    "w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400";

  return (
    <div className="w-full h-full grid grid-rows-[1fr_auto] gap-4">
      {/* Canvas */}
      <div className="rounded-2xl border bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-emerald-50 p-1">
        <div className="rounded-xl overflow-hidden border bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            {/* Subtle dotted background */}
            <Background gap={20} size={1} color="#d1d5db" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-2xl border bg-card p-4 ring-1 ring-border">
        <div className="text-sm font-extrabold mb-3">
          Edit Text <span className="font-normal text-foreground/70">(per node)</span>
        </div>

        {!selected && (
          <div className="text-sm text-foreground/70">
            Select a node above to edit its text and labels.
          </div>
        )}

        {selected && (
          <div className="grid gap-4">
            {/* MESSAGE node */}
            {selected.type === "message" && (
              <>
                <div>
                  <div className={labelCls}>Title</div>
                  <input
                    className={inputCls}
                    value={selected.data?.title ?? ""}
                    onChange={(e) => patchSelected({ title: e.target.value })}
                  />
                </div>
                <div>
                  <div className={labelCls}>Text</div>
                  <textarea
                    className={inputCls}
                    rows={4}
                    value={selected.data?.text ?? ""}
                    onChange={(e) => patchSelected({ text: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* INPUT node */}
            {selected.type === "input" && (
              <>
                <div>
                  <div className={labelCls}>Label</div>
                  <input
                    className={inputCls}
                    value={selected.data?.label ?? ""}
                    onChange={(e) => patchSelected({ label: e.target.value })}
                  />
                </div>
                <div>
                  <div className={labelCls}>Placeholder</div>
                  <input
                    className={inputCls}
                    value={selected.data?.placeholder ?? ""}
                    onChange={(e) => patchSelected({ placeholder: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* CHOICE node */}
            {selected.type === "choice" && (
              <>
                <div>
                  <div className={labelCls}>Label</div>
                  <input
                    className={inputCls}
                    value={selected.data?.label ?? ""}
                    onChange={(e) => patchSelected({ label: e.target.value })}
                  />
                </div>
                <div>
                  <div className={labelCls}>Options (one per line)</div>
                  <textarea
                    className={inputCls}
                    rows={5}
                    value={(selected.data?.options ?? []).join("\n")}
                    onChange={(e) =>
                      patchSelected({
                        options: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </>
            )}

            {/* ACTION node */}
            {selected.type === "action" && (
              <>
                <div>
                  <div className={labelCls}>Label</div>
                  <input
                    className={inputCls}
                    value={selected.data?.label ?? ""}
                    onChange={(e) => patchSelected({ label: e.target.value })}
                  />
                </div>
                <div>
                  <div className={labelCls}>Email / Target</div>
                  <input
                    className={inputCls}
                    value={selected.data?.to ?? ""}
                    onChange={(e) => patchSelected({ to: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="text-xs text-foreground/60">
              Changes save automatically for this bot &amp; mode.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
