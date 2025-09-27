// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

/* ------------------------ helpers: deep merge + overrides ------------------------ */
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
const ovKey = (bot: string, mode: "basic" | "custom") => `botOverrides:${bot}_${mode}`;
const getOverrides = (bot: string, mode: "basic" | "custom") => {
  try {
    const raw = localStorage.getItem(ovKey(bot, mode));
    return raw ? (JSON.parse(raw) as Record<string, any>) : {};
  } catch {
    return {};
  }
};
const setOverrides = (bot: string, mode: "basic" | "custom", next: Record<string, any>) => {
  localStorage.setItem(ovKey(bot, mode), JSON.stringify(next));
};

/* ----------------------------- component: Builder ----------------------------- */
export default function Builder() {
  const { currentBot } = useAdminStore(); // "LeadQualifier" | "AppointmentBooking" | ...
  const mode = getBotSettings(currentBot as any).mode as "basic" | "custom";
  const tplKey = `${currentBot}_${mode}` as keyof typeof templates;

  const base = templates[tplKey];
  const [overrides, setOv] = useState<Record<string, any>>(() => getOverrides(currentBot, mode));

  // apply overrides onto the template without mutating the template
  const merged = useMemo(() => {
    if (!base) return { nodes: [] as Node[], edges: [] as Edge[] };
    const nodes = base.nodes.map((n: any) => {
      const ov = overrides[n.id];
      return ov ? { ...n, data: mergeDeep(n.data || {}, ov.data || {}) } : n;
    });
    const edges = base.edges as Edge[];
    return { nodes: nodes as Node[], edges };
  }, [base, overrides]);

  const [nodes, setNodes, onNodesChange] = useNodesState(merged.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(merged.edges);

  // keep canvas in sync if bot/mode or overrides change
  useEffect(() => {
    setNodes(merged.nodes);
    setEdges(merged.edges);
  }, [merged.nodes, merged.edges, setNodes, setEdges]);

  /* ------------------------ selection managed by id ------------------------ */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleNodeClick = useCallback((_evt: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
  }, []);

  // ensure selection still valid if nodes change
  useEffect(() => {
    if (!selectedId) return;
    const stillExists = nodes.some((n) => n.id === selectedId);
    if (!stillExists) setSelectedId(null);
  }, [nodes, selectedId]);

  /* ------------------------ editor form state per node ------------------------ */
  type EditorState = {
    title?: string;
    text?: string;
    label?: string;
    placeholder?: string;
    options?: string[]; // for "choice" nodes
    to?: string;        // for "action" nodes
  };

  const [editor, setEditor] = useState<EditorState>({});

  // when selection changes, load current node data into the editor form
  useEffect(() => {
    if (!selectedId) {
      setEditor({});
      return;
    }
    const n = nodes.find((x) => x.id === selectedId);
    if (!n) {
      setEditor({});
      return;
    }
    const d = (n.data || {}) as EditorState;
    setEditor({
      title: d.title || "",
      text: d.text || "",
      label: d.label || "",
      placeholder: d.placeholder || "",
      options: Array.isArray(d.options) ? d.options : [],
      to: d.to || "",
    });
  }, [selectedId, nodes]);

  // push form changes onto the selected node + persist overrides
  const applyPatch = useCallback(
    (patch: Partial<EditorState>) => {
      if (!selectedId) return;

      // 1) local form state (for smooth typing)
      setEditor((prev) => ({ ...prev, ...patch }));

      // 2) update nodes in place (preserve selection)
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedId ? { ...n, data: mergeDeep(n.data || {}, patch) } : n
        )
      );

      // 3) save overrides for this bot & mode
      const nextOv = {
        ...overrides,
        [selectedId]: {
          data: mergeDeep((overrides[selectedId]?.data || {}) as any, patch as any),
        },
      };
      setOv(nextOv);
      setOverrides(currentBot, mode, nextOv);
    },
    [selectedId, setNodes, overrides, currentBot, mode]
  );

  /* ------------------------------ react-flow wiring ------------------------------ */
  const handleConnect = useCallback((_c: Connection) => {
    // You can enable manual edge creation later if you wish:
    // setEdges((eds) => addEdge(c, eds));
  }, []);

  /* ----------------------------------- UI ----------------------------------- */
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-2xl border bg-card ring-1 ring-border">{children}</div>
  );

  return (
    <div className="w-full grid gap-4"
         style={{ gridTemplateRows: "minmax(70vh, 70vh) auto" }}>
      {/* Canvas */}
      <Card>
        <div className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as OnNodesChange}
            onEdgesChange={onEdgesChange as OnEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            {/* A soft dotted background with a subtle brand-ish tint */}
            <Background
              variant="dots"
              gap={24}
              size={1.5}
              color="rgba(60, 60, 120, 0.30)"
            />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </Card>

      {/* Editor (shorter) */}
      <Card>
        <div className="p-4">
          <div className="text-sm font-extrabold mb-3">
            Edit Text <span className="font-normal">(per node)</span>
          </div>

          {!selectedId ? (
            <div className="text-sm text-foreground/70">
              Select a node above to edit its text and labels.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <div className="text-xs font-bold uppercase text-foreground/80 mb-1">Title</div>
                <input
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold"
                  value={editor.title ?? ""}
                  onChange={(e) => applyPatch({ title: e.target.value })}
                  placeholder="Node title"
                />
              </div>

              {/* Text (multi-line) */}
              <div>
                <div className="text-xs font-bold uppercase text-foreground/80 mb-1">Text</div>
                <textarea
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold"
                  rows={3}
                  value={editor.text ?? ""}
                  onChange={(e) => applyPatch({ text: e.target.value })}
                  placeholder="Body text or prompt"
                />
              </div>

              {/* Label */}
              <div>
                <div className="text-xs font-bold uppercase text-foreground/80 mb-1">Label</div>
                <input
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold"
                  value={editor.label ?? ""}
                  onChange={(e) => applyPatch({ label: e.target.value })}
                  placeholder="Field or button label"
                />
              </div>

              {/* Placeholder */}
              <div>
                <div className="text-xs font-bold uppercase text-foreground/80 mb-1">Placeholder</div>
                <input
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold"
                  value={editor.placeholder ?? ""}
                  onChange={(e) => applyPatch({ placeholder: e.target.value })}
                  placeholder="Input placeholder"
                />
              </div>

              {/* Options (for choice nodes) */}
              <div>
                <div className="text-xs font-bold uppercase text-foreground/80 mb-1">
                  Options (one per line)
                </div>
                <textarea
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold"
                  rows={4}
                  value={(editor.options ?? []).join("\n")}
                  onChange={(e) =>
                    applyPatch({
                      options: e.target
                        .value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </div>

              {/* To / Email (for action nodes) */}
              <div>
                <div className="text-xs font-bold uppercase text-foreground/80 mb-1">Email / Target</div>
                <input
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm font-semibold"
                  value={editor.to ?? ""}
                  onChange={(e) => applyPatch({ to: e.target.value })}
                  placeholder="admin@example.com or webhook target"
                />
              </div>

              <div className="text-xs text-foreground/70">
                Changes save automatically for this bot &amp; mode.
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
