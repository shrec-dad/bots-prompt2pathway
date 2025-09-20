import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodePalette } from './NodePalette';
import { NodeInspector } from './NodeInspector';
import { BotNode } from '@/types/bot';
import { MessageNode } from './nodes/MessageNode';
import { InputNode } from './nodes/InputNode';
import { ChoiceNode } from './nodes/ChoiceNode';

const nodeTypes = {
  message: MessageNode,
  input: InputNode,
  choice: ChoiceNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'message',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Welcome Message',
      content: 'Hello! I\'m here to help you qualify leads for your business.',
    },
  },
];

const initialEdges: Edge[] = [];

export const BotBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    []
  );

  const onNodeDragStart = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type,
      position: position || { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        content: type === 'message' ? 'Enter your message here...' : undefined,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  return (
    <div className="flex h-full bg-card">
      {/* Left Panel - Node Palette */}
      <div className="w-80 border-r border-border/50 bg-background-soft">
        <NodePalette onAddNode={addNode} />
      </div>

      {/* Center Panel - Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          snapToGrid
          snapGrid={[20, 20]}
          className="bg-gradient-to-br from-background via-background-soft to-muted/20"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color="hsl(var(--border))"
          />
          <Controls 
            className="bg-card border border-border/50 rounded-lg shadow-medium"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <MiniMap 
            className="bg-card border border-border/50 rounded-lg shadow-medium"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--muted) / 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Right Panel - Inspector */}
      <div className="w-80 border-l border-border/50 bg-background-soft">
        <NodeInspector 
          selectedNode={selectedNode} 
          onUpdateNode={updateNodeData}
        />
      </div>
    </div>
  );
};