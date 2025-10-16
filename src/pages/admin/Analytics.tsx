// src/pages/admin/Analytics.tsx
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
const GLOBAL_KEY = "analytics.metrics.v2";
const INST_KEY = (instId: string) => `analytics.metrics:inst:${instId}`;

/** Optional event log (if Preview.tsx is emitting events) */
const EVENTS_KEY = "analytics.events.v1";

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
 * Event types (when available) for recomputation fallback
 * ------------------------------------------------------------ */
type AnyEvent = {
  type: string;
  ts: number; // epoch ms
  scope?: { kind: "global" | "inst"; id?: string };
  meta?: Record<string, any>;
};

/** Recompute per-instance metrics from event log if no rollup is present */
function recomputeInstanceMetrics(instId: string): Metrics {
  const events = readJSON<AnyEvent[]>(EVENTS_KEY, []);
  if (!events.length) return { ...defaultMetrics };

  // Filter by scope id (defensive: scope may be undefined)
  const scoped = events.filter(
    (e) => e?.scope?.kind === "inst" && e?.scope?.id === instId
  );

  // Simple heuristic counters; extend as your event schema grows
  let conversations = 0;
  let leads = 0;
  let appointments = 0;
  let qualifiedLeads = 0;
  let drops = 0;
  let handoffs = 0;

  // Response/conversation timing placeholders
  let responseTimes: number[] = [];
  let convoDurations: number[] = [];

  // Peak hour histogram
  const hours: Record<number, number> = {};

  for (const e of scoped) {
    const hour = new Date(e.ts).getHours();
    hours[hour] = (hours[hour] || 0) + 1;

    switch (e.type) {
      case "preview_modal_opened":
      case "widget.conversation_started":
        conversations += 1;
        break;
      case "widget.lead_captured":
      case "preview.lead_captured":
        leads += 1;
        if (e.meta?.qualified) qualifiedLeads += 1;
        break;
      case "widget.appointment_booked":
        appointments += 1;
        break;
      case "widget.handoff_to_human":
        handoffs += 1;
        break;
      case "widget.dropoff":
        drops += 1;
        break;
      case "widget.response_time":
        if (typeof e.meta?.secs === "number") responseTimes.push(e.meta.secs);
        break;
      case "widget.conversation_length":
        if (typeof e.meta?.secs === "number") convoDurations.push(e.meta.secs);
        break;
      default:
        break;
    }
  }

  const avg = (nums: number[]) =>
    nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;

  const totalTouches = conversations || 1; // avoid div by 0
  const conversionPct = Math.round(((leads || appointments) / totalTouches) * 1000) / 10;
  const dropoffPct = Math.round((drops / totalTouches) * 1000) / 10;
  const handoffRatePct = Math.round((handoffs / totalTouches) * 1000) / 10;

  // CSAT placeholder: if you emit csat events, compute true avg; else keep as 0
  const csatPct = 0;

  // Peak hour -> friendly range like "14–15"
  let peakChatTime = "—";
  const topHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
  if (topHour) {
    const h = Number(topHour[0]);
    const pad = (n: number) => String(n).padStart(2, "0");
    peakChatTime = `${pad(h)}–${pad((h + 1) % 24)}`;
  }

  return {
    conversations,
    leads,
    appointments,
    csatPct,
    avgResponseSecs: avg(responseTimes),
    conversionPct,

    dropoffPct,
    qualifiedLeads,
    avgConversationSecs: avg(convoDurations),
    handoffRatePct,
    peakChatTime,
  };
}

/** ------------------------------------------------------------
 * Small UI helpers - UPDATED WITH BOLD STYLING
 * ------------------------------------------------------------ */
const sectionCls =
  "rounded-2xl border-[3px] border-black/80 shadow-[0_4px_0_rgba(0,0,0,0.8)] bg-gradient-to-r from-violet-100 via-sky-100 to-emerald-100 p-4 md:p-5";

