// src/pages/admin/Bots.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getBotSettings, setBotSettings, BotKey } from "@/lib/botSettings";
import {
  listInstances,
  removeInstance,
  duplicateInstanceFromTemplate,
  createInstance,
  type InstanceMeta,
} from "@/lib/instances";
import { getJSON, setJSON } from "@/lib/storage";

/* ---------- shared analytics store ---------- */
type Metrics = {
  conversations: number;
  leads: number;
  avgResponseSecs?: number;
  csatPct?: number;
};
const METRICS_KEY = "analytics:metrics";

/* ---------- localStorage keys used here ---------- */
const INST_INDEX_KEY = "botInstances:index";
const CLIENTS_KEY = "clients:list";

/* ---------- light client type (what we need here) ---------- */
type ClientLite = {
  id: string;
  companyName: string;
  name?: string;
  email?: string;
  plan?: string;
  status?: "Active" | "Paused";
  lastActivity?: string;
  defaultBot?: BotKey;
  notes?: string;
  bots?: number;            // shown in Clients UI
  assignedBots?: string[];  // instance IDs
};

/* ---------------- display helpers ---------------- */
type BotDef = {
  key: BotKey;
  name: string;
  gradient: string;
  emoji: string;
  description: string;
};

const BOTS: BotDef[] = [
  {
    key: "LeadQualifier",
    name: "Lead Qualifier",
    emoji: "🎯",
    gradient: "from-purple-500/20 via-fuchsia-400/20 to-pink-500/20",
    description:
      "Qualify leads with scoring, validation and routing. Best for sales intake.",
  },
  {
    key: "AppointmentBooking",
    name: "Appointment Booking",
    emoji: "📅",
    gradient: "from-emerald-500/20 via-teal-400/20 to-cyan-500/20",
    description:
      "Offer services, show availability, confirm and remind automatically.",
  },
  {
    key: "CustomerSupport",
    name: "Customer Support",
    emoji: "🛟",
    gradient: "from-indigo-500/20 via-blue-400/20 to-sky-500/20",
    description:
      "Answer FAQs, create tickets, route priority issues and hand off to humans.",
  },
  {
    key: "Waitlist",
    name: "Waitlist",
    emoji: "⏳",
    gradient: "from-amber-500/25 via-orange-400/20 to-rose-500/20",
    description: "Collect interest, show queue status and notify customers.",
  },
  {
    key: "SocialMedia",
    name: "Social Media",
    emoji: "📣",
    gradient: "from-pink-500/20 via-rose-400/20 to-red-500/20",
    description:
      "Auto-DM replies, comment handling, and engagement prompts across platforms.",
  },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
        {label}
      </div>
      <div className="text-xl font-extrabold leading-tight">{value}</div>
    </div>
  );
}

function botKeyToLabel(key: BotKey) {
  const found = BOTS.find((b) => b.key === key);
  return found ? found.name : (key as string);
}

/* ---------------- main page ---------------- */

