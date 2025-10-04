// src/pages/admin/Bots.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

/* ---------------- display helpers ---------------- */
type BotDef = {
  key: BotKey;
  name: string;
  gradient: string; // tailwind gradient classes
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
function botKeyToGradient(key: BotKey) {
  return BOTS.find((b) => b.key === key)?.gradient || "from-gray-200 to-gray-100";
}
function botKeyToEmoji(key: BotKey) {
  return BOTS.find((b) => b.key === key)?.emoji || "🤖";
}

/* ---------------- main page ---------------- */

export default function Bots() {
  const nav = useNavigate();

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

  // Analytics metrics used for header stats
  const [metrics, setMetrics] = useState<Metrics>(() =>
    getJSON<Metrics>(METRICS_KEY, {
      conversations: 0,
      leads: 0,
    })
  );

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
      if (e.key === METRICS_KEY) {
        setMetrics(getJSON<Metrics>(METRICS_KEY, { conversations: 0, leads: 0 }));
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

  // safely format a title
  const safeInstanceName = (m: InstanceMeta) =>
    (m.name && String(m.name)) || `${botKeyToLabel(m.bot)} Instance`;

  // Tidy, sorted list for display
  const sortedInstances = useMemo(
    () => [...instances].sort((a, b) => b.updatedAt - a.updatedAt),
    [instances]
  );

  return (
    <div className="w-full h-full">
      {/* Header + Create / Reset buttons */}
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

      {/* Header metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value={String(sortedInstances.length)} />
        <Stat label="Conversations (7d)" value={fmtInt(metrics.conversations)} />
        <Stat label="Leads / Tickets (7d)" value={fmtInt(metrics.leads)} />
      </div>

      {/* Bot catalog (unchanged) */}
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
                aria-label={`${b.name} plan`}
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>

              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() =>
                  (window.location.href = `/admin/builder?bot=${b.key}`)
                }
                aria-label={`Open ${b.name} in Builder`}
              >
                Open Builder
              </button>
            </div>

            <div className="mt-3">
              <button
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-muted/40"
                onClick={() => {
                  const mode = modes[b.key] || "basic";
                  duplicateInstanceFromTemplate(b.key, mode, `${b.name} (Copy)`);
                  setInstances(listInstances());
                }}
                aria-label={`Duplicate ${b.name}`}
              >
                Duplicate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Bots (colorful & with Nurture button) */}
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
              const title = safeInstanceName(m);
              const sub = `${botKeyToLabel(m.bot)} • ${m.mode}`.trim();
              const grad = botKeyToGradient(m.bot);
              const emoji = botKeyToEmoji(m.bot);

              return (
                <div
                  key={m.id}
                  className="rounded-2xl border bg-card overflow-hidden flex flex-col"
                >
                  <div
                    className={`p-4 ring-1 ring-border bg-gradient-to-br ${grad}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 grid place-items-center rounded-xl bg-white/70 ring-1 ring-border text-xl">
                        {emoji}
                      </div>
                      <div>
                        <div className="text-lg font-extrabold leading-tight">
                          {title}
                        </div>
                        <div className="text-sm text-foreground/80">{sub}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() =>
                        (window.location.href = `/admin/builder?inst=${m.id}`)
                      }
                    >
                      Open
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() =>
                        (window.location.href = `/admin/nurture?inst=${m.id}`)
                      }
                      title="Open nurture schedule for this client bot"
                    >
                      Nurture
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => {
                        // simple rename prompt to restore your earlier behavior
                        const next = prompt("Rename this bot instance:", title);
                        if (!next) return;
                        // instances are stored in your instances lib; updating name via storage key
                        const idx = listInstances().find((x) => x.id === m.id);
                        if (idx) {
                          // write through the same lib that created instances
                          const rawKey = `botInstances:${m.id}`;
                          const raw = localStorage.getItem(rawKey);
                          if (raw) {
                            const parsed = JSON.parse(raw);
                            parsed.name = next;
                            localStorage.setItem(rawKey, JSON.stringify(parsed));
                            setInstances(listInstances());
                          }
                        }
                      }}
                    >
                      Rename
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
    </div>
  );
}
