// src/pages/admin/Builder.tsx
import React from "react";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { NODE_TYPES } from "@/components/builder/nodeTypes";

export default function Builder() {
  const { currentBot, botPlan } = useAdminStore();

  const tplKey = `${currentBot}_${botPlan.toLowerCase()}` as keyof typeof templates;
  const tpl = templates[tplKey];

  if (!tpl) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Canvas not ready</h2>
        <p className="mt-2 text-muted-foreground">
          Select a different bot/plan or add a template entry for:
        </p>
        <code className="mt-3 inline-block rounded bg-muted px-3 py-1">
          {String(tplKey)}
        </code>
      </div>
    );
  }

  const { nodes, edges } = tpl;

  return (
    <div className="rounded-xl border" style={{ backgroundColor: "#E6F5EE" /* slightly darker mint pastel */ }}>
      <div className="h-[calc(100vh-8rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#111827", strokeWidth: 2 },
          }}
        >
          {/* No MiniMap */}
          <Background variant="dots" color="#9CA3AF" gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
