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
  // read live state from the admin store
  const { currentBot, botPlan: plan } = useAdminStore();
  const [rfKey, setRfKey] = useState(0);

  // find the template key safely; only if bot + plan both exist
  const tplKey = useMemo<TemplateKey | null>(() => {
    if (!currentBot || !plan) return null;
    const key = `${currentBot}_${plan.toLowerCase()}` as TemplateKey;
    return key in templates ? key : null;
  }, [currentBot, plan]);

  // get graph only when tplKey is valid
  const graph = useMemo(() => {
    if (!tplKey) return null;
    return templates[tplKey];
  }, [tplKey]);

  // force ReactFlow to remount when template changes
  useEffect(() => {
    setRfKey((k) => k + 1);
  }, [tplKey]);

  const nodes: Node[] = graph?.nodes ?? [];
  const edges: Edge[] = graph?.edges ?? [];

  return (
    <main className="flex-1 min-h-0 p-4">
      {tplKey ? (
        <div className="h-full rounded-xl bg-white p-2 shadow-sm">
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
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Canvas not ready</h2>
            <p className="text-muted-foreground">
              Choose a bot and plan (Basic/Custom). If one is already selected,
              we may not have a template for it yet.
            </p>
            <br />
            <code className="px-2 py-1 bg-gray-100 rounded mt-2 inline-block">
              {currentBot ? `${currentBot}_${plan ?? "-"}` : "-"}
            </code>
          </div>
        </div>
      )}
    </main>
  );
};

export default Builder;
