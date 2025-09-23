// src/pages/admin/Builder.tsx
import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates, type TemplateKey } from "@/lib/templates";
import { NODE_TYPES } from "@/components/builder/nodeTypes";

/**
 * Full-width Builder canvas.
 * Right-side panel is intentionally removed/hidden so the graph fills the page.
 */
const Builder: React.FC = () => {
  const { currentBot, botPlan } = useAdminStore();

  // Compute the registry key: `${currentBot}_${plan.toLowerCase()}`
  const tplKey = useMemo<TemplateKey | null>(() => {
    if (!currentBot || !botPlan) return null;
    const key = `${currentBot}_${botPlan.toLowerCase()}` as TemplateKey;
    return key in templates ? key : null;
  }, [currentBot, botPlan]);

  const data = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    if (!tplKey) return { nodes: [], edges: [] };
    return templates[tplKey];
  }, [tplKey]);

  // Friendly fallback when a combo isn't defined yet in /lib/templates.ts
  if (!tplKey) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Canvas not ready
          </h1>
          <p className="text-muted-foreground">
            Pick a bot and plan, or add a template entry in{" "}
            <code className="rounded bg-muted px-1 py-0.5">/src/lib/templates.ts</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full w-full">
      <ReactFlowProvider>
        <div className="h-[calc(100vh-140px)] w-full">
          <ReactFlow
            nodes={data.nodes}
            edges={data.edges}
            nodeTypes={NODE_TYPES}
            fitView
          >
            {/* Subtle dotted background (not the heavy grid) */}
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </main>
  );
};

export default Builder;
