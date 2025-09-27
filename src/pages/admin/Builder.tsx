// src/pages/admin/Builder.tsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import { templates } from "@/lib/templates";
import { getBotSettings } from "@/lib/botSettings";

/* ------------------------- Custom Node Components ------------------------- */

const MessageNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.title || "Message"}</div>
    <div className="text-gray-500 text-sm">{data?.text || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ChoiceNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Choice"}</div>
    <div className="text-xs text-gray-600 mt-1">
      {(data?.options || []).join(" | ") || "No options"}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Action"}</div>
    <div className="text-xs text-gray-600">{data?.to || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const InputNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Input"}</div>
    <div className="text-xs text-gray-600">{data?.placeholder || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = { 
  message: MessageNode, 
  choice: ChoiceNode, 
  action: ActionNode, 
  input: InputNode 
};

/* --------------------------------- Helpers -------------------------------- */

type RFNode = Node & {
  type?: "default" | "input" | "output" | "group" | "message" | "choice" | "action";
  data?: any;
};

const OV_KEY = (bot: string, mode: "basic" | "custom") => `botOverrides:<span class="math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Expected group after &#x27;_&#x27; at position 6: {bot}_̲" style="color:#cc0000">{bot}_</span></span>{mode}`;

function getOverrides(bot: string, mode: "basic" | "custom") {
  try {
    const raw = localStorage.getItem(OV_KEY(bot, mode));
    if (raw) return JSON.parse(raw) as Record<string, any>;
  } catch (e) {
    console.error("Error loading overrides:", e);
  }
  return {};
}

function saveOverrides(bot: string, mode: "basic" | "custom", ov: Record<string, any>) {
  try {
    localStorage.setItem(OV_KEY(bot, mode), JSON.stringify(ov));
  } catch (e) {
    console.error("Error saving overrides:", e);
  }
}

/* -------------------------------- Main Component ------------------------------- */

function BuilderContent() {
  const { currentBot } = useAdminStore();
  const mode = (getBotSettings(currentBot as any)?.mode || "basic") as "basic" | "custom";
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const tplKey = `<span class="math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Expected group after &#x27;_&#x27; at position 13: {currentBot}_̲" style="color:#cc0000">{currentBot}_</span></span>{mode}`;
  
  // Get base template with fallback
  const base = useMemo(() => {
    const template = (templates as any)[tplKey] as { nodes: RFNode[]; edges: Edge[] } | undefined;
    if (!template) {
      console.warn(`No template found for ${tplKey}, using default`);
      // Return a default template structure
      return {
        nodes: [
          {
            id: '1',
            type: 'message',
            position: { x: 250, y: 50 },
            data: { title: 'Welcome', text: 'Hello! How can I help you today?' }
          }
        ],
        edges: []
      };
    }
    return template;
  }, [tplKey]);

  const [overrides, setOv] = useState<Record<string, any>>(() => getOverrides(currentBot, mode));

  const buildNodes = useCallback(
    (src: RFNode[], ov: Record<string, any>) =>
      src.map((n) => ({
        ...n,
        data: ov[n.id]?.data ? { ...(n.data || {}), ...ov[n.id].data } : (n.data || {})
      })),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(base.nodes, overrides));
  const [edges, setEdges, onEdgesChange] = useEdgesState(base.edges);

  // Refresh when bot/mode changes
  useEffect(() => {
    const nextBase = (templates as any)[`<span class="math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Expected group after &#x27;_&#x27; at position 13: {currentBot}_̲" style="color:#cc0000">{currentBot}_</span></span>{mode}`] || base;
    const nextOv = getOverrides(currentBot, mode);
    setOv(nextOv);
    setNodes(buildNodes(nextBase.nodes, nextOv) as Node[]);
    setEdges(nextBase.edges as Edge[]);
  }, [currentBot, mode, setNodes, setEdges, buildNodes, base]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  useEffect(() => {
    if (!selectedId) {
      setEditorValues({});
      return;
    }
    const n = nodes.find((x) => x.id === selectedId);
    if (n) {
      setEditorValues(n.data || {});
    }
  }, [selectedId, nodes]);

  const onNodeClick = useCallback((_: any, n: Node) => {
    if (!isEditorFocused) {
      setSelectedId(n?.id || null);
    }
  }, [isEditorFocused]);

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);

  const updateEditorValue = useCallback((k: string, v: any) => {
    setEditorValues((p: any) => ({ ...p, [k]: v }));
  }, []);

  const saveChanges = useCallback(() => {
    if (!selectedId) return;
    
    const updatedNodes = nodes.map((n) => 
      n.id === selectedId ? { ...n, data: { ...editorValues } } : n
    );
    setNodes(updatedNodes);
    
    const nextOv = { ...overrides, [selectedId]: { data: { ...editorValues } } };
    setOv(nextOv);
    saveOverrides(currentBot, mode, nextOv);
  }, [selectedId, editorValues, overrides, nodes, setNodes, currentBot, mode]);

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const inputClass =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-purple-700 mb-1">{children}</div>
  );

  const handleInputFocus = useCallback((e: React.FocusEvent) => {
    e.stopPropagation();
    setIsEditorFocused(true);
  }, []);

  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    e.stopPropagation();
    setIsEditorFocused(false);
  }, []);

  const Editor = () => {
    if (!selected) {
      return <div className="text-sm text-purple-600">Select a node above to edit its text and labels.</div>;
    }

    if (selected.type === "input") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter label…"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Placeholder</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.placeholder || ""}
              onChange={(e) => updateEditorValue("placeholder", e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter placeholder…"
              autoComplete="off"
            />
          </div>
        </div>
      );
    }

    if (selected.type === "choice") {
      const options: string[] = editorValues.options || [];
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter label…"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Options (one per line)</FieldLabel>
            <textarea
              className={inputClass}
              rows={5}
              value={options.join("\n")}
              onChange={(e) => {
                const lines = e.target.value.split("\n");
                const filteredOptions = lines.filter(line => line.length > 0);
                updateEditorValue("options", filteredOptions);
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={"Option 1\nOption 2\nOption 3"}
              autoComplete="off"
            />
          </div>
        </div>
      );
    }

    if (selected.type === "action") {
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Label</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.label || ""}
              onChange={(e) => updateEditorValue("label", e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter label…"
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Email / Target</FieldLabel>
            <input
              className={inputClass}
              value={editorValues.to || ""}
              onChange={(e) => updateEditorValue("to", e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="email@example.com"
              autoComplete="off"
            />
          </div>
        </div>
      );
    }

    // default => message
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            className={inputClass}
            value={editorValues.title || ""}
            onChange={(e) => updateEditorValue("title", e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter title…"
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel>Text</FieldLabel>
          <textarea
            className={inputClass}
            rows={4}
            value={editorValues.text || ""}
            onChange={(e) => updateEditorValue("text", e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter message text…"
            autoComplete="off"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full grid grid-rows-[1fr_auto] gap-4">
      {/* Canvas (pastel) */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-1 shadow-xl">
        <div
          className="rounded-xl overflow-hidden border border-white/50 shadow-inner"
          style={{
            width: "100%",
            minHeight: 480,
            height: "70vh",
            background:
              "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isEditorFocused ? undefined : onNodesChange}
            onEdgesChange={isEditorFocused ? undefined : onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={isEditorFocused ? null : "Delete"}
            selectionOnDrag={!isEditorFocused}
            selectNodesOnDrag={!isEditorFocused}
            panOnDrag={!isEditorFocused}
            zoomOnScroll={!isEditorFocused}
            nodesDraggable={!isEditorFocused}
            nodesConnectable={!isEditorFocused}
            elementsSelectable={!isEditorFocused}
          >
            <Background gap={20} size={1} color="#e9d5ff" style={{ opacity: 0.3 }} />
            <Controls
              showInteractive={false}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Editor (pastel) */}
      <div 
        className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-extrabold mb-3 text-purple-900">
          Edit Text <span className="font-normal text-purple-700">(per node)</span>
        </div>
        <Editor />
        {selected && (
          <div className="mt-4 space-y-2">
            <button
              onClick={saveChanges}
              className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
            >
              Save Changes
            </button>
            <div className="text-xs text-purple-600 text-center">
              Changes are saved when you click the Save button
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with ReactFlowProvider
export default function Builder() {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
}
