// src/pages/admin/Builder.tsx
import React, { useMemo, useState } from "react";
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
  const [rfKey] = useState(0); // bump to force re-render if you ever need it

  // Figure out which template to use (or null if not found)
  const tplKey = useMemo<TemplateKey | null>(() => {
    if (!currentBot) return null;
    const key = `${currentBot}_${botPlan}` as TemplateKey;
    return (templates as Record<string, unknown>)[key] ? key : null;
  }, [currentBot, botPlan]);

  // Build nodes/edges from the selected template
  const { nodes, edges } = useMemo(() => {
    if (!tplKey) return { nodes: [] as Node[], edges: [] as Edge[] };
    const t = templates[tplKey](); // each template is a function returning {nodes, edges}
    return { nodes: t.nodes as Node[], edges: t.edges as Edge[] };
  }, [tplKey, rfKey]);

  return (
    <main className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        {tplKey ? (
          <ReactFlow
            key={rfKey}
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            // darker, thicker edges so the diagram pops
            defaultEdgeOptions={{
              animated: false,
              style: { stroke: "#4b5563", strokeWidth: 2 }, // gray-600
            }}
            // hide tiny watermark
            proOptions={{ hideAttribution: true }}
          >
            {/* Mini overview — also dark so it’s readable */}
            <MiniMap nodeColor={() => "#4b5563"} maskColor="rgba(0,0,0,.08)" />
            <Controls />
            {/* darker grid lines */}
            <Background variant="lines" gap={18} color="#9ca3af" />
          </ReactFlow>
        ) : (
          <div className="h-full grid place-items-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Canvas not ready</h2>
              <p className="text-muted-foreground">
                Select a different bot/plan or add a template for:
              </p>
              <br />
              <code className="px-2 py-1 bg-gray-100 rounded mt-2 inline-block">
                {currentBot ? `${currentBot}_${botPlan}` : "—"}
              </code>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Builder;

    
      
            
