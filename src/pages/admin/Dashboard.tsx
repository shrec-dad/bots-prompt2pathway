import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchMetrics } from '@/store/metricsSlice';
import { RootState } from '@/store';

/** ====== Analytics store (aligns with Analytics page) ====== */
type Metrics = {
  conversations: number;
  leads: number;
  avgResponseSecs: number;
  csatPct: number;
};

const DEFAULT_METRICS: Metrics = {
  conversations: 0,
  leads: 0,
  avgResponseSecs: 0,
  csatPct: 0,
};

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const GradStyle = {
  background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))",
  color: "var(--grad-text)"
}

/** KPI card with optional delta pill */
type KpiProps = {
  title: string;
  value: string;
  deltaPct?: number;
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
      className="cursor-pointer p-5 strong-card text-left"
      style={GradStyle}
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

      <div className="mt-4 h-10 w-20 rounded-md ring-1 ring-border flex items-center justify-center" style={GradStyle}>
        <div className="h-[2px] w-14 bg-foreground/60 rounded" />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const metricsFromStore = useSelector((state: RootState) => state.metrics.data);

  useEffect(() => {
    dispatch(fetchMetrics(''));
  }, [dispatch]);

  const [m, setM] = useState<Metrics>(DEFAULT_METRICS);

  useEffect(() => {
    if (metricsFromStore) {
      setM({ ...m, ...metricsFromStore });
    }
  }, [metricsFromStore]);

  const fmtInt = (n: number) =>
    Number.isFinite(n) ? Math.max(0, Math.round(n)).toLocaleString() : "0";
  const fmtSecs = (n: number) =>
    `${Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0}s`;
  const fmtPct = (n: number) =>
    `${Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0}%`;

  function resetTopKpis() {
    const next: Metrics = {
      ...m,
      conversations: 0,
      leads: 0,
      avgResponseSecs: 0,
      csatPct: 0,
    };
    setM(next);
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header Section */}
      <div className="p-5 strong-card">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Dashboard</h1>
            <p className="text-foreground/80">
              Welcome to your admin dashboard. Tap any card to dive deeper.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
              style={GradStyle}
              onClick={resetTopKpis}
              title="Reset Conversations, Leads, Avg. Response, and CSAT"
            >
              Reset
            </button>
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
              style={GradStyle}
              onClick={() => nav("/admin/bots?new=1")}
            >
              + Create New Bot
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <a
          onClick={() => nav("/admin/bots")}
          className="cursor-pointer p-5 strong-card"
          style={GradStyle}
        >
          <div className="text-xl font-black">🤖 Manage Bots</div>
          <div className="text-foreground/80 font-semibold">
            Add new bots or open the builder.
          </div>
        </a>

        <a
          onClick={() => nav("/admin/builder")}
          className="cursor-pointer p-5 strong-card"
          style={GradStyle}
        >
          <div className="text-xl font-black">🧩 Builder</div>
          <div className="text-foreground/80 font-semibold">
            Edit flows, messages and actions.
          </div>
        </a>

        <a
          onClick={() => nav("/admin/knowledge")}
          className="cursor-pointer p-5 strong-card"
          style={GradStyle}
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
