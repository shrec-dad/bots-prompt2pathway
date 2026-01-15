// src/pages/admin/Builder.tsx
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  ReactFlow,
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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { fetchBots, updateBot } from '@/store/botsSlice';
import { fetchInstances, updateInstance } from '@/store/botInstancesSlice';

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
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400 break-words whitespace-normal overflow-hidden">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data?.label || "Input"}</div>
    <div className="text-xs text-gray-600">{data?.placeholder || "…"}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const PhoneNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-sky-50 border-2 border-sky-400">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2">
      <span className="text-xl">☎️</span>
      <div>
        <div className="font-bold text-sm">{data?.label || "Phone"}</div>
        <div className="text-xs text-gray-600">
          {data?.phoneAction || "Handle call"}
        </div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const CalendarNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-emerald-50 border-2 border-emerald-400">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2">
      <span className="text-xl">📅</span>
      <div>
        <div className="font-bold text-sm">{data?.label || "Calendar"}</div>
        <div className="text-xs text-gray-600">
          {data?.calendarAction || "Book appointment"}
        </div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = {
  message: MessageNode,
  choice: ChoiceNode,
  action: ActionNode,
  input: InputNode,
  phone: PhoneNode,
  calendar: CalendarNode,
};

type RFNode = Node & {
  type?:
    | "default"
    | "input"
    | "output"
    | "group"
    | "message"
    | "choice"
    | "action"
    | "phone"
    | "calendar";
  data?: any;
};

type Source = { 
  kind: string; 
  id: string; 
  mode: string 
};

const sourceToValue = (s: Source) =>
  s?.kind === "bot" ? `bot:${s?.id}` : `inst:${s?.id}`;


/* Editor with Phone and Calendar support */
function Editor({ selected, editorValues, updateEditorValue}) {
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-bold uppercase text-foreground/80 mb-1">
      {children}
    </div>
  );
  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400";


  if (!selected)
    return (
      <div className="text-sm text-foreground/80">
        Select a node above to edit its text and labels.
      </div>
    );

  if (selected.type === "phone") {
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel>Label</FieldLabel>
          <input
            className={inputClass}
            value={editorValues.label || ""}
            onChange={(e) => updateEditorValue("label", e.target.value)}
            placeholder="Phone Handler"
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel>Phone Action</FieldLabel>
          <select
            className={inputClass}
            value={editorValues.phoneAction || "answer"}
            onChange={(e) => updateEditorValue("phoneAction", e.target.value)}
          >
            <option value="answer">Answer Call</option>
            <option value="transfer">Transfer to Human</option>
            <option value="voicemail">Take Voicemail</option>
            <option value="collect-info">Collect Information</option>
          </select>
        </div>
      </div>
    );
  }

  if (selected.type === "calendar") {
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel>Label</FieldLabel>
          <input
            className={inputClass}
            value={editorValues.label || ""}
            onChange={(e) => updateEditorValue("label", e.target.value)}
            placeholder="Calendar Action"
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel>Calendar Action</FieldLabel>
          <select
            className={inputClass}
            value={editorValues.calendarAction || "check-availability"}
            onChange={(e) =>
              updateEditorValue("calendarAction", e.target.value)
            }
          >
            <option value="check-availability">Check Availability</option>
            <option value="book">Book Appointment</option>
            <option value="cancel">Cancel Appointment</option>
            <option value="reschedule">Reschedule Appointment</option>
          </select>
        </div>
      </div>
    );
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
            onChange={(e) =>
              updateEditorValue(
                "options",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
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
            placeholder="email@example.com"
            autoComplete="off"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Title</FieldLabel>
        <input
          className={inputClass}
          value={editorValues.title || ""}
          onChange={(e) => updateEditorValue("title", e.target.value)}
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
          placeholder="Enter message text…"
          autoComplete="off"
        />
      </div>
    </div>
  );
};