export default function Bots() {
  // Per-bot mode
  const [modes, setModes] = useState<Record<BotKey, "basic" | "custom">>(() =>
    Object.fromEntries(
      BOTS.map((b) => [b.key, getBotSettings(b.key).mode || "basic"])
    ) as Record<BotKey, "basic" | "custom">
  );

  // Instances list (My Bots)
  const [instances, setInstances] = useState<InstanceMeta[]>(() =>
    listInstances()
  );

  // Clients (for assignment)
  const [clients, setClients] = useState<ClientLite[]>(() =>
    getJSON<ClientLite[]>(CLIENTS_KEY, [])
  );

  // Metrics for header
  const [metrics, setMetrics] = useState<Metrics>(() =>
    getJSON<Metrics>(METRICS_KEY, { conversations: 0, leads: 0 })
  );

  // Rename modal state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  // Assign modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignBotId, setAssignBotId] = useState<string | null>(null);
  const [assignClientId, setAssignClientId] = useState<string>("");

  // storage sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("botSettings:")) {
        const key = e.key.split(":")[1] as BotKey;
        setModes((prev) => ({ ...prev, [key]: getBotSettings(key).mode }));
      }
      if (e.key === INST_INDEX_KEY || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
      if (e.key === METRICS_KEY) {
        setMetrics(getJSON<Metrics>(METRICS_KEY, { conversations: 0, leads: 0 }));
      }
      if (e.key === CLIENTS_KEY) {
        setClients(getJSON<ClientLite[]>(CLIENTS_KEY, []));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resetTopStats = () => {
    const next = { ...metrics, conversations: 0, leads: 0 };
    setMetrics(next);
    setJSON(METRICS_KEY, next);
  };

  const fmtInt = (n: number) =>
    Number.isFinite(n) ? Math.max(0, Math.round(n)).toLocaleString() : "0";

  // Instance helpers
  const sortedInstances = useMemo(
    () => [...instances].sort((a, b) => b.updatedAt - a.updatedAt),
    [instances]
  );

  const openRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameText(currentName || "");
    setRenameOpen(true);
  };

  const saveRename = () => {
    if (!renameId) return;
    const idx = getJSON<InstanceMeta[]>(INST_INDEX_KEY, []);
    const updated = idx.map((m) =>
      m.id === renameId ? { ...m, name: renameText.trim() || m.name, updatedAt: Date.now() } : m
    );
    setJSON(INST_INDEX_KEY, updated);
    setInstances(listInstances());
    setRenameOpen(false);
    setRenameId(null);
    setRenameText("");
  };

  const openAssign = (id: string) => {
    setAssignBotId(id);
    setAssignClientId("");
    setAssignOpen(true);
  };

  const saveAssign = () => {
    if (!assignBotId || !assignClientId) return;
    const list = getJSON<ClientLite[]>(CLIENTS_KEY, []);
    const i = list.findIndex((c) => c.id === assignClientId);
    if (i >= 0) {
      const existing = new Set(list[i].assignedBots || []);
      existing.add(assignBotId);
      const arr = Array.from(existing);
      list[i].assignedBots = arr;
      // keep visible count in sync
      list[i].bots = arr.length;
      list[i].lastActivity = "updated now";
      setJSON(CLIENTS_KEY, list);
      setClients(list);
    }
    setAssignOpen(false);
    setAssignBotId(null);
    setAssignClientId("");
  };

  return (
    <div className="w-full h-full">
      {/* Header + Create / Reset */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-extrabold">Bots</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30"
            title="Reset Conversations and Leads"
            onClick={resetTopStats}
          >
            Reset
          </button>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            onClick={() => {
              const first = BOTS[0];
              const mode = modes[first.key] || "basic";
              const meta = createInstance(first.key, mode, `${first.name} (New)`);
              setInstances(listInstances());
              window.location.href = `/admin/builder?inst=${meta.id}`;
            }}
          >
            + Create New Bot
          </button>
        </div>
      </div>

      {/* Header metrics row (live) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value={String(sortedInstances.length)} />
        <Stat label="Conversations (7d)" value={fmtInt(metrics.conversations)} />
        <Stat label="Leads / Tickets (7d)" value={fmtInt(metrics.leads)} />
      </div>

      {/* Bot catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {BOTS.map((b) => (
          <div
            key={b.key}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition group flex flex-col"
          >
            <div className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br ${b.gradient}`}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                  {b.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">{b.name}</h3>
                  <p className="text-sm font-semibold text-foreground/80">{b.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="text-sm font-semibold text-foreground/80">Plan:</div>

              <select
                className="ml-auto rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm"
                value={modes[b.key]}
                onChange={(e) => {
                  const mode = e.target.value as "basic" | "custom";
                  setModes((prev) => ({ ...prev, [b.key]: mode }));
                  setBotSettings(b.key, { mode });
                }}
                aria-label={`${b.name} plan`}
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>

              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => (window.location.href = `/admin/builder?bot=${b.key}`)}
                aria-label={`Open ${b.name} in Builder`}
              >
                Open Builder
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-muted/40"
                onClick={() => {
                  const mode = modes[b.key] || "basic";
                  const meta = duplicateInstanceFromTemplate(b.key, mode, `${b.name} (Copy)`);
                  setInstances(listInstances());
                  // Immediately let the user rename or assign if they want:
                  openRename(meta.id, meta.name);
                }}
                aria-label={`Duplicate ${b.name}`}
              >
                Duplicate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Bots */}
      <div className="mt-10">
        <div className="text-lg font-extrabold mb-3">My Bots</div>

        {sortedInstances.length === 0 ? (
          <div className="rounded-xl border bg-card p-4 text-sm">
            You don’t have any instances yet. Click <b>Duplicate</b> on a card
            above or use <b>Create New Bot</b>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedInstances.map((m) => {
              const title = (m.name && String(m.name)) || `${botKeyToLabel(m.bot)} Instance`;
              const sub = `${botKeyToLabel(m.bot)} • ${m.mode}`.trim();

              return (
                <div key={m.id} className="rounded-2xl border bg-card p-4 flex flex-col gap-3">
                  <div className="text-lg font-extrabold leading-tight">{title}</div>
                  <div className="text-sm text-foreground/80">{sub}</div>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => (window.location.href = `/admin/builder?inst=${m.id}`)}
                    >
                      Open
                    </button>
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-indigo-50"
                      onClick={() => openRename(m.id, title)}
                    >
                      Rename
                    </button>
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-emerald-50"
                      onClick={() => openAssign(m.id)}
                    >
                      Assign to Client
                    </button>
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-rose-50"
                      onClick={() => {
                        removeInstance(m.id);
                        setInstances(listInstances());
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename modal */}
      {renameOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-[520px] max-w-[94vw] rounded-2xl border-2 border-black bg-white shadow-2xl">
            <div className="rounded-t-2xl p-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white flex items-center justify-between">
              <div className="text-lg font-extrabold">Rename Bot</div>
              <button className="px-2 py-1 font-bold bg-white/90 text-black rounded-lg" onClick={() => setRenameOpen(false)}>×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm font-bold uppercase text-purple-700">New Name</div>
              <input
                className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                placeholder="e.g., Acme — Support Bot"
              />
              <div className="flex items-center justify-end gap-2">
                <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40" onClick={() => setRenameOpen(false)}>Cancel</button>
                <button className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]" onClick={saveRename}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-[520px] max-w-[94vw] rounded-2xl border-2 border-black bg-white shadow-2xl">
            <div className="rounded-t-2xl p-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white flex items-center justify-between">
              <div className="text-lg font-extrabold">Assign Bot to Client</div>
              <button className="px-2 py-1 font-bold bg-white/90 text-black rounded-lg" onClick={() => setAssignOpen(false)}>×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm font-bold uppercase text-purple-700">Client</div>
              <select
                className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold"
                value={assignClientId}
                onChange={(e) => setAssignClientId(e.target.value)}
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2">
                <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40" onClick={() => setAssignOpen(false)}>Cancel</button>
                <button className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]" disabled={!assignClientId} onClick={saveAssign}>Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
