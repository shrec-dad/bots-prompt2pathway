// src/pages/admin/Bots.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getBotSettings, setBotSettings, BotKey } from "@/lib/botSettings";
import {
  listInstances,
  removeInstance,
  duplicateInstanceFromTemplate,
  duplicateInstanceFromExisting,
  createInstance,
  renameInstance,
  type InstanceMeta,
} from "@/lib/instances";
import { getJSON, setJSON } from "@/lib/storage";

/* ---------------- types ---------------- */

type BotDef = {
  key: BotKey;
  name: string;
  gradient: string; // tailwind gradient classes
  emoji: string;
  description: string;
};

type ClientRef = {
  id: string;
  companyName: string;
};

const CLIENTS_KEY = "clients:list";

/* ---------------- display helpers ---------------- */

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
  // Plan mode per bot
  const [modes, setModes] = useState<Record<BotKey, "basic" | "custom">>(() =>
    Object.fromEntries(
      BOTS.map((b) => [b.key, getBotSettings(b.key).mode || "basic"])
    ) as Record<BotKey, "basic" | "custom">
  );

  // Instances list (My Bots)
  const [instances, setInstances] = useState<InstanceMeta[]>(() =>
    listInstances()
  );

  // Clients list for assignment
  const [clients] = useState<ClientRef[]>(() =>
    getJSON<ClientRef[]>(CLIENTS_KEY, [])
  );

  // UI states
  const [assignId, setAssignId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("");

  // keep in sync if storage changes elsewhere
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("botSettings:")) {
        const key = e.key.split(":")[1] as BotKey;
        setModes((prev) => ({ ...prev, [key]: getBotSettings(key).mode }));
      }
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Safely format a title for instances, even if name is missing
  const safeInstanceName = (m: InstanceMeta) => {
    const base =
      (m.name && String(m.name)) || `${botKeyToLabel(m.bot)} Instance`;
    return base;
  };

  // Sorted list
  const sortedInstances = useMemo(() => {
    return [...instances].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [instances]);

  // Assign bot to client (stored in client.notes for demo)
  function assignBotToClient(botId: string, clientId: string) {
  const clientList = getJSON<any[]>(CLIENTS_KEY, []);
  const updated = clientList.map((c) =>
    c.id === clientId
      ? {
          ...c,
          assignedBots: [...(c.assignedBots || []), botId],
        }
      : c
  );
  setJSON(CLIENTS_KEY, updated);
  alert("Bot assigned to client!");
}

  return (
    <div className="w-full h-full">
      {/* Header + Create button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-extrabold">Bots</div>
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

      {/* Metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value={String(sortedInstances.length)} />
        <Stat label="Conversations (7d)" value="1,284" />
        <Stat label="Leads / Tickets (7d)" value="312" />
      </div>

      {/* Bot catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {BOTS.map((b) => (
          <div
            key={b.key}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition group flex flex-col"
          >
            <div
              className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br ${b.gradient}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                  {b.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {b.name}
                  </h3>
                  <p className="text-sm font-semibold text-foreground/80">
                    {b.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="text-sm font-semibold text-foreground/80">
                Plan:
              </div>

              <select
                className="ml-auto rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm"
                value={modes[b.key]}
                onChange={(e) => {
                  const mode = e.target.value as "basic" | "custom";
                  setModes((prev) => ({ ...prev, [b.key]: mode }));
                  setBotSettings(b.key, { mode });
                }}
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>

              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20"
                onClick={() =>
                  (window.location.href = `/admin/builder?bot=${b.key}`)
                }
              >
                Open Builder
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg border bg-white px-4 py-2 text-sm font-bold hover:bg-muted/40"
                onClick={() => {
                  const mode = modes[b.key] || "basic";
                  duplicateInstanceFromTemplate(b.key, mode, `${b.name} (Copy)`);
                  setInstances(listInstances());
                }}
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
            You don’t have any instances yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedInstances.map((m) => {
              const title = safeInstanceName(m);
              const sub = `${botKeyToLabel(m.bot)} • ${m.mode}`;

              return (
                <div
                  key={m.id}
                  className="rounded-2xl border bg-card p-4 flex flex-col gap-3"
                >
                  <div className="text-lg font-extrabold leading-tight">
                    {title}
                  </div>
                  <div className="text-sm text-foreground/80">{sub}</div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() =>
                        (window.location.href = `/admin/builder?inst=${m.id}`)
                      }
                    >
                      Open
                    </button>
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-indigo-50"
                      onClick={() => {
                        const newName = prompt("Rename bot:", m.name);
                        if (newName) {
                          renameInstance(m.id, newName);
                          setInstances(listInstances());
                        }
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-emerald-50"
                      onClick={() => {
                        const copy = duplicateInstanceFromExisting(
                          m.id,
                          `${m.name} (Copy)`
                        );
                        if (copy) setInstances(listInstances());
                      }}
                    >
                      Clone
                    </button>
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-sky-50"
                      onClick={() => setAssignId(m.id)}
                    >
                      Assign
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

      {/* Assign modal */}
      {assignId && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] max-w-[95vw] shadow-xl border-2 border-black">
            <h2 className="text-lg font-extrabold mb-4">Assign Bot</h2>
            <select
              className="w-full border rounded-lg px-3 py-2 mb-4"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border"
                onClick={() => setAssignId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-emerald-500 text-white font-bold"
                onClick={() => {
                  if (!selectedClient) {
                    alert("Please choose a client.");
                    return;
                  }
                  assignBotToClient(assignId, selectedClient);
                  setAssignId(null);
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
