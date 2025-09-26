// src/pages/admin/Builder.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  OnConnect,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

/* --------------------------- helpers & overrides --------------------------- */

type BotMode = "basic" | "custom";
type NodeKinds = "message" | "input" | "choice" | "action" | string;
type NodeLike = Node & { type?: NodeKinds; data: any };

function mergeDeep<T>(base: T, patch: Partial<T>): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k in patch as any) {
    const v = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = mergeDeep(out[k], v);
    else out[k] = v;
  }
  return out;
}

const OV_KEY = (bot: string, mode: BotMode) => `botOverrides:${bot}_${mode}`;
function getOverrides(bot: string, mode: BotMode) {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch {}
  return {};
}
function setOverrides(bot: string, mode: BotMode, next: Record<string, any>) {
  localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(next));
}

/* ------------------------------- node UIs ---------------------------------- */
/* super-light custom nodes so React Flow stops warning and labels look nicer */

const Card: React.FC<{ title?: string; sub?: string }> = ({ title, sub, children }) => (
  <div className="rounded-xl border bg-white/90 px-3 py-2 shadow-sm">
    {title && <div className="text-[12px] font-bold leading-tight">{title}</div>}
    {sub && <div className="text-[11px] text-black/70">{sub}</div>}
    {children}
  </div>
);

const MessageNode = ({ data }: NodeProps) => (
  <Card title={data?.title || "Message"} sub={data?.text} />
);

const InputNode = ({ data }: NodeProps) => (
  <Card title={data?.label || "Input"} sub={data?.placeholder} />
);

const ChoiceNode = ({ data }: NodeProps) => (
  <Card title={data?.label || "Choice"}>
    <div className="text-[11px] text-black/70">
      {(data?.options as string[])?.join(" · ")}
    </div>
  </Card>
);

const ActionNode = ({ data }: NodeProps) => (
  <Card title={data?.label || "Action"} sub={data?.to ? `→ ${data.to}` : undefined} />
);

const nodeTypes = {
  message: MessageNode,
  input: InputNode,
  choice: ChoiceNode,
  action: ActionNode,
};

/* -------------------------------- Builder ---------------------------------- */

