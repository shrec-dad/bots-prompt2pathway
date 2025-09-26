// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

// ----- Types -----
type NodeKind = "message" | "input" | "choice" | "action";
type NodeLike = Node & { type: NodeKind; data: any };

// ----- Helpers -----
function mergeDeep<T>(base: T, patch: Partial<T>): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k in patch as any) {
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

export default function Builder() {
  const { currentBot } = useAdminStore(); // e.g. "LeadQualifier"
  const mode = getBotSettings(currentBot as any).mode as "basic" | "custom";
  const tplKey = `${currentBot}_${mode}`;

  const base = templates[tplKey];
  const [overrides, setOv] = useState<Record<string, any>>(() =>
    getOverrides(currentBot, mode)
  );

  // Combine template with overrides
  const merged = useMemo(() => {
    if (!base) return { nodes: [] as Node[], edges: [] as Edge[] };
    const nodes = (base.nodes as Node[]).map((n) => {
      const o = overrides[n.id];
      return o ? { ...n, data: mergeDeep(n.data || {}, o.data || {}) } : n;
    });
    const edges = base.edges as Edge[];
    return { nodes, edges };
  }, [base, overrides]);

  const [nodes, setNodes, onNodesChange] = useNodesState(merged.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(merged.edges);
  const [selected, setSelected] = useState<NodeLike | null>(null);

  // Re-hydrate when merged changes
  useEffect(() => {
    setNodes(merged.nodes as Node[]);
    setEdges(merged.edges as Edge[]);
  }, [merged.nodes, merged.edges, setNodes, setEdges]);

  // Track current selection
  useEffect(() => {
    const sel = nodes.find((n) => n.selected) as NodeLike | undefined;
    setSelected(sel || null);
  }, [nodes]);

  // Save a patch into overrides and live nodes
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

    setNodes((prev) =>
      prev.map((n: any) =>
        n.id === selected.id ? { ...n, data: mergeDeep(n.data || {}, patch) } : n
      )
    );
  };

  // Separate editor to keep JSX clean
  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-foreground/70">
          Select a node above to edit its text and labels.
        </div>
      );
    }

    const common =
      "w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold focus:outline-none";
    const label = "text-[10px] font-extrabold uppercase text-foreground/70";

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

  // Connect handler (typed outside JSX to avoid 'as' in JSX)
  const handleConnect: OnConnect = () => {};

  return (
    <div className="w-full space-y-4">
      {/* Header / Breadcrumb */}
      <div className="text-xs font-extrabold tracking-wide text-foreground/70">
        <span className="opacity-70">Builder •</span>{" "}
        <span>Bot: {currentBot}</span>{" "}
        <span className="opacity-70">| Mode:</span> <span>{mode}</span>
      </div>

      {/* BIG canvas, colorful and professional; no minimap */}
      <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 via-emerald-50 to-pink-50 ring-1 ring-border overflow-hidden h-[76vh]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          fitView
        >
          {/* Soft dotted background with a subtle tint */}
          <Background
            id="dots"
            variant="dots"
            gap={16}
            size={1}
            color="#c4b5fd" // Tailwind violet-300
          />
          <Controls position="bottom-right" />
          {/* Intentionally no MiniMap */}
        </ReactFlow>
      </div>

      {/* Compact editor BELOW (shorter, so canvas gets more height) */}
      <div className="rounded-2xl border bg-card p-4 ring-1 ring-border">
        <div className="text-sm font-extrabold mb-2">
          Edit Text <span className="opacity-60">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-3 text-[11px] text-foreground/60">
            Changes save automatically for this bot &amp; mode.
          </div>
        )}
      </div>
    </div>
  );
}