const Card = ({
  title,
  value,
}: {
  title: React.ReactNode;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl border-[3px] border-black/80 shadow-[0_3px_0_rgba(0,0,0,0.8)] bg-white p-4 md:p-3">
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

/** Normalize a possibly-object value from BotSelector into a string id */
function normalizeInstId(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "id" in (val as any)) {
    const id = (val as any).id;
    return typeof id === "string" ? id : String(id ?? "");
  }
  return "";
}

/** Safe text for UI: never render an object by accident */
function asSafeText(val: unknown): string {
  if (val == null) return "";
  return typeof val === "string" ? val : JSON.stringify(val);
}

/** ------------------------------------------------------------
 * Component
 * ------------------------------------------------------------ */
export default function Analytics() {
  // Selection (instance filter)
  const [instId, setInstId] = useState<string>(""); // empty => global

  // Metrics (global or per-instance)
  const initial = useMemo(() => readJSON<Metrics>(GLOBAL_KEY, defaultMetrics), []);
  const [m, setM] = useState<Metrics>(initial);
  const [exporting, setExporting] = useState(false);

  /** Load metrics based on current selection */
  const loadMetrics = (id: string) => {
    if (!id) {
      // Global rollup
      const g = readJSON<Metrics>(GLOBAL_KEY, defaultMetrics);
      setM(g);
      return;
    }
    // Per-instance: try stored rollup, else recompute from events
    const stored = readJSON<Metrics>(INST_KEY(id), null as any);
    if (stored && typeof stored === "object") {
      setM(stored);
    } else {
      const recomputed = recomputeInstanceMetrics(id);
      setM(recomputed);
    }
  };

  useEffect(() => {
    loadMetrics(instId);
    // also react to changes saved in other tabs
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === GLOBAL_KEY || e.key === EVENTS_KEY || (instId && e.key === INST_KEY(instId))) {
        loadMetrics(instId);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [instId]);

  /** Save current metrics to whichever scope is active */
  const save = () => {
    if (!instId) {
      writeJSON(GLOBAL_KEY, m);
    } else {
      writeJSON(INST_KEY(instId), m);
    }
    alert("Analytics saved.");
  };

  /** Reset current scope to zeros/placeholders */
  const reset = () => {
    if (!confirm("Reset analytics for the current scope?")) return;
    if (!instId) {
      writeJSON(GLOBAL_KEY, { ...defaultMetrics });
    } else {
      writeJSON(INST_KEY(instId), { ...defaultMetrics });
    }
    setM({ ...defaultMetrics });
  };

  /** Export a true .xlsx workbook using SheetJS (loaded on demand) */
  const exportXLSX = async () => {
    try {
      setExporting(true);
      const XLSX = await ensureXLSX();

      const scopeLabel = instId ? `Instance ${instId}` : "Global";

      const rows: Array<[string, string | number]> = [
        ["Scope", scopeLabel],
        ["Metric", "Value"],
        ["Conversations", m.conversations],
        ["Leads Captured", m.leads],
        ["Appointments Booked", m.appointments],
        ["CSAT (Customer Satisfaction Score) %", `${m.csatPct}`],
        ["Avg Response Time (secs)", `${m.avgResponseSecs}`],
        ["Conversion Rate %", `${m.conversionPct}`],
        ["Drop-off Rate %", `${m.dropoffPct}`],
        ["Qualified Leads", m.qualifiedLeads],
        ["Avg Conversation Length (secs)", `${m.avgConversationSecs}`],
        ["Sales Handoff Rate %", `${m.handoffRatePct}`],
        ["Peak Chat Time", m.peakChatTime || "—"],
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
    <div className="p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border-[3px] border-black/80 shadow-[0_6px_0_rgba(0,0,0,0.8)] bg-white p-4 md:p-5">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Analytics</h1>
            <p className="text-foreground/80 mt-1">
              Track performance, usage, and engagement metrics.
            </p>
          </div>

          {/* Scope Picker */}
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">Scope:</div>
            <div className="min-w-[260px] flex items-center gap-2">
              <BotSelector
                scope="instance"
                value={instId}
                onChange={(val) => {
                  // Defensive: BotSelector might pass a string or an object
                  const normalized = normalizeInstId(val);
                  setInstId(normalized);
                }}
                placeholderOption="All (Global)"
              />
              {/* Clear Instance button */}
              <button
                type="button"
                onClick={() => setInstId("")}
                className="rounded-md border px-2.5 py-1.5 text-sm font-semibold bg-white hover:bg-muted/40"
                title="Clear selected instance (view Global)"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border-[3px] border-black/80 shadow-[0_4px_0_rgba(0,0,0,0.8)] bg-white p-4">
        <div className="flex items-center gap-2">
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
            className="rounded-xl px-3.5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
            title="Save metrics to this scope"
          >
            Save
          </button>
          <button
            onClick={reset}
            className="rounded-xl px-3.5 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
            title="Reset this scope"
          >
            Reset
          </button>

          <div className="ml-auto text-xs font-semibold text-foreground/70">
            Viewing: {instId ? `Instance ${asSafeText(instId)}` : "All (Global)"}
          </div>
        </div>
      </div>

      {/* Metric Cards (display-only) */}
      <div className={sectionCls}>
        <div className="text-xl md:text-2xl font-extrabold mb-3">Metrics</div>

        {/* Core six */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card title="Conversations" value={m.conversations} />
          <Card title="Leads Captured" value={m.leads} />
          <Card title="Appointments Booked" value={m.appointments} />

          <Card title="CSAT (Customer Satisfaction Score)" value={`${m.csatPct}%`} />
          <Card title="Avg Response Time" value={`${m.avgResponseSecs}s`} />
          <Card title="Conversion Rate" value={`${m.conversionPct}%`} />
        </div>

        {/* Pro five */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Card title="Drop-off Rate" value={`${m.dropoffPct}%`} />
          <Card title="Qualified Leads" value={m.qualifiedLeads} />
          <Card title="Avg Conversation Length" value={`${m.avgConversationSecs}s`} />

          <Card title="Sales Handoff Rate" value={`${m.handoffRatePct}%`} />
          <Card title="Peak Chat Time" value={m.peakChatTime || "—"} />
          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  );
}
