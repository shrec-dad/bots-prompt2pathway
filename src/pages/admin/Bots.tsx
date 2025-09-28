// src/pages/admin/Bots.tsx
import React, { useEffect, useState } from "react";
import { getBotSettings, setBotSettings, BotKey } from "@/lib/botSettings";

type BotDef = {
  key: BotKey;
  name: string;
  gradient: string; // tailwind gradient classes
  emoji: string;
  description: string;
};

const BOTS: BotDef[] = [
  { key: "LeadQualifier", name: "Lead Qualifier", emoji: "🎯",
    gradient: "from-purple-500/20 via-fuchsia-400/20 to-pink-500/20",
    description: "Qualify leads with scoring, validation and routing. Best for sales intake." },
  { key: "AppointmentBooking", name: "Appointment Booking", emoji: "📅",
    gradient: "from-emerald-500/20 via-teal-400/20 to-cyan-500/20",
    description: "Offer services, show availability, confirm and remind automatically." },
  { key: "CustomerSupport", name: "Customer Support", emoji: "🛟",
    gradient: "from-indigo-500/20 via-blue-400/20 to-sky-500/20",
    description: "Answer FAQs, create tickets, route priority issues and hand off to humans." },
  { key: "Waitlist", name: "Waitlist", emoji: "⏳",
    gradient: "from-amber-500/25 via-orange-400/20 to-rose-500/20",
    description: "Collect interest, show queue status and notify customers automatically." },
  { key: "SocialMedia", name: "Social Media", emoji: "📣",
    gradient: "from-pink-500/20 via-rose-400/20 to-red-500/20",
    description: "Auto-DM replies, comment handling, and engagement prompts across platforms." },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">{label}</div>
      <div className="text-xl font-extrabold leading-tight">{value}</div>
    </div>
  );
}

export default function Bots() {
  // local view state for all card selects
  const [modes, setModes] = useState<Record<BotKey, "basic" | "custom">>(() =>
    Object.fromEntries(BOTS.map(b => [b.key, getBotSettings(b.key).mode])) as Record<
      BotKey,
      "basic" | "custom"
    >
  );

  useEffect(() => {
    // keep in sync if storage changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith("botSettings:")) return;
      const key = e.key.split(":")[1] as BotKey;
      setModes(prev => ({ ...prev, [key]: getBotSettings(key).mode }));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="w-full h-full">
      {/* Header + Create button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-extrabold">Bots</div>
        <button
          className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
          onClick={() => (window.location.href = "/admin/builder?new=1")}
        >
          + Create New Bot
        </button>
      </div>

      {/* Header metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value="5" />
        <Stat label="Conversations (7d)" value="1,284" />
        <Stat label="Leads / Tickets (7d)" value="312" />
      </div>

      {/* Bot catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {BOTS.map((b) => (
          <div key={b.key} className="rounded-2xl border bg-card p-5 hover:shadow-md transition group">
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

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground/80">Plan:</div>
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
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => (window.location.href = `/admin/builder?bot=${b.key}`)}
                aria-label={`Open ${b.name} in Builder`}
              >
                Open Builder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
