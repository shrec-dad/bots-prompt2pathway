// src/pages/admin/Dashboard.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Tiny sparkline stub (keeps the look you already have)
function MiniLine() {
  return (
    <div className="h-10 w-16 rounded-xl ring-1 ring-border bg-card grid place-items-center">
      <div className="h-[2px] w-10 bg-foreground/80 rounded" />
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <div
      className={[
        "text-xs font-bold px-2 py-0.5 rounded-full ring-1",
        up ? "text-emerald-700 ring-emerald-400/60 bg-emerald-200/30" : "text-rose-700 ring-rose-400/60 bg-rose-200/30",
      ].join(" ")}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
      <span className="ml-1 text-foreground/70 font-semibold">vs last week</span>
    </div>
  );
}

type KPI = {
  title: string;
  value: string;
  thisWeek: number;   // numeric for delta calc
  lastWeek: number;   // numeric for delta calc
  to: string;
};

function KPICard({ kpi }: { kpi: KPI }) {
  const nav = useNavigate();
  const delta = useMemo(() => {
    const { thisWeek, lastWeek } = kpi;
    if (lastWeek === 0) return 0;
    return ((thisWeek - lastWeek) / Math.max(1, lastWeek)) * 100;
  }, [kpi]);

  return (
    <button
      onClick={() => nav(kpi.to)}
      className="text-left rounded-2xl border bg-gradient-to-br from-indigo-200/40 via-blue-200/40 to-emerald-200/40 p-5 ring-1 ring-border hover:shadow-md transition cursor-pointer w-full"
      aria-label={`Open details for ${kpi.title}`}
    >
      <div className="text-sm font-extrabold tracking-wide">{kpi.title}</div>
      <div className="mt-2 text-3xl font-black leading-tight">{kpi.value}</div>
      <div className="mt-3 flex items-center gap-3">
        <MiniLine />
        <Delta value={delta} />
      </div>
    </button>
  );
}

export default function Dashboard() {
  // Use whatever numbers you prefer here (wired later to real analytics)
  const kpis: KPI[] = [
    {
      title: "Conversations (7d)",
      value: "1,284",
      thisWeek: 1284,
      lastWeek: 1190,
      to: "/admin/analytics",
    },
    {
      title: "Leads / Tickets (7d)",
      value: "312",
      thisWeek: 312,
      lastWeek: 330,
      to: "/admin/clients",
    },
    {
      title: "Avg. Response (sec)",
      value: "2.1s",
      thisWeek: 2.1,
      lastWeek: 2.4,
      to: "/admin/analytics",
    },
    {
      // Spelled out so it’s clear:
      title: "CSAT (Customer Satisfaction, 7d)",
      value: "94%",
      thisWeek: 94,
      lastWeek: 92,
      to: "/admin/analytics",
    },
  ];

  return (
    <div className="w-full h-full">
      <div className="rounded-2xl border bg-card p-5 mb-6">
        <div className="text-2xl font-extrabold">Dashboard</div>
        <p className="text-foreground/80 mt-1">
          Welcome to your admin dashboard. Tap any card to dive deeper.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <KPICard key={k.title} kpi={k} />
        ))}
      </div>
    </div>
  );
}
