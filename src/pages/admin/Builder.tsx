// src/pages/admin/Builder.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getJSON, setJSON } from "@/lib/storage";

// If you already export BotKey somewhere, you can keep that import.
// Keeping it local avoids type conflicts and unblocks you quickly.
export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

const ALL_BOT_KEYS: BotKey[] = [
  "LeadQualifier",
  "AppointmentBooking",
  "CustomerSupport",
  "Waitlist",
  "SocialMedia",
];

type Node = {
  id: string;
  label: string;
  text: string;
};

type FlowData = {
  nodes: Node[];
};

// starter flows per bot (you can expand these later)
const DEFAULT_FLOWS: Record<BotKey, FlowData> = {
  LeadQualifier: {
    nodes: [
      { id: "welcome", label: "Welcome", text: "Welcome to our Lead Qualifier!" },
      { id: "q1", label: "Budget?", text: "What's your budget range?" },
    ],
  },
  AppointmentBooking: {
    nodes: [
      { id: "welcome", label: "Welcome", text: "Let’s find a time that works for you." },
      { id: "q1", label: "Pick Time", text: "Choose an available slot." },
    ],
  },
  CustomerSupport: {
    nodes: [
      { id: "welcome", label: "Welcome", text: "How can we help today?" },
      { id: "q1", label: "Issue Type", text: "Billing, Shipping, Technical, or Other?" },
    ],
  },
  Waitlist: {
    nodes: [
      { id: "welcome", label: "Welcome", text: "Join our waitlist and we’ll notify you!" },
      { id: "q1", label: "Email", text: "What’s the best email to reach you?" },
    ],
  },
  SocialMedia: {
    nodes: [
      { id: "welcome", label: "Welcome", text: "Glad you found us on social!" },
      { id: "q1", label: "Platform", text: "Which platform should we connect on?" },
    ],
  },
};

const storageKey = (bot: BotKey) => `flow:${bot}`;

export default function Builder() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // 1) derive initial bot from ?bot=
  const initialBot = useMemo<BotKey>(() => {
    const q = params.get("bot");
    const key = (q ?? "Waitlist") as BotKey;
    return (ALL_BOT_KEYS as readonly string[]).includes(key) ? key : "Waitlist";
  }, [params]);

  const [currentBot, setCurrentBot] = useState<BotKey>(initialBot);
  const [flow, setFlow] = useState<FlowData>(() =>
    getJSON<FlowData>(storageKey(initialBot), DEFAULT_FLOWS[initialBot])
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // keep in sync with URL changes
  useEffect(() => {
    if (currentBot !== initialBot) {
      setCurrentBot(initialBot);
      const saved = getJSON<FlowData>(storageKey(initialBot), DEFAULT_FLOWS[initialBot]);
      setFlow(saved);
      setSelectedNodeId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBot]);

  // persist on change
  useEffect(() => {
    setJSON(storageKey(currentBot), flow);
  }, [currentBot, flow]);

  const selectedNode = flow.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const changeBot = (bot: BotKey) => {
    // update URL (and state via effect)
    navigate(`/admin/builder?bot=${bot}`, { replace: true });
  };

  const updateNode = (patch: Partial<Node>) => {
    if (!selectedNode) return;
    const updated = flow.nodes.map((n) =>
      n.id === selectedNode.id ? { ...n, ...patch } : n
    );
    setFlow({ nodes: updated });
  };

  const addNode = () => {
    const id = `node_${Math.random().toString(36).slice(2, 8)}`;
    const newNode: Node = { id, label: "New Step", text: "Describe this step..." };
    setFlow({ nodes: [...flow.nodes, newNode] });
    setSelectedNodeId(id);
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    const filtered = flow.nodes.filter((n) => n.id !== selectedNode.id);
    setFlow({ nodes: filtered });
    setSelectedNodeId(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-2 border-black rounded-2xl p-4 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-extrabold">Bot Builder</div>
          <div className="flex items-center gap-2">
            <label className="font-semibold">Bot:</label>
            <select
              className="border-2 border-black rounded-lg px-3 py-2 bg-white font-bold"
              value={currentBot}
              onChange={(e) => changeBot(e.target.value as BotKey)}
            >
              {ALL_BOT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 border-2 border-black rounded-lg bg-white font-bold"
            onClick={addNode}
          >
            + Add Node
          </button>
          <a
            href={`/admin/preview?bot=${currentBot}`}
            className="px-4 py-2 border-2 border-black rounded-lg bg-white font-bold"
          >
            Open Preview
          </a>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Canvas (simple list for now) */}
        <div className="border-2 border-black rounded-2xl p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 min-h-[520px]">
          <div className="mb-3 text-lg font-extrabold">Canvas</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flow.nodes.map((n) => {
              const selected = n.id === selectedNodeId;
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 ${
                    selected ? "border-indigo-600 bg-white" : "border-black bg-white"
                  }`}
                >
                  <div className="font-bold">{n.label}</div>
                  <div className="text-sm text-gray-600 line-clamp-3">{n.text}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="border-2 border-black rounded-2xl p-4 bg-white">
          <div className="mb-3 text-lg font-extrabold flex items-center justify-between">
            <span>Edit Text (per node)</span>
            <button
              onClick={deleteNode}
              disabled={!selectedNode}
              className={`px-3 py-1 border-2 rounded-lg font-bold ${
                selectedNode ? "border-black bg-white" : "border-gray-300 text-gray-400"
              }`}
              title={selectedNode ? "Delete selected node" : "Select a node first"}
            >
              Delete
            </button>
          </div>

          {!selectedNode ? (
            <div className="text-gray-600">Select a node on the left to edit its text.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Label</label>
                <input
                  className="w-full border-2 border-black rounded-lg px-3 py-2"
                  value={selectedNode.label}
                  onChange={(e) => updateNode({ label: e.target.value })}
                  placeholder="Node label"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Text</label>
                <textarea
                  className="w-full border-2 border-black rounded-lg px-3 py-2 min-h-[140px]"
                  value={selectedNode.text}
                  onChange={(e) => updateNode({ text: e.target.value })}
                  placeholder="Node text"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
