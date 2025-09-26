// src/pages/admin/Bots.tsx
import React, { useEffect, useMemo, useState } from "react";

type BotDef = {
  key: string;
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
    description:
      "Collect interest, show queue status and notify customers automatically.",
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

/** ---------- Small, safe enhancement: per-bot plan selector ---------- */

type Plan = "basic" | "custom";
type PlansState = Record<string, Plan>;
const STORAGE_KEY = "botPlans";

function PlanSelector({
  value,
  onChange,
}: {
  value: Plan;
  onChange: (p: Plan) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-foreground/80">Plan:</span>
      <div className="flex gap-2">
        <button
          className={`rounded-lg px-3 py-1 text-sm font-bold ring-1 ring-border ${
            value === "basic"
              ? "bg-gradient-to-r from-indigo-500/20 to-emerald-500/20"
              : "bg-card hover:bg-muted/60"
          }`}
          onClick={() => onChange("basic")}
          aria-label="Select Basic plan"
        >
          Basic
        </button>
        <button
          className={`rounded-lg px-3 py-1 text-sm font-bold ring-1 ring-border ${
            value === "custom"
              ? "bg-gradient-to-r from-indigo-500/20 to-emerald-500/20"
              : "bg-card hover:bg-muted/60"
          }`}
          onClick={() => onChange("custom")}
          aria-label="Select Custom plan"
        >
          Custom
        </button>
      </div>
    </div>
  );
}

function Bots() {
  // load saved plans (defaults to "basic" for all cards)
  const defaultPlans = useMemo<PlansState>(() => {
    const base: PlansState = {};
    BOTS.forEach((b) => (base[b.key] = "basic"));
    return base;
  }, []);

  const [plans, setPlans] = useState<PlansState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultPlans, ...JSON.parse(raw) } : defaultPlans;
    } catch {
      return defaultPlans;
    }
  });

  // persist plans whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch {
      /* ignore */
    }
  }, [plans]);

  const setPlan = (key: string, plan: Plan) =>
    setPlans((prev) => ({ ...prev, [key]: plan }));

  return (
    <div className="w-full h-full">
      {/* Header metrics row (unchanged) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value="5" />
        <Stat label="Conversations (7d)" value="1,284" />
        <Stat label="Leads / Tickets (7d)" value="312" />
      </div>

      {/* Bot catalog (emojis, gradients, layout preserved) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {BOTS.map((b) => (
          <div
            key={b.key}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition group"
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

            <div className="mt-4 flex items-center justify-between gap-3">
              {/* Replaces the static 'Plan: Basic / Custom' with a tiny selector */}
              <PlanSelector
                value={plans[b.key] ?? "basic"}
                onChange={(p) => setPlan(b.key, p)}
              />

              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => (window.location.href = "/admin/builder")}
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

export default Bots;
