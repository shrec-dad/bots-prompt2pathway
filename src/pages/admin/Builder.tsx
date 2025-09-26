// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

/** local helpers */
type NodeLike = Node & {
  type: "message" | "input" | "choice" | "action";
  data: any;
};

function mergeDeep<T>(base: T, patch: Partial<T>): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k in patch) {
    const v: any = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = mergeDeep((out as any)[k], v);
    } else {
      out[k] = v;
    }
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

export default function Builder() {
  const { currentBot } = useAdminStore();
  const mode = getBotSettings(currentBot as any).mode; // "basic" | "custom"
  const tplKey = `${currentBot}_${mode}`;

  const base = templates[tplKey];
  const [overrides, setOv] = useState<Record<string, any>>(() =>
    getOverrides(currentBot, mode)
  );

  const merged = useMemo(() => {
    if (!base) return { nodes: [], edges: [] };
    const nodes = base.nodes.map((n: any) => {
      const o = overrides[n.id];
      return o ? { ...n, data: mergeDeep(n.data || {}, o.data || {}) } : n;
    });
    const edges = base.edges;
    return { nodes, edges };
  }, [base, overrides]);

  const [nodes, setNodes, onNodesChange] = useNodesState(merged.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(merged.edges);
  const [selected, setSelected] = useState<NodeLike | null>(null);

  useEffect(() => {
    setNodes(merged.nodes as Node[]);
    setEdges(merged.edges as Edge[]);
  }, [merged.nodes, merged.edges, setNodes, setEdges]);

  // track selection
  useEffect(() => {
    const sel = nodes.find((n) => n.selected) as NodeLike | undefined;
    setSelected(sel || null);
  }, [nodes]);

  // safe, typed onConnect handler (no "as" in JSX)
  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) => addEdge(conn, eds));
    },
    [setEdges]
  );

  // persist a partial patch for the selected node
  const saveField = (patch: Partial<NodeLike["data"]>) => {
    if (!selected) return;
    const next = {
      ...overrides,
      [selected.id]: { data: { ...((overrides[selected.id] || {}).data || {}), ...patch } },
    };
    setOv(next);
    setOverrides(currentBot, mode, next);
    setNodes((prev) =>
      prev.map((n: any) => (n.id === selected.id ? { ...n, data: mergeDeep(n.data || {}, patch) } : n))
    );
  };

  const common = "w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold";
  const labelCls = "text-xs font-bold uppercase text-foreground/80";

  const Editor = () => {
    if (!selected)
      return (
        <div className="text-sm text-foreground/70 p-4">
          Select a node on the canvas to edit its text/labels.
        </div>
      );

    if (selected.type === "message") {
      return (
        <div className="space-y-3">
          <div>
            <div className={labelCls}>Title</div>
            <input
              className={common}
              value={selected.data?.title || ""}
              onChange={(e) => saveField({ title: e.target.value })}
            />
          </div>
          <div>
            <div className={labelCls}>Text</div>
            <textarea
              className={common}
              rows={4}
              value={selected.data?.text || ""}
              onChange={(e) => saveField({ text: e.target.value })}
            />
          </div>
        </div>
      );
    }

    if (selected.type === "input") {
      return (
        <div className="space-y-3">
          <div>
            <div className={labelCls}>Label</div>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField({ label: e.target.value })}
            />
          </div>
          <div>
            <div className={labelCls}>Placeholder</div>
            <input
              className={common}
              value={selected.data?.placeholder || ""}
              onChange={(e) => saveField({ placeholder: e.target.value })}
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
            <div className={labelCls}>Label</div>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField({ label: e.target.value })}
            />
          </div>
          <div>
            <div className={labelCls}>Options (one per line)</div>
            <textarea
              className={common}
              rows={5}
              value={options.join("\n")}
              onChange={(e) =>
                saveField({
                  options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        </div>
      );
    }

    if (selected.type === "action") {
      return (
        <div className="space-y-3">
          <div>
            <div className={labelCls}>Label</div>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField({ label: e.target.value })}
            />
          </div>
          <div>
            <div className={labelCls}>Email / Target</div>
            <input
              className={common}
              value={selected.data?.to || ""}
              onChange={(e) => saveField({ to: e.target.value })}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* Canvas area */}
      <div className="rounded-2xl border overflow-hidden bg-muted/30 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background variant="dots" gap={16} size={1} />
          <MiniMap pannable zoomable className="!bg-transparent" />
          <Controls position="bottom-right" />
          <Panel position="top-left" className="m-2">
            <div className="rounded-xl border bg-card/90 px-3 py-2 text-xs font-bold shadow-sm">
              Builder • <span className="opacity-70">Bot:</span> {currentBot}{" "}
              <span className="opacity-70">| Mode:</span> {mode}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Side editor */}
      <aside className="rounded-2xl border bg-card p-4 ring-1 ring-border">
        <div className="text-sm font-extrabold mb-2">
          Edit Text <span className="opacity-60">(Bot: {currentBot}, Mode: {mode})</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-4 text-xs text-foreground/70">
            Changes are saved automatically for this bot & mode.
          </div>
        )}
      </aside>
    </div>
  );
}
