// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

type NodeLike = Node & {
  type: "message" | "input" | "choice" | "action";
  data: any;
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

// per-bot-mode overrides
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
  const { currentBot } = useAdminStore(); // "LeadQualifier" | ...
  const mode = getBotSettings(currentBot as any).mode; // "basic" | "custom"
  const tplKey = `${currentBot}_${mode}`; // matches templates registry keys

  const base = templates[tplKey];
  const [overrides, setOv] = useState<Record<string, any>>(() =>
    getOverrides(currentBot, mode)
  );

  // apply overrides to base template
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

  // track selection -> editor
  useEffect(() => {
    const sel = nodes.find((n) => n.selected) as NodeLike | undefined;
    setSelected(sel || null);
  }, [nodes]);

  const saveField = (patch: Partial<NodeLike["data"]>) => {
    if (!selected) return;
    const next = {
      ...overrides,
      [selected.id]: {
        data: { ...((overrides[selected.id] || {}).data || {}), ...patch },
      },
    };
    setOv(next);
    setOverrides(currentBot, mode, next);
    // update local nodes view immediately
    setNodes((prev) =>
      prev.map((n: any) =>
        n.id === selected.id ? { ...n, data: mergeDeep(n.data || {}, patch) } : n
      )
    );
  };

  // simple editors per node type
  const Editor = () => {
    const common =
      "w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold";
    const label = "text-xs font-bold uppercase text-foreground/80";

    if (!selected) {
      return (
        <div className="text-sm text-foreground/70">
          Select a node to edit its text/labels.
        </div>
      );
    }

    if (selected.type === "message") {
      return (
        <div className="space-y-3">
          <div>
            <div className={label}>Title</div>
            <input
              className={common}
              value={selected.data?.title || ""}
              onChange={(e) => saveField({ title: e.target.value })}
            />
          </div>
          <div>
            <div className={label}>Text</div>
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
            <div className={label}>Label</div>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField({ label: e.target.value })}
            />
          </div>
          <div>
            <div className={label}>Placeholder</div>
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
            <div className={label}>Label</div>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField({ label: e.target.value })}
            />
          </div>
          <div>
            <div className={label}>Options (one per line)</div>
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
            />
          </div>
        </div>
      );
    }

    if (selected.type === "action") {
      return (
        <div className="space-y-3">
          <div>
            <div className={label}>Label</div>
            <input
              className={common}
              value={selected.data?.label || ""}
              onChange={(e) => saveField({ label: e.target.value })}
            />
          </div>
          <div>
            <div className={label}>Email / Target</div>
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
    <div className="space-y-4">
      {/* pill breadcrumb/status */}
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50">
        <span>Builder</span>
        <span className="opacity-40">•</span>
        <span>Bot: {String(currentBot)}</span>
        <span className="opacity-40">|</span>
        <span>Mode: {mode}</span>
      </div>

      {/* Canvas (taller) */}
      <div className="rounded-2xl border overflow-hidden ring-1 ring-border bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50">
        <div className="min-h-[75vh]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as OnNodesChange}
            onEdgesChange={onEdgesChange as OnEdgesChange}
            onConnect={() => {} as OnConnect}
            fitView
          >
            {/* Soft dotted background; subtle color */}
            <Background variant="dots" gap={18} size={1} color="#8b8fa3" />
            <Controls position="bottom-right" />
            {/* No MiniMap on purpose (cleaner) */}
          </ReactFlow>
        </div>
      </div>

      {/* Compact Editor below (shorter height) */}
      <div className="rounded-2xl border bg-card p-4 ring-1 ring-border">
        <div className="text-sm font-extrabold mb-3">
          Edit Text (Bot: {String(currentBot)}, Mode: {mode})
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-3xl">
          <Editor />
        </div>

        {selected && (
          <div className="mt-3 text-xs text-foreground/70">
            Changes are saved automatically for this bot & mode.
          </div>
        )}
      </div>
    </div>
  );
}
