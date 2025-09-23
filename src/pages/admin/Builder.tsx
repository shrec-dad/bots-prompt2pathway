// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { NODE_TYPES } from "@/components/builder/nodeTypes";
import { templates, type TemplateKey, type Template } from "@/lib/templates";

// ---- Local helpers ---------------------------------------------------------

const RIGHT_PANEL = {
  width: 360, // px
};

function buildTemplate(key: TemplateKey | null): Template | null {
  if (!key) return null;
  const t = templates[key];
  return typeof t === "function" ? t() : null;
}

// Create the exact key string like "LeadQualifier_basic"
function deriveKey(bot: string | undefined, plan: "basic" | "custom"): TemplateKey | null {
  if (!bot) return null;
  return `${bot}_${plan.toLowerCase()}` as TemplateKey;
}

// ---- Builder component -----------------------------------------------------

const Builder: React.FC = () => {
  const { currentBot, botPlan } = useAdminStore();
  const [flow, setFlow] = useState<Template | null>(null);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const rfInstance = useReactFlow();

  // Compute the template key -> nodes/edges
  const tplKey = useMemo(
    () => deriveKey(currentBot, botPlan),
    [currentBot, botPlan]
  );

  useEffect(() => {
    setFlow(buildTemplate(tplKey));
  }, [tplKey]);

  // Keep the diagram nicely zoomed
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        rfInstance.fitView({ padding: 0.2, duration: 350 });
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, [flow?.nodes?.length, flow?.edges?.length, rfInstance]);

  const nodes: Node[] = flow?.nodes ?? [];
  const edges: Edge[]  = flow?.edges ?? [];

  const showEmpty = !tplKey || !flow;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-muted/30">
      {/* Canvas */}
      <div
        ref={reactFlowWrapperRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-border bg-[var(--canvas-bg,_#f6f8fb)]"
      >
        {showEmpty ? (
          <div className="grid h-full place-items-center p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Canvas not ready
              </h2>
              <p className="text-muted-foreground">
                Pick a bot and plan (Basic or Custom) to load a template.<br />
                Expected key: <code className="px-2 py-1 rounded bg-muted">
                  {currentBot ? `${currentBot}_${botPlan.toLowerCase()}` : "—"}
                </code>
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            minZoom={0.5}
            maxZoom={1.75}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: "smoothstep" }}
          >
            {/* Clean, professional background */}
            <Background
              id="builder-bg"
              gap={24}
              lineWidth={1}
              color="rgba(99,102,241,0.1)"  // faint indigo lines
              variant="lines"                // lines instead of dots
            />
            <Controls position="bottom-left" />
            {/* Subtle MiniMap; flip to `false` to hide completely */}
            
          </ReactFlow>
        )}
      </div>

      {/* Right panel (repurpose the “blank” space) */}
      <aside
        className="ml-4 hidden xl:block"
        style={{ width: RIGHT_PANEL.width }}
      >
        <div className="sticky top-20 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Active Bots</h3>
              <span className="text-xs text-muted-foreground">+2 this month</span>
            </div>
            <div className="mt-2 text-3xl font-bold">12</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Total Leads</h3>
              <span className="text-xs text-green-600">+12% MoM</span>
            </div>
            <div className="mt-2 text-3xl font-bold">1,247</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Conversations</h3>
              <span className="text-xs text-green-600">+8% MoM</span>
            </div>
            <div className="mt-2 text-3xl font-bold">3,891</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Conversion Rate</h3>
              <span className="text-xs text-green-600">+2.1% MoM</span>
            </div>
            <div className="mt-2 text-3xl font-bold">23.4%</div>
          </div>

          {/* Tip card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-base font-semibold mb-2">Quick Tips</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Drag nodes to rearrange.</li>
              <li>Click a node to edit its content.</li>
              <li>Use zoom controls bottom-left.</li>
              <li>Switch Basic/Custom to change templates.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default function BuilderPage() {
  // React Flow requires the hook context; this wrapper ensures it’s present.
  return (
    <div className="p-4">
      <Builder />
    </div>
  );
}




  
           
           
          
         







 
  
                  
                    
                
              
                 
         
  
         
       
