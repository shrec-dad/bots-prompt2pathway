import React, { useEffect, useMemo, useState } from "react";
import BotSelector from "@/components/BotSelector";

/** ------------------------------------------------------------
 * Local storage helpers (self-contained)
 * ------------------------------------------------------------ */
const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
};
const writeJSON = (key: string, value: any) =>
  localStorage.setItem(key, JSON.stringify(value));

/** ------------------------------------------------------------
 * XLSX (SheetJS) loader — on-demand via CDN (no npm install)
 * ------------------------------------------------------------ */
declare global {
  interface Window {
    XLSX: any;
  }
}
async function ensureXLSX(): Promise<any> {
  if (window.XLSX) return window.XLSX;
  await new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Failed to load XLSX library"));
    document.head.appendChild(el);
  });
  return window.XLSX;
}

/** ------------------------------------------------------------
 * Storage keys and metric types
 * ------------------------------------------------------------ */
const AKEY = "analytics.metrics.v2";
const EKEY = "analytics.events.v1";

type Metrics = {
  // core six
  conversations: number;
  leads: number;
  appointments: number;
  csatPct: number;         // 0–100
  avgResponseSecs: number; // seconds
  conversionPct: number;   // 0–100

  // pro five
  dropoffPct: number;          // 0–100
  qualifiedLeads: number;      // count
  avgConversationSecs: number; // seconds
  handoffRatePct: number;      // 0–100
  peakChatTime: string;        // e.g., "2–3 PM"
};

const defaultMetrics: Metrics = {
  conversations: 0,
  leads: 0,
  appointments: 0,
  csatPct: 0,
  avgResponseSecs: 0,
  conversionPct: 0,

  dropoffPct: 0,
  qualifiedLeads: 0,
  avgConversationSecs: 0,
  handoffRatePct: 0,
  peakChatTime: "—",
};

/** ------------------------------------------------------------
 * Events (as written by Preview/Widget tracking)
 * ------------------------------------------------------------ */
type Scope =
  | { kind: "inst"; id: string }
  | { kind: "bot"; key: string };

