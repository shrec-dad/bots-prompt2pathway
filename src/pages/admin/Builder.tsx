import React, { useCallback } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAdminStore } from "@/lib/AdminStore";

export const Builder: React.FC = () => {
  const { currentBot, botPlan } = useAdminStore();

  // Initial demo nodes
  const initialNodes = [
    { id: "1", type: "input", position: { x: 250, y: 25 }, data: { label: `${currentBot} Start` } },
    { id: "2", position: { x: 100, y: 125 }, data: { label: "Ask a Question" } },
    { id: "3", position: { x: 400, y: 125 }, data: { label: "Send Response" } },
  ];

  const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Builder</h1>
      <p className="text-gray-600">
        Editing <span className="font-semibold">{currentBot}</span> — Plan:{" "}
        <span className="font-semibold">{botPlan === "basic" ? "Basic" : "Custom"}</span>
      </p>

      <div className="h-[500px] rounded-xl border bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background gap={16} color="#eee" />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Builder;
