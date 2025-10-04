// src/pages/admin/Dashboard.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON, setJSON } from "@/lib/storage";

/** ====== Analytics store (aligns with Analytics page) ====== */
type Metrics = {
  conversations: number;
  leads: number;
  avgResponseSecs: number; // seconds
  csatPct: number;         // 0–100
  // Other metrics can exist here; we ignore them on this page.
};

const METRICS_KEY = "analytics:metrics";

const DEFAULT_METRICS: Metrics = {
  conversations: 0,
  leads: 0,
  avgResponseSecs: 0,
  csatPct: 0,
};

/** Small helpers */
function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
const Grad =
  "bg-gradient-to-br from-indigo-200/60 via-blue-200/55 to-emerald-200/55";

/** KPI card with optional delta pill */
type KpiProps = {
  title: string;
  value: string;
  deltaPct?: number; // if undefined => hide the delta chip
  onClick?: () => void;
};
function KpiCard({ title, value, deltaPct, onClick }: KpiProps) {
  const up = (deltaPct ?? 0) >= 0;
  const badge =
    deltaPct !== undefined
      ? `${Math.abs(deltaPct).toFixed(1)}% vs last week`
      : "";

  return (
    <button
      onClick={onClick}
      className={classNames(
        "w-full text-left rounded-2xl border shadow-sm transition hover:shadow-md",
        "ring-1 ring-border px-5 py-5",
        Grad
      )}
    >
      <div className="text-sm font-extrabold tracking-wide text-foreground/80">
        {title}
      </div>
      <div className="mt-2 text-[34px] leading-none font-black">{value}</div>

      {deltaPct !== undefined && (
        <div
          className={classNames(
            "mt-4 inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-border",
            up
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-rose-500/10 text-rose-700"
          )}
        >
          <span>{up ? "▲" : "▼"}</span>
          <span>{badge}</span>
        </div>
      )}

      {/* tiny spark box */}
      <div className="mt-4 h-10 w-20 rounded-md bg-white/65 ring-1 ring-border flex items-center justify-center">
        <div className="h-[2px] w-14 bg-foreground/60 rounded" />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const nav = useNavigate();

  // Load metrics from storage (or defaults)
  const [m, setM] = useState<Metrics>(() =>
    getJSON<Metrics>(METRICS_KEY, DEFAULT_METRICS)
  );

  // Format helpers
  const fmtInt = (n: number) =>
    Number.isFinite(n) ? Math.max(0, Math.round(n)).toLocaleString() : "0";
  const fmtSecs = (n: number) =>
    `${Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0}s`;
  const fmtPct = (n: number) =>
    `${Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0}%`;

  // Reset ONLY the four KPIs requested
  function resetTopKpis() {
    const next: Metrics = {
      ...m,
      conversations: 0,
      leads: 0,
      avgResponseSecs: 0,
      csatPct: 0,
    };
    setM(next);
    setJSON(METRICS_KEY, next);
  }

  return (
    <div className="space-y-6">
      {/* title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="text-foreground/80">
            Welcome to your admin dashboard. Tap any card to dive deeper.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30"
            onClick={resetTopKpis}
            title="Reset Conversations, Leads, Avg. Response, and CSAT"
          >
            Reset
          </button>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            onClick={() => nav("/admin/bots?new=1")}
          >
            + Create New Bot
          </button>
        </div>
      </div>

      {/* KPIs (no demo stats; shows stored values) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Conversations (7d)"
          value={fmtInt(m.conversations)}
          onClick={() => nav("/admin/analytics#conversations")}
        />
        <KpiCard
          title="Leads / Tickets (7d)"
          value={fmtInt(m.leads)}
          onClick={() => nav("/admin/analytics#leads")}
        />
        <KpiCard
          title="Avg. Response (sec)"
          value={fmtSecs(m.avgResponseSecs)}
          onClick={() => nav("/admin/analytics#response")}
        />
        <KpiCard
          title="CSAT (Customer Satisfaction, 7d)"
          value={fmtPct(m.csatPct)}
          onClick={() => nav("/admin/analytics#csat")}
        />
      </div>

      {/* Quick links (unchanged) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <a
          onClick={() => nav("/admin/bots")}
          className={classNames(
            "cursor-pointer rounded-2xl border p-5 ring-1 ring-border hover:shadow-md transition",
            Grad
          )}
        >
          <div className="text-xl font-black">🤖 Manage Bots</div>
          <div className="text-foreground/80 font-semibold">
            Add new bots or open the builder.
          </div>
        </a>

        <a
          onClick={() => nav("/admin/builder")}
          className={classNames(
            "cursor-pointer rounded-2xl border p-5 ring-1 ring-border hover:shadow-md transition",
            Grad
          )}
        >
          <div className="text-xl font-black">🧩 Builder</div>
          <div className="text-foreground/80 font-semibold">
            Edit flows, messages and actions.
          </div>
        </a>

        <a
          onClick={() => nav("/admin/knowledge")}
          className={classNames(
            "cursor-pointer rounded-2xl border p-5 ring-1 ring-border hover:shadow-md transition",
            Grad
          )}
        >
          <div className="text-xl font-black">📚 Knowledge</div>
          <div className="text-foreground/80 font-semibold">
            Train the assistant with answers and docs.
          </div>
        </a>
      </div>
    </div>
  );
}