type EventRecord = {
  ts: number;                 // epoch ms
  name: string;               // e.g., "bubble_open", "lead_submit", ...
  scope: Scope;               // { kind: "inst", id } preferred for per-instance
  props?: Record<string, any>;// arbitrary
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** ------------------------------------------------------------
 * Per-instance recompute from event log
 * ------------------------------------------------------------ */
function recomputeInstanceMetrics(events: EventRecord[], instId: string): Metrics {
  const m: Metrics = { ...defaultMetrics };

  // Session tracking (simple): one active start per instance in this admin preview flow.
  let activeStart: number | null = null;
  let sessions = 0;
  let completedSessions = 0;
  let dropoffs = 0;

  // Derived tallies
  let csatSumPct = 0; // sum of csat as percentage (score/5*100)
  let csatCount = 0;

  let latencySumSecs = 0; // from props.latencyMs or reply_latency_ms
  let latencyCount = 0;

  let handoffs = 0;

  const hourCounts: Record<string, number> = {}; // for peakChatTime (by session end hour)

  const forInst = events.filter(
    (e) => e.scope?.kind === "inst" && e.scope.id === instId
  );
  const sorted = forInst.sort((a, b) => a.ts - b.ts);

  const touchHour = (t: number) => {
    const hr = new Date(t).getHours().toString().padStart(2, "0");
    hourCounts[hr] = (hourCounts[hr] || 0) + 1;
  };

  const endSession = (endTs: number, dropped: boolean) => {
    if (activeStart == null) return;
    const secs = Math.max(0, Math.round((endTs - activeStart) / 1000));
    m.avgConversationSecs = round1(
      (m.avgConversationSecs * completedSessions + secs) / (completedSessions + 1)
    );
    completedSessions += 1;
    if (dropped) dropoffs += 1;
    touchHour(endTs);
    activeStart = null;
  };

  for (const e of sorted) {
    switch (e.name) {
      case "bubble_open": {
        // new conversation starts when bubble opens (if not already active)
        if (activeStart == null) {
          activeStart = e.ts;
          sessions += 1;
          m.conversations += 1;
        }
        break;
      }

      case "lead_submit": {
        // counts as a conversion and ends a session
        m.leads += 1;
        endSession(e.ts, false);
        break;
      }

      case "appointment_booked":
      case "calendar_created": {
        // support either event name
        m.appointments += 1;
        // booking also ends a session as a success
        endSession(e.ts, false);
        break;
      }

      case "csat_submit": {
        // expect props.score in 1..5 (fallback guards)
        const raw = Number(e.props?.score ?? 0);
        if (raw > 0) {
          const pct = Math.max(0, Math.min(100, (raw / 5) * 100));
          csatSumPct += pct;
          csatCount += 1;
        }
        break;
      }

      case "bot_response":
      case "assistant_response":
      case "reply_latency": {
        // collect response latency — prefer latencyMs, fallback reply_latency_ms
        const ms =
          Number(e.props?.latencyMs ?? e.props?.reply_latency_ms ?? NaN);
        if (!Number.isNaN(ms) && ms >= 0) {
          latencySumSecs += ms / 1000;
          latencyCount += 1;
        }
        break;
      }

      case "handoff_to_human":
      case "agent_handoff": {
        handoffs += 1;
        break;
      }

      case "lead_qualified": {
        m.qualifiedLeads += 1;
        break;
      }

      case "close_widget": {
        // treat as a session end only if active (counts as drop-off)
        endSession(e.ts, true);
        break;
      }

      default:
        // ignore other design-tuning events (color/size/position etc.)
        break;
    }
  }

  // Derived/ratios
  if (csatCount > 0) m.csatPct = round1(csatSumPct / csatCount);
  if (latencyCount > 0) m.avgResponseSecs = round1(latencySumSecs / latencyCount);
  if (m.conversations > 0) {
    m.conversionPct = round1((m.leads / m.conversations) * 100);
    m.dropoffPct = round1((dropoffs / m.conversations) * 100);
    m.handoffRatePct = round1((handoffs / m.conversations) * 100);
  }

  // Peak hour label
  let bestKey = "";
  let bestVal = -1;
  for (const [k, v] of Object.entries(hourCounts)) {
    if (v > bestVal) {
      bestKey = k;
      bestVal = v;
    }
  }
  if (bestKey) {
    const h = parseInt(bestKey, 10);
    const fmt = (H: number) =>
      new Date(2000, 0, 1, H).toLocaleTimeString([], { hour: "numeric" });
    m.peakChatTime = `${fmt(h)}–${fmt((h + 1) % 24)}`;
  } else {
    m.peakChatTime = "—";
  }

  return m;
}

/** ------------------------------------------------------------
 * Small UI helpers
 * ------------------------------------------------------------ */
const sectionCls =
  "rounded-2xl border-2 border-black bg-gradient-to-r from-violet-100 via-sky-100 to-emerald-100 p-4 md:p-5";

const Card = ({
  title,
  value,
}: {
  title: React.ReactNode;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl border-2 border-black bg-white p-4 md:p-3 shadow-sm">
    <div className="text-base md:text-sm font-extrabold leading-tight">{title}</div>
    <div className="mt-1.5 text-3xl md:text-2xl font-black">{value}</div>
  </div>
);

/** Simple timestamp for filenames: 2025-10-03_142355 */
function timeStamp() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** ------------------------------------------------------------
 * Component
 * ------------------------------------------------------------ */
export default function Analytics() {
  // Instance filter: "" = All (global)
  const [instId, setInstId] = useState<string>("");

  // Keep page reactive if other tabs write events/metrics
  const [, forceTick] = useState(0);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === EKEY || e.key === AKEY) {
        forceTick((x) => x + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Source of truth based on scope
  const metrics = useMemo<Metrics>(() => {
    if (!instId) {
      // Global saved rollup
      return readJSON<Metrics>(AKEY, defaultMetrics);
    }
    // Per-instance: recompute from event log
    const evts = readJSON<EventRecord[]>(EKEY, []);
    return recomputeInstanceMetrics(evts, instId);
  }, [instId, forceTick]);

  const [exporting, setExporting] = useState(false);

  /** Save current metrics (only allowed for global view) */
  const save = () => {
    if (instId) return; // no-op when scoped
    writeJSON(AKEY, metrics);
    alert("Analytics saved.");
  };

  /** Reset to zeros/placeholders (only allowed for global view) */
  const reset = () => {
    if (instId) return; // no-op when scoped
    if (!confirm("Reset all analytics to defaults?")) return;
    writeJSON(AKEY, { ...defaultMetrics });
    alert("Analytics reset.");
  };

  /** Export a true .xlsx workbook using SheetJS (loaded on demand) */
  const exportXLSX = async () => {
    try {
      setExporting(true);
      const XLSX = await ensureXLSX();

      const rows: Array<[string, string | number]> = [
        ["Metric", "Value"],
        ["Scope", instId ? `Instance ${instId}` : "All (Global)"],
        ["Conversations", metrics.conversations],
        ["Leads Captured", metrics.leads],
        ["Appointments Booked", metrics.appointments],
        ["CSAT (Customer Satisfaction Score) %", `${metrics.csatPct}`],
        ["Avg Response Time (secs)", `${metrics.avgResponseSecs}`],
        ["Conversion Rate %", `${metrics.conversionPct}`],
        ["Drop-off Rate %", `${metrics.dropoffPct}`],
        ["Qualified Leads", metrics.qualifiedLeads],
        ["Avg Conversation Length (secs)", `${metrics.avgConversationSecs}`],
        ["Sales Handoff Rate %", `${metrics.handoffRatePct}`],
        ["Peak Chat Time", metrics.peakChatTime || "—"],
        ["Exported At", new Date().toISOString()],
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Analytics");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `analytics-${instId ? `inst-${instId}-` : ""}${timeStamp()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Export failed. If this persists, your network may block CDN script loads.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="p-5 md:p-6 rounded-2xl border-2 border-purple-200 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg,#ffeef8 0%,#f3e7fc 25%,#e7f0ff 50%,#e7fcf7 75%,#fff9e7 100%)",
      }}
    >
      {/* Header + Instance filter */}
      <div className="rounded-2xl border-2 border-black bg-white p-4 md:p-5 shadow mb-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold">Analytics</div>
            <div className="text-foreground/80 mt-1">
              Track performance, usage, and engagement metrics.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-bold uppercase text-purple-700">Instance Filter</div>
            <div className="min-w-[260px]">
              <BotSelector
                scope="instance"
                value={instId}
                onChange={setInstId}
                placeholderOption="All (Global)"
              />
            </div>
          </div>
        </div>

        {instId ? (
          <div className="mt-3 text-[12px] font-semibold text-black/70">
            Showing metrics for instance <span className="font-extrabold">{instId}</span>.{" "}
            <span className="opacity-80">(Save/Reset disabled in scoped view)</span>
          </div>
        ) : (
          <div className="mt-3 text-[12px] font-semibold text-black/70">
            Showing <span className="font-extrabold">All (Global)</span> metrics.
          </div>
        )}

        {/* Export / Save / Reset controls */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={exportXLSX}
            className="rounded-xl px-3.5 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40 disabled:opacity-60"
            title="Download as Excel (.xlsx)"
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export XLSX"}
          </button>
          <button
            onClick={save}
            className="rounded-xl px-3.5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px] disabled:opacity-60"
            title={instId ? "Disabled in scoped view" : "Save metrics to your browser"}
            disabled={!!instId}
          >
            Save
          </button>
          <button
            onClick={reset}
            className="rounded-xl px-3.5 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40 disabled:opacity-60"
            title={instId ? "Disabled in scoped view" : "Reset all metrics"}
            disabled={!!instId}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Metric Cards (scoped or global based on filter) */}
      <div className={sectionCls}>
        <div className="text-xl md:text-2xl font-extrabold mb-3">Metrics</div>

        {/* Core six */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card title="Conversations" value={metrics.conversations} />
          <Card title="Leads Captured" value={metrics.leads} />
          <Card title="Appointments Booked" value={metrics.appointments} />

          <Card title="CSAT (Customer Satisfaction Score)" value={`${metrics.csatPct}%`} />
          <Card title="Avg Response Time" value={`${metrics.avgResponseSecs}s`} />
          <Card title="Conversion Rate" value={`${metrics.conversionPct}%`} />
        </div>

        {/* Pro five */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Card title="Drop-off Rate" value={`${metrics.dropoffPct}%`} />
          <Card title="Qualified Leads" value={metrics.qualifiedLeads} />
          <Card title="Avg Conversation Length" value={`${metrics.avgConversationSecs}s`} />

          <Card title="Sales Handoff Rate" value={`${metrics.handoffRatePct}%`} />
          <Card title="Peak Chat Time" value={metrics.peakChatTime || "—"} />
          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  );
}