function BuilderInner() {
  const dispatch = useDispatch();
  const instances = useSelector((state: RootState) => state.instances.list);
  const bots = useSelector((state: RootState) => state.bots.list);
  const [search, setSearch] = useSearchParams();

  const queryInst = search.get("inst") || undefined;
  const queryBot = (search.get("bot") as string | null) || null;

  const handleUpdateBot = async (id, data) => {
    try {
      await dispatch(updateBot({id, data})).unwrap();
      dispatch(fetchBots());
    } catch (err: any) {
  
    }
  }

  const handleUpdateInstance = async (id, data) => {
    try {
      await dispatch(updateInstance({id, data})).unwrap();
      dispatch(fetchInstances());
    } catch (err: any) {
  
    }
  }

  const handleSaveNodes = async (nextNodes) => {
    if (source?.kind == "bot") {
      const bot = bots.find(b => b._id === source?.id);
      if (!bot) return;

      const updatedNodes = {
        ...bot.nodes,
        [source?.mode]: nextNodes,
      };

      handleUpdateBot(source?.id, { nodes: updatedNodes });
    } else {
      const inst = instances.find(b => b._id === source?.id);
      if (!inst) return;

      const updatedNodes = {
        ...inst.nodes,
        [source?.mode]: nextNodes,
      };

      handleUpdateInstance(source?.id, { nodes: updatedNodes });
    }
  }

  const handleSaveEdges = async (nextEdges: any) => {
    // Ensure all edges have a type and convert to the format expected by the database
    const edgesWithType = nextEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type || "smoothstep",
    })) as { id: string; source: string; target: string; type: string }[];

    if (source?.kind == "bot") {
      const bot = bots.find(b => b._id === source?.id);
      if (!bot) return;

      const updatedEdges = {
        ...bot.edges,
        [source?.mode]: edgesWithType,
      };

      handleUpdateBot(source?.id, { edges: updatedEdges });
    } else {
      const inst = instances.find(b => b._id === source?.id);
      if (!inst) return;

      const updatedEdges = {
        ...inst.edges,
        [source?.mode]: edgesWithType,
      };

      handleUpdateInstance(source?.id, { edges: updatedEdges });
    }
  }

  useEffect(() => {
    dispatch(fetchInstances());
    dispatch(fetchBots());
  }, [dispatch]);

  useEffect(() => {
    if (bots.length === 0 && instances.length === 0) return;

    if (queryInst) {
      const inst = instances.find(b => b._id == queryInst);
      setSource({ kind: "inst", id: queryInst, mode: (inst ? inst.plan : 'basic') });
    }
    else {
      const botId = queryBot || bots[0]?._id;
      const bot = bots.find(b => b._id == botId);
      setSource({ kind: "bot", id: botId, mode: bot?.plan || 'basic' });
    }
  }, [queryInst, queryBot, bots, instances])

  const [source, setSource] = useState<Source | null>(null);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!source) return;

    const found = source?.kind == "bot" ? bots.find(b => b._id == source?.id) : instances.find(b => b._id == source?.id);

    if (found) {
      setNodes(found.nodes[source?.mode] as RFNode[]);
      setEdges(found.edges[source?.mode] as Edge[]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [source, bots, instances]);

  const onModeChange = async (next: "basic" | "custom") => {
    setSource({ ...source, mode: next });
    if (source?.kind === "inst") {
      handleUpdateInstance(source?.id, {plan: next});
    } else {
      handleUpdateBot(source?.id, {plan: next});
    }
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<any>({});

  useEffect(() => {
    if (!selectedId) return setEditorValues({});
    const n = nodes.find((x) => x.id === selectedId);
    setEditorValues(n?.data || {});
  }, [selectedId]);

  // Wrap onNodesChangeBase to handle node deletions (without saving)
  const onNodesChange = useCallback(
    (changes: any[]) => {
      // Apply changes first
      onNodesChangeBase(changes);
      
      // Check if any nodes were deleted
      const deletedNodeIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id);
      
      if (deletedNodeIds.length > 0) {
        // Update nodes state (without saving)
        setNodes((prevNodes) => {
          return prevNodes.filter((n) => !deletedNodeIds.includes(n.id));
        });
        
        // Also remove edges connected to deleted nodes (without saving)
        setEdges((prevEdges) => {
          return prevEdges.filter(
            (e) => !deletedNodeIds.includes(e.source) && !deletedNodeIds.includes(e.target)
          );
        });
        
        // Clear selection if deleted node was selected
        if (selectedId && deletedNodeIds.includes(selectedId)) {
          setSelectedId(null);
        }
      }
    },
    [onNodesChangeBase, setNodes, setEdges, selectedId]
  );

  // Wrap onEdgesChangeBase to handle edge deletions (without saving)
  const onEdgesChange = useCallback(
    (changes: any[]) => {
      // Apply changes first
      onEdgesChangeBase(changes);
      
      // Check if any edges were deleted
      const deletedEdgeIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id);
      
      if (deletedEdgeIds.length > 0) {
        // Update edges state (without saving)
        setEdges((prevEdges) => {
          return prevEdges.filter((e) => !deletedEdgeIds.includes(e.id));
        });
      }
    },
    [onEdgesChangeBase, setEdges]
  );

  const onNodeClick = useCallback(
    (_: any, n: Node) => {
      setSelectedId(n?.id || null);
    },
    []
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      setEdges((eds) => {
        const newEdge: Edge = {
          id: `e_${c.source}_${c.target}`,
          source: c.source,
          target: c.target,
          type: "smoothstep",
        };
        return addEdge(newEdge, eds);
      });
    },
    [setEdges]
  );

  // const updateEditorValue = (k: string, v: any) =>
  //   setEditorValues((p: any) => ({ ...p, [k]: v }));

  const updateEditorValue = useCallback((k: string, v: any) => {
    setEditorValues((p: any) => ({ ...p, [k]: v }));
  }, []);
    

  const saveChanges = useCallback(() => {
    if (!selectedId) return;
    // Only update local state, don't save to DB
    setNodes((prev) => {
      return prev.map((n) =>
        n.id === selectedId ? { ...n, data: { ...editorValues } } : n
      );
    });
  }, [selectedId, editorValues, setNodes]);

  const rf = useReactFlow<RFNode, Edge>();
  const [pendingType, setPendingType] = useState<
    | null
    | "message"
    | "choice"
    | "input"
    | "action"
    | "phone"
    | "calendar"
  >(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const nextId = () =>
    `node_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  const defaultDataFor = (t: Exclude<typeof pendingType, null>) => {
    switch (t) {
      case "message":
        return { title: "New Message", text: "Edit me…" };
      case "choice":
        return { label: "Choose one", options: ["Option A", "Option B"] };
      case "input":
        return { label: "Your input", placeholder: "Type here…" };
      case "action":
        return { label: "Action", to: "mailto:example@domain.com" };
      case "phone":
        return { label: "Phone Handler", phoneAction: "answer" };
      case "calendar":
        return {
          label: "Calendar Booking",
          calendarAction: "check-availability",
        };
      default:
        return {};
    }
  };

  const addMenuItem = useCallback(
    (type: typeof pendingType) => {
      if (!type) return;

      // Calculate position - use center of viewport or offset from existing nodes
      const viewport = rf.getViewport();
      let x = -viewport.x + 400;
      let y = -viewport.y + 300;

      // If there are existing nodes, place new node offset from the last one
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        x = lastNode.position.x + 250;
        y = lastNode.position.y;
      }

      const id = nextId();
      const data = defaultDataFor(type);

      const newNode: RFNode = {
        id,
        type,
        position: { x, y },
        data,
      };

      setNodes((prev) => {
        return [...prev, newNode];
      });

      // Don't create an edge - just add the node
      setSelectedId(id);
      setAddMenuOpen(false);
      setPendingType(null);
    },
    [rf, nodes, setNodes]
  );

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (!pendingType) return;
      const flowPos = rf.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const id = nextId();
      const data = defaultDataFor(pendingType);

      const newNode: RFNode = {
        id,
        type: pendingType,
        position: flowPos,
        data,
      };

      setNodes((prev) => {
        return [...prev, newNode];
      });

      if (selectedId) {
        setEdges((prev) => {
          return [
            ...prev,
            {
              id: `e_${selectedId}_${id}`,
              source: selectedId,
              target: id,
              type: "smoothstep",
            },
          ];
        });
      }

      setSelectedId(id);
      setPendingType(null);
      setAddMenuOpen(false);
    },
    [
      pendingType,
      rf,
      selectedId,
      setEdges,
      setNodes,
    ]
  );

  const deleteSelected = () => {
    if (!selectedId) return;

    setNodes((prev) => {
      return prev.filter((n) => n.id !== selectedId);
    });

    setEdges((prev) => {
      return prev.filter((e) => e.source !== selectedId && e.target !== selectedId);
    });

    setSelectedId(null);
  };

  // Save all changes (nodes and edges) to database
  const saveAllChanges = useCallback(async () => {
    handleSaveNodes(nodes);
    // Ensure all edges have type property before saving
    const edgesWithType = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type || "smoothstep",
    }));
    handleSaveEdges(edgesWithType as any);
  }, [nodes, edges, handleSaveNodes, handleSaveEdges]);

  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const stop = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    };
    ["keydown", "keyup", "keypress"].forEach((evt) =>
      el.addEventListener(evt, stop, true)
    );
    return () => {
      ["keydown", "keyup", "keypress"].forEach((evt) =>
        el.removeEventListener(evt, stop, true)
      );
    };
  }, []);

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) as RFNode | undefined,
    [nodes, selectedId]
  );

  const selectValue = sourceToValue(source);

  function onSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;

    if (v.startsWith("inst:")) {
      const id = v.slice(5);
      const inst = instances.find(b => b._id == id);
      const mode = (inst?.plan as "basic" | "custom") || "custom";

      setSource({ kind: "inst", id, mode });

      setSearch((s) => {
        s.set("inst", id);
        s.delete("bot");
        return s;
      });
      return;
    }

    if (v.startsWith("bot:")) {
      const id = v.slice(4);
      const bot = bots.find(b => b._id == id);
      const mode = (bot?.plan as "basic" | "custom") || "custom";

      setSource({ kind: "bot", id, mode });

      setSearch((s) => {
        s.set("bot", id);
        s.delete("inst");
        return s;
      });
      return;
    }
  }

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto] gap-4 p-6">
      {/* ===== Header ===== */}
      <div className="strong-card">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="p-2 space-y-2">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Builder</h1>
              <p className="text-foreground/80 text-sm mt-1">
                Drag-and-drop flow editor.{" "}
                {source?.kind === "inst"
                  ? "Editing a duplicated bot instance."
                  : "Pick a bot and edit the copy of each node."}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase text-foreground/70">
                  Bot
                </label>
                <select
                  className="rounded-lg border px-3 py-2 font-semibold bg-white min-w-[260px]"
                  value={selectValue}
                  onChange={onSelectChange}
                  title="Choose a Template Bot or a Client Bot (instance)"
                >
                  <optgroup label="Client Bots (instances)">
                    {bots.length === 0 ? (
                      <option value="inst:" disabled>
                        No client bots yet — duplicate or create one first
                      </option>
                    ) : (
                      instances
                        .slice()
                        .sort((a, b) => b.updatedAt - a.updatedAt)
                        .map((b) => (
                          <option key={b._id} value={`inst:${b._id}`}>
                            {b.name} • {b.plan}
                          </option>
                        ))
                    )}
                  </optgroup>

                  <optgroup label="Templates">
                    {bots.map((b) => (
                      <option key={b._id} value={`bot:${b._id}`}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-foreground/70">
                  Mode
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-md px-2 py-1 text-xs font-bold ring-1 ring-border ${
                      source?.mode === "basic"
                        ? "bg-indigo-100"
                        : "hover:bg-muted/40 bg-white"
                    }`}
                    onClick={() => onModeChange("basic")}
                  >
                    basic
                  </button>
                  <button
                    className={`rounded-md px-2 py-1 text-xs font-bold ring-1 ring-border ${
                      source?.mode === "custom"
                        ? "bg-indigo-100"
                        : "hover:bg-muted/40 bg-white"
                    }`}
                    onClick={() => onModeChange("custom")}
                  >
                    custom
                  </button>
                </div>
              </div>

              {/* Add Node */}
              <div className="relative">
                <button
                  onClick={() => setAddMenuOpen((v) => !v)}
                  className="rounded-md px-3 py-2 text-xs font-extrabold ring-1 ring-border bg-white hover:bg-gray-50 border-2 border-black"
                  aria-expanded={addMenuOpen}
                  aria-haspopup="menu"
                >
                  + Add Node
                </button>
                {addMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-lg border-2 border-black bg-white shadow-xl z-20"
                  >
                    {(
                      ["message", "choice", "input", "action", "phone", "calendar"] as const
                    ).map((t) => (
                      <button
                        key={t}
                        role="menuitem"
                        onClick={() => {
                          addMenuItem(t);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                      >
                        {t === "phone"
                          ? "☎️ Phone"
                          : t === "calendar"
                          ? "📅 Calendar"
                          : t[0].toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Changes */}
              <div className="relative">
                <button
                  onClick={saveAllChanges}
                  className="rounded-md px-3 py-2 text-xs font-extrabold ring-1 ring-border bg-white hover:bg-gray-50 border-2 border-black"
                  title="Save all changes to database"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Canvas ===== */}
      <div 
        className="strong-card" 
        style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))", color: "var(--grad-text)"}}>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            width: "100%",
            minHeight: 480,
            height: "60vh"
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            deleteKeyCode="Delete"
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            panOnDrag={true}
            zoomOnScroll={true}
          >
            <Background gap={20} size={1} color="#e9d5ff" style={{ opacity: 0.3 }} />
            <Controls
              showInteractive={false}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200"
            />
          </ReactFlow>
        </div>

        {!source?.id && (
          <div className="px-4 py-3 text-sm text-foreground/80">
            No template found for <b>{source?.id}</b> in mode <b>{source?.mode}</b>. Make sure your
            <code className="mx-1 px-1 rounded bg-muted/50">templates</code>{" "}
            storage includes a graph for this key+mode.
          </div>
        )}

        {pendingType && (
          <div className="mt-2 px-4 text-xs font-bold text-foreground/80">
            Click on the canvas to place your new{" "}
            {pendingType === "phone"
              ? "Phone"
              : pendingType === "calendar"
              ? "Calendar"
              : pendingType[0].toUpperCase() + pendingType.slice(1)}{" "}
            node.
          </div>
        )}
      </div>

      {/* ===== Editor ===== */}
      <div
        ref={editorRef}
        className="strong-card" 
        style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))", color: "var(--grad-text)"}}
      >
        <div className="p-5 space-y-4">
          <div className="text-sm font-extrabold text-foreground">
            Edit Text <span className="font-normal text-foreground/70">(per node)</span>
          </div>
          <Editor selected={selected} editorValues={editorValues} updateEditorValue={updateEditorValue}/>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={saveChanges}
                  className="py-2 px-4 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm border-2 border-black shadow-[0_3px_0_#000] active:translate-y-[1px]"
                  style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))", color: "var(--grad-text)"}}
                >
                  Save Node
                </button>
                <button
                  onClick={deleteSelected}
                  className="py-2 px-4 bg-white border-2 border-black rounded-xl hover:bg-rose-50 font-semibold text-sm shadow-[0_3px_0_rgba(0,0,0,0.8)] active:translate-y-[1px]"
                  title="Delete selected node and its connections"
                >
                  Delete Node
                </button>
              </div>
              <div className="text-xs text-foreground/70 text-center">
                Changes are saved when you click the Save button
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5)  Export with Provider wrapper to satisfy useReactFlow()
   ========================================================================= */

export default function Builder() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <BuilderInner />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
