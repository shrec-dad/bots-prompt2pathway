// src/pages/admin/Builder.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

// --- helpers --------------------------------------------------------------

type BotMode = "basic" | "custom";
type NodeLike = Node & {
  data?: Record<string, any>;
  // our templates sometimes set a custom type like "message" | "input" | "choice" | "action"
  // ReactFlow will gracefully render unknown types as "default"; the warnings are harmless.
};

const OV_KEY = (bot: string, mode: BotMode) => `botOverrides:${bot}_${mode}`;

function deepMerge<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k in patch) {
    const v = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] ?? {}, v as any);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function loadOverrides(bot: string, mode: BotMode): Record<string, any> {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveOverrides(bot: string, mode: BotMode, ov: Record<string, any>) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(ov));
}

function applyOverrides(nodes: NodeLike[], ov: Record<string, any>): NodeLike[] {
  return nodes.map((n) => {
    const patch = ov[n.id];
    if (!patch?.data) return n;
    return { ...n, data: deepMerge(n.data ?? {}, patch.data) };
  });
}

// --- component ------------------------------------------------------------

export default function Builder() {
  const { currentBot } = useAdminStore(); // e.g. "LeadQualifier"
  const mode = useMemo(
    () => (getBotSettings(currentBot as any).mode as BotMode) ?? "basic",
    [currentBot]
  );

  const tplKey = `${currentBot}_${mode}`;
  const base = templates[tplKey] ?? { nodes: [], edges: [] };

  // local state that we own (does not get blown away on keystrokes)
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<NodeLike>([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverridesState] = useState<Record<string, any>>({});

  // initialize once per (bot,mode)
  useEffect(() => {
    const ov = loadOverrides(currentBot, mode);
    setOverridesState(ov);
    setSelectedId(null);
    setNodes(applyOverrides((base.nodes as NodeLike[]) ?? [], ov));
    setEdges((base.edges as Edge[]) ?? []);
  }, [tplKey, base.nodes, base.edges, currentBot, mode, setNodes, setEdges]);

  // handlers that DO NOT re-init the graph
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => onNodesChangeBase(changes),
    [onNodesChangeBase]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => onEdgesChangeBase(changes),
    [onEdgesChangeBase]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onNodeClick = useCallback((_: any, n: Node) => {
    setSelectedId(n.id);
  }, []);

  // selected node & convenience updaters
  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as NodeLike | undefined,
    [nodes, selectedId]
  );

  const patchSelectedData = (patch: Record<string, any>) => {
    if (!selected) return;

    // 1) update local nodes immediately (preserve selection)
    setNodes((prev) =>
      prev.map((n) => (n.id === selected.id ? { ...n, data: deepMerge(n.data ?? {}, patch) } : n))
    );

    // 2) update overrides in memory + persist
    const nextOverrides = {
      ...overrides,
      [selected.id]: { data: deepMerge((overrides[selected.id]?.data ?? {}), patch) },
    };
    setOverridesState(nextOverrides);
    saveOverrides(currentBot, mode, nextOverrides);
  };

  // --- styling (subtle gradient + dotted background) ----------------------
  const canvasClass =
    "rounded-2xl border bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.10),rgba(16,185,129,0.10))]";

  // --- inline editor ------------------------------------------------------
  const labelCls =
    "text-xs font-bold uppercase tracking-wide text-foreground/80";
  const inputCls =
    "w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400/40";

  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-foreground/70">
          Select a node above to edit its text and labels.
        </div>
      );
    }

    // Plain fields that cover the common node types we use in templates
    const d = selected.data ?? {};
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      patchSelectedData({ [k]: e.target.value });

    return (
      <div className="space-y-4">
        {/* Title / Label */}
        <div className="space-y-1">
          <div className={labelCls}>{d.title != null ? "Title" : "Label"}</div>
          <input
            className={inputCls}
            value={String(d.title ?? d.label ?? "")}
            onChange={(e) =>
              patchSelectedData(d.title != null ? { title: e.target.value } : { label: e.target.value })
            }
            placeholder="Type here…"
          />
        </div>

        {/* Text / Placeholder */}
        {"text" in d || "placeholder" in d ? (
          <div className="space-y-1">
            <div className={labelCls}>{d.text != null ? "Text" : "Placeholder"}</div>
            {d.text != null ? (
              <textarea
                className={inputCls}
                rows={4}
                value={String(d.text ?? "")}
                onChange={set("text")}
                placeholder="Message text…"
              />
            ) : (
              <input
                className={inputCls}
                value={String(d.placeholder ?? "")}
                onChange={set("placeholder")}
                placeholder="e.g. you@domain.com"
              />
            )}
          </div>
        ) : null}

        {/* Options (choice) */}
        {Array.isArray(d.options) && (
          <div className="space-y-1">
            <div className={labelCls}>Options (one per line)</div>
            <textarea
              className={inputCls}
              rows={5}
              value={(d.options as string[]).join("\n")}
              onChange={(e) =>
                patchSelectedData({
                  options: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Option A\nOption B\nOption C"
            />
          </div>
        )}

        {/* Action target (action node) */}
        {"to" in d && (
          <div className="space-y-1">
            <div className={labelCls}>Email / Target</div>
            <input
              className={inputCls}
              value={String(d.to ?? "")}
              onChange={set("to")}
              placeholder="admin@example.com"
            />
          </div>
        )}

        <div className="text-xs text-foreground/60">
          Changes save automatically for this bot & mode.
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Canvas */}
      <div className={`${canvasClass} overflow-hidden`} style={{ height: 540 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
          // nodeTypes={customNodeTypes} // (optional) if you add custom node components later
          selectionOnDrag
          panOnDrag
        >
          <Background variant="dots" gap={20} size={1.5} />
          <Controls position="bottom-right" />
          {/* <MiniMap />  // intentionally removed per your preference */}
        </ReactFlow>
      </div>

      {/* Editor */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="font-extrabold mb-2">Edit Text <span className="font-normal text-foreground/70">(per node)</span></div>
        <Editor />
      </div>
    </div>
  );
}
