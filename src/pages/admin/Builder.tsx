import React, { useEffect, useMemo } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  MarkerType,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates"; // you already have this map

// --- Small helpers -----------------------------------------------------------
type Plan = "Basic" | "Custom";
type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

const templateKey = (bot: BotKey, plan: Plan) =>
  `${bot}_${plan.toLowerCase()}` as keyof typeof templates;

const emptyTemplate = { nodes: [] as Node[], edges: [] as Edge[] };

function useTemplate(bot: BotKey, plan: Plan) {
  return useMemo(() => {
    const key = templateKey(bot, plan);
    return templates[key] ?? emptyTemplate;
  }, [bot, plan]);
}

// --- Toolbar (top row inside the Builder page) ------------------------------
const BuilderToolbar: React.FC = () => {
  const { currentBot, plan, setPlan } = useAdminStore();
  const { fitView } = useReactFlow();

  return (
    <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 md:p-4 rounded-xl bg-white shadow-sm border">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Editing</span>
        <span className="text-base font-semibold">{currentBot}</span>
        <span className="text-sm text-muted-foreground">— Plan:</span>

        <div className="inline-flex rounded-lg overflow-hidden border">
          <button
            className={`px-3 py-2 text-sm transition ${
              plan === "Basic"
                ? "bg-indigo-600 text-white"
                : "bg-white hover:bg-indigo-50"
            }`}
            onClick={() => setPlan("Basic")}
          >
            Basic
          </button>
          <button
            className={`px-3 py-2 text-sm transition ${
              plan === "Custom"
                ? "bg-indigo-600 text-white"
                : "bg-white hover:bg-indigo-50"
            }`}
            onClick={() => setPlan("Custom")}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-slate-50"
        >
          Fit to view
        </button>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-slate-50"
        >
          Back to top
        </button>
      </div>
    </div>
  );
};

// --- Properties side panel (placeholder for now) ----------------------------
const PropertiesPanel: React.FC = () => {
  return (
    <aside className="w-full md:w-80 lg:w-96 shrink-0 rounded-xl border bg-white shadow-sm p-4 h-[420px] md:h-[calc(100vh-14rem)] sticky md:top-24">
      <h3 className="font-semibold mb-2">Properties</h3>
      <p className="text-sm text-muted-foreground">
        Select a node or edge to configure its properties. (Coming soon: label,
        placeholders, actions, webhooks, scoring, etc.)
      </p>
      <div className="mt-4 text-xs text-muted-foreground">
        Tip: You can pan with the mouse and zoom with the wheel on desktop. On
        mobile, pinch to zoom and drag to pan.
      </div>
    </aside>
  );
};

// --- Main Canvas -------------------------------------------------------------
const BuilderCanvas: React.FC = () => {
  const { currentBot, plan } = useAdminStore();
  const tpl = useTemplate(currentBot as BotKey, plan as Plan);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(
    tpl.nodes ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(
    (tpl.edges ?? []).map((e) => ({
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
    }))
  );

  useEffect(() => {
    // when the bot or plan changes, reset to the template nodes/edges
    setNodes(tpl.nodes ?? []);
    setEdges(
      (tpl.edges ?? []).map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl]);

  const onConnect = (connection: Connection) =>
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: true,
        },
        eds
      )
    );

  return (
    <div className="flex w-full gap-4">
      <div className="flex-1 h-[520px] md:h-[calc(100vh-14rem)] rounded-xl border overflow-hidden bg-white shadow-sm">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap className="!bg-white/80" />
          <Controls />
          <Background gap={16} />
          <Panel position="top-center" className="pointer-events-none">
            <div className="px-3 py-1 rounded-md text-xs bg-white/90 border shadow-sm">
              {currentBot} • {plan}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right properties panel (collapses under canvas on mobile) */}
      <div className="hidden md:block">
        <PropertiesPanel />
      </div>
    </div>
  );
};

// --- Page wrapper to ensure RF context --------------------------------------
const BuilderPageInner: React.FC = () => {
  return (
    <div className="p-3 md:p-6 space-y-4">
      <BuilderToolbar />
      <BuilderCanvas />
    </div>
  );
};

const Builder: React.FC = () => {
  // Wrapping in provider keeps React Flow stable across route changes
  return (
    <ReactFlowProvider>
      <BuilderPageInner />
    </ReactFlowProvider>
  );
};

export default Builder;
