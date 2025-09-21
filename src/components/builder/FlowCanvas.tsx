// src/components/builder/FlowCanvas.tsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { NODE_TYPES } from "./nodeTypes";
import { templates, TemplateKey, Template } from "@/lib/templates";

type Props = { templateKey: TemplateKey; storageKey: string };

export const FlowCanvas: React.FC<Props> = ({ templateKey, storageKey }) => {
  // load from storage or template
  const initial: Template = useMemo(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return templates[templateKey];
  }, [templateKey, storageKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);

  // persist on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ nodes, edges }));
  }, [nodes, edges, storageKey]);

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge({ ...conn, type: "smoothstep" }, eds)),
    [setEdges]
  );

  const loadTemplate = () => {
    const t = templates[templateKey];
    setNodes(t.nodes);
    setEdges(t.edges);
  };

  const clear = () => {
    setNodes([]);
    setEdges([]);
  };

  const addNode = (type: keyof typeof NODE_TYPES) => {
    setNodes((nds) => [
      ...nds,
      {
        id: String(nds.length + 1 + Math.random()),
        type,
        position: { x: 80 + Math.random() * 200, y: 80 + Math.random() * 200 },
        data:
          type === "message"
            ? { title: "Message", text: "…" }
            : type === "inputNode"
            ? { label: "Question", placeholder: "Type…" }
            : type === "choiceNode"
            ? { label: "Pick one", options: ["Option A", "Option B"] }
            : { label: "Action", action: "sendEmail", destination: "admin@example.com" },
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Palette */}
      <div className="lg:col-span-1 space-y-3">
        <div className="rounded-xl border bg-white p-3">
          <div className="font-semibold mb-2">Node Palette</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={() => addNode("message")}>Message</button>
            <button className="btn" onClick={() => addNode("inputNode")}>Input</button>
            <button className="btn" onClick={() => addNode("choiceNode")}>Choice</button>
            <button className="btn" onClick={() => addNode("actionNode")}>Action</button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-3">
          <div className="font-semibold mb-2">Template</div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={loadTemplate}>Load Template</button>
            <button className="btn" onClick={clear}>Clear</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Auto-saves to localStorage. Loading resets to the default for this bot/plan.
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-4 h-[520px] rounded-xl border bg-white overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          fit

