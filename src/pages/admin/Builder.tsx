// src/pages/admin/Builder.tsx
import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates, type TemplateKey } from "@/lib/templates";
import { NODE_TYPES } from "@/components/builder/nodeTypes";

const Builder: React.FC = () => {
  const { currentBot, botPlan } = useAdminStore();
  const [rfKey, setRfKey] = useState(0);

  // derive the template key safely
  const tplKey = useMemo<TemplateKey | null>(() => {
    if (!currentBot || !botPlan) return null;
    const key = `${currentBot}_${botPlan.toLowerCase()}` as TemplateKey;
    return key in templates ? key : null;
  }, [currentBot, botPlan]);

  // fetch nodes/edges (or empty)
  const graph = tplKey ? templates[tplKey] : null;
  const nodes: Node[] = graph?.nodes ?? [];
  const edges: Edge[] = graph?.edges ?? [];

  // remount RF when template changes (ensures clean redraw)
  useEffect(() => {
    setRfKey((k) => k + 1);
  }, [tplKey]);

  return (
    <main className="flex-1 min-h-0 p-4">
      {/* status strip so you always see current state */}
      <div className="mb-3 flex gap-2 items-center">
        <span className="text-xs px-2 py-1 rounded bg-gray-100">
          <strong>Bot:</strong> {currentBot ?? "—"}
        </span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100">
          <strong>Plan:</strong> {botPlan ?? "—"}
        </span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100">
          <strong>Template:</strong> {tplKey ?? "none"}
        </span>
      </div>

      {/* FIX: give the canvas a real height so it renders */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden"
           style={{ height: "calc(100vh - 220px)" }}>
        {tplKey ? (
          <ReactFlow
            key={rfKey}
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        ) : (
          <div className="h-full grid place-items-center">
            <div className="text-center px-4">
              <h2 className="text-xl font-semibold mb-2">Canvas not ready</h2>
              <p className="text-muted-foreground">
                Select a bot and plan (Basic or Custom). If one is already
                selected, we might not have a template for that combination yet.
              </p>
              <code className="mt-3 inline-block px-2 py-1 bg-gray-100 rounded">
                {currentBot ? `${currentBot}_${botPlan ?? "-"}` : "-"}
              </code>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Builder;
