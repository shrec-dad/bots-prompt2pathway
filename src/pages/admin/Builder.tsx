// src/pages/admin/Builder.tsx
import React, { useCallback } from "react";
import ReactFlow, { Background, useReactFlow } from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { NODE_TYPES } from "@/components/builder/nodeTypes";

export default function Builder() {
  const { currentBot, botPlan } = useAdminStore();

  // compose template key (e.g., LeadQualifier_basic)
  const tplKey = `${currentBot}_${botPlan.toLowerCase()}` as keyof typeof templates;
  const tpl = templates[tplKey];

  if (!tpl) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Canvas not ready</h2>
        <p className="mt-2 text-muted-foreground">
          Select a different bot/plan or add a template entry for:
        </p>
        <code className="mt-3 inline-block rounded bg-muted px-3 py-1">{tplKey}</code>
      </div>
    );
  }

  const { nodes, edges } = tpl;

  const onInit = useCallback((rf: ReturnType<typeof useReactFlow>) => {
    // re-fit once the instance is ready to avoid any offset/shift
    requestAnimationFrame(() => {
      try {
        // small padding keeps nodes clear of the viewport edges
        // @ts-ignore: rf may be a ReactFlowInstance
        rf.fitView({ padding: 0.2, includeHiddenNodes: true, duration: 300 });
      } catch {}
    });
  }, []);

  return (
    <div className="builder-canvas rounded-xl border">
      {/* Fixed height: header already sticky above; this fills the rest */}
      <div className="h-[calc(100vh-8rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
          onInit={onInit}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#0f172a", strokeWidth: 2 }, // slate-900
          }}
        >
          <Background
            variant="dots"
            gap={24}
            size={1.5}
            color="#cbd5e1" // slate-300 dots
          />
        </ReactFlow>
      </div>
    </div>
  );
}