export default function Builder() {
  const { currentBot } = useAdminStore(); // e.g. "CustomerSupport"
  const mode = useMemo<BotMode>(() => getBotSettings(currentBot as any).mode, [currentBot]);
  const tplKey = `${currentBot}_${mode}`;
  const base = templates[tplKey] || { nodes: [], edges: [] };

  // Load overrides once per bot/mode
  const [overrides, setOv] = useState<Record<string, any>>(() =>
    getOverrides(currentBot, mode)
  );

  // Merged graph (base + overrides) – used to *initialize* canvas when bot/mode changes.
  const mergedInitial = useMemo(() => {
    const nodes = (base.nodes as NodeLike[]).map((n) => {
      const o = overrides[n.id];
      return o ? { ...n, data: mergeDeep(n.data || {}, o.data || {}) } : n;
    });
    return { nodes, edges: base.edges as Edge[] };
    // Only recompute when switching bot/mode/template
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeLike>(mergedInitial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(mergedInitial.edges);

  // Selection (remember which node is being edited)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as NodeLike | undefined,
    [nodes, selectedId]
  );

  // When bot/mode changes, (re)seed the canvas *once*.
  useEffect(() => {
    setNodes(mergedInitial.nodes as Node[]);
    setEdges(mergedInitial.edges as Edge[]);
    setSelectedId(null);
    setOv(getOverrides(currentBot, mode));
  }, [mergedInitial, setNodes, setEdges, currentBot, mode]);

  // Persist field edits to overrides + local canvas (no re-seeding)
  const saveField = useCallback(
    (patch: Partial<NodeLike["data"]>) => {
      if (!selected) return;

      // 1) update local canvas immediately
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selected.id ? ({ ...n, data: mergeDeep(n.data || {}, patch) } as NodeLike) : n
        )
      );

      // 2) persist overrides
      const next = {
        ...overrides,
        [selected.id]: {
          data: mergeDeep((overrides[selected.id] || {}).data || {}, patch),
        },
      };
      setOv(next);
      setOverrides(currentBot, mode, next);
    },
    [selected, setNodes, overrides, currentBot, mode]
  );

  // Handlers (avoid inline `as` in JSX – this is what SWC choked on)
  const handleConnect: OnConnect = useCallback(() => {}, []);
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedId(node.id),
    []
  );
  const onPaneClick = useCallback(() => setSelectedId(null), []);

  /* ------------------------------ editor pane ------------------------------ */

  const labelCls =
    "text-xs font-bold uppercase tracking-wide text-foreground/80 mb-1 block";
  const inputCls =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm font-semibold focus:outline-none";

  const Editor = () => {
    if (!selected) {
      return (
        <div className="text-sm text-foreground/70">
          Select a node above to edit its text and labels.
        </div>
      );
    }

    const kind = (selected.type || "message") as NodeKinds;

    if (kind === "message") {
      return (
        <div className="space-y-3">
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            value={selected.data?.title || ""}
            onChange={(e) => saveField({ title: e.target.value })}
          />
          <label className={labelCls}>Text</label>
          <textarea
            className={inputCls}
            rows={4}
            value={selected.data?.text || ""}
            onChange={(e) => saveField({ text: e.target.value })}
          />
        </div>
      );
    }

    if (kind === "input") {
      return (
        <div className="space-y-3">
          <label className={labelCls}>Label</label>
          <input
            className={inputCls}
            value={selected.data?.label || ""}
            onChange={(e) => saveField({ label: e.target.value })}
          />
          <label className={labelCls}>Placeholder</label>
          <input
            className={inputCls}
            value={selected.data?.placeholder || ""}
            onChange={(e) => saveField({ placeholder: e.target.value })}
          />
        </div>
      );
    }

    if (kind === "choice") {
      const options: string[] = selected.data?.options || [];
      return (
        <div className="space-y-3">
          <label className={labelCls}>Label</label>
          <input
            className={inputCls}
            value={selected.data?.label || ""}
            onChange={(e) => saveField({ label: e.target.value })}
          />
          <label className={labelCls}>Options (one per line)</label>
          <textarea
            className={inputCls}
            rows={6}
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
      );
    }

    if (kind === "action") {
      return (
        <div className="space-y-3">
          <label className={labelCls}>Label</label>
          <input
            className={inputCls}
            value={selected.data?.label || ""}
            onChange={(e) => saveField({ label: e.target.value })}
          />
          <label className={labelCls}>Email / Target</label>
          <input
            className={inputCls}
            value={selected.data?.to || ""}
            onChange={(e) => saveField({ to: e.target.value })}
          />
        </div>
      );
    }

    // Fallback
    return (
      <div className="space-y-3">
        <label className={labelCls}>Label</label>
        <input
          className={inputCls}
          value={selected.data?.label || ""}
          onChange={(e) => saveField({ label: e.target.value })}
        />
      </div>
    );
  };

  /* --------------------------------- UI ----------------------------------- */

  return (
    <div className="w-full h-full grid grid-rows-[1fr_auto] gap-4">
      {/* Canvas (taller) */}
      <div className="rounded-2xl border overflow-hidden bg-gradient-to-br from-emerald-50 via-indigo-50 to-violet-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background gap={18} size={1} />
          <Controls position="bottom-right" />
        </ReactFlow>
      </div>

      {/* Editor (shorter) */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm font-extrabold mb-3">Edit Text (per node)</div>
        <Editor />
        {selected && (
          <div className="mt-3 text-xs text-foreground/70">
            Changes save automatically for this bot &amp; mode.
          </div>
        )}
      </div>
    </div>
  );
}
