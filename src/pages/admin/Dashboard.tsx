// src/pages/admin/Dashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

/** Small helpers */
function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
const Grad = "bg-gradient-to-br from-indigo-200/60 via-blue-200/55 to-emerald-200/55";

/** KPI card with drill-down + delta */
type KpiProps = {
  title: string;
  value: string;
  deltaPct?: number; // positive = up (good), negative = down
  onClick?: () => void;
};
function KpiCard({ title, value, deltaPct = 0, onClick }: KpiProps) {
  const up = deltaPct >= 0;
  const badge = Math.abs(deltaPct).toFixed(1) + "% vs last week";

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

      {/* tiny spark box */}
      <div className="mt-4 h-10 w-20 rounded-md bg-white/65 ring-1 ring-border flex items-center justify-center">
        <div className="h-[2px] w-14 bg-foreground/60 rounded" />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const nav = useNavigate();

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
        <button
          className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
          onClick={() => nav("/admin/bots?new=1")}
        >
          + Create New Bot
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Conversations (7d)"
          value="1,284"
          deltaPct={7.9}
          onClick={() => nav("/admin/analytics#conversations")}
        />
        <KpiCard
          title="Leads / Tickets (7d)"
          value="312"
          deltaPct={-5.5}
          onClick={() => nav("/admin/analytics#leads")}
        />
        <KpiCard
          title="Avg. Response (sec)"
          value="2.1s"
          deltaPct={-12.5} // lower is better, still show down arrow to indicate change
          onClick={() => nav("/admin/analytics#response")}
        />
        <KpiCard
          title="CSAT (Customer Satisfaction, 7d)"
          value="94%"
          deltaPct={2.2}
          onClick={() => nav("/admin/analytics#csat")}
        />
      </div>

      {/* Quick links (keeps the page feeling full like your earlier layout) */}
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
