// src/pages/admin/Builder.tsx
import React from "react";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { NODE_TYPES } from "@/components/builder/nodeTypes";

export default function Builder() {
  const { currentBot, botPlan } = useAdminStore();

  // Compose registry key
  const tplKey = `${currentBot}_${botPlan.toLowerCase()}` as keyof typeof templates;
  const tpl = templates[tplKey];

  if (!tpl) {
    return (
      <div className="rounded-xl border-2 border-black bg-white p-8 text-center shadow">
        <h2 className="text-xl font-bold">Canvas not ready</h2>
        <p className="mt-2 text-black">
          Select a different bot/plan or add a template entry for:
        </p>
        <code className="mt-3 inline-block rounded bg-neutral-100 px-3 py-1 font-mono text-sm text-black">
          {tplKey}
        </code>
      </div>
    );
  }

  const { nodes, edges } = tpl;

  return (
    <div className="rounded-xl border-2 border-black bg-[#EAF6F0]">
      <div className="h-[calc(100vh-8rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#0b1220", strokeWidth: 2 }, // darker edges
          }}
        >
          {/* No MiniMap */}
          <Background
            gap={18}
            size={1}
            color="#9CA3AF22" // subtle dot grid
          />
        </ReactFlow>
      </div>
    </div>
  );
}
