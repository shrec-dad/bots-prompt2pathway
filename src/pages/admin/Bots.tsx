// src/pages/admin/Bots.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getBotSettings, setBotSettings } from "@/lib/botSettings";
import {
  listInstances,
  removeInstance,
  duplicateInstanceFromTemplate,
  createInstance,
  renameInstance,
  type InstanceMeta,
} from "@/lib/instances";
import { getJSON, setJSON } from "@/lib/storage";
import { listTemplateDefs, createTemplate } from "@/lib/templates";

/* ---------- shared analytics store ---------- */
type Metrics = {
  conversations: number;
  leads: number;
  avgResponseSecs?: number;
  csatPct?: number;
};
const METRICS_KEY = "analytics:metrics";

/* ---------------- display helpers ---------------- */
type BotKey = string;

function botKeyToLabel(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.name || (key as string);
}
function botKeyToGradient(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.gradient || "from-gray-200 to-gray-100";
}
function botKeyToEmoji(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.emoji || "🤖";
}

/* ---------------- main page ---------------- */

export default function Bots() {
  // Dynamic template catalog
  const [defs, setDefs] = useState(() => listTemplateDefs());

  // Plan mode per template key
  const [modes, setModes] = useState<Record<string, "basic" | "custom">>(() =>
    Object.fromEntries(defs.map((b) => [b.key, getBotSettings(b.key).mode || "basic"])) as Record<
      string,
      "basic" | "custom"
    >
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
      if (e.key === "botTemplates:index") {
        setDefs(listTemplateDefs());
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
    (m.name && String(m.name)) || `${botKeyToLabel(defs, m.bot)} Instance`;

  // Tidy, sorted list for display
  const sortedInstances = useMemo(
    () => [...instances].sort((a, b) => b.updatedAt - a.updatedAt),
    [instances]
  );

  // Utility: simple slug/key from a name
  const toKey = (name: string) =>
    name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

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
              const name = prompt("Name your new bot template:", "New Template")?.trim();
              if (!name) return;
              const key = toKey(name);
              // prevent duplicate
              if (defs.some((d) => d.key === key)) {
                alert("A template with this name/key already exists. Please choose a different name.");
                return;
              }
              createTemplate({ name, key });
              setDefs(listTemplateDefs()); // refresh list in-place
              // Stay on Bots page; the new card will appear below
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

      {/* Template catalog (dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {defs.map((b) => (
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
                value={modes[b.key] || "basic"}
                onChange={(e) => {
                  const mode = e.target.value as "basic" | "custom";
                  setModes((prev) => ({ ...prev, [b.key]: mode }));
                  setBotSettings(b.key as any, { mode });
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
                  const mode = (modes[b.key] || "basic") as "basic" | "custom";
                  const defaultName = `${b.name} (Copy)`;
                  const desired =
                    prompt("Name this new client bot:", defaultName)?.trim() ||
                    defaultName;

                  duplicateInstanceFromTemplate(b.key as any, mode, desired);
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
              const sub = `${botKeyToLabel(defs, m.bot)} • ${m.mode}`.trim();
              const grad = botKeyToGradient(defs, m.bot);
              const emoji = botKeyToEmoji(defs, m.bot);

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
                        const next = prompt("Rename this bot instance:", title)?.trim();
                        if (!next) return;
                        renameInstance(m.id, next);
                        setInstances(listInstances());
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

/* ---------- Small Stat component (unchanged) ---------- */
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
