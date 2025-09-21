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

const PLANS = ["Basic", "Custom"] as const;
type Plan = (typeof PLANS)[number];

const Builder: React.FC = () => {
  const { currentBot, plan, setPlan } = useAdminStore();
  const [rfKey, setRfKey] = useState(0); // force rerender if needed

  const tplKey = useMemo<TemplateKey | null>(() => {
    if (!currentBot) return null;
    const key = `${currentBot}_${plan.toLowerCase()}` as TemplateKey;
    return key in templates ? key : null;
  }, [currentBot, plan]);

  const { nodes, edges } = useMemo<{
    nodes: Node[];
    edges: Edge[];
  }>(() => {
    if (!tplKey) return { nodes: [], edges: [] };
    try {
      return templates[tplKey];
    } catch (e) {
      console.error("Template load error", e, { tplKey });
      return { nodes: [], edges: [] };
    }
  }, [tplKey]);

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col">
      <div className="flex items-center justify-between gap-3 p-3 border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
        <div className="font-semibold text-lg">
          Builder — <span className="text-indigo-600">{currentBot || "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          {PLANS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPlan(p);
                // force rerender of RF when plan changes so edges recalc cleanly
                setRfKey((k) => k + 1);
              }}
              className={`px-3 py-1 rounded border ${
                plan === p
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {tplKey ? (
          <ReactFlow key={rfKey} nodes={nodes} edges={edges} nodeTypes={NODE_TYPES}  fitView>
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        ) : (
          <div className="h-full grid place-items-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Canvas not ready</h2>
              <p className="text-muted-foreground">
                Select a different bot/plan or define a template entry for:
                <br />
                <code className="px-2 py-1 bg-gray-100 rounded mt-2 inline-block">
                  {currentBot ? `${currentBot}_${plan.toLowerCase()}` : "—"}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Builder;

  
           
         
 



         
    
