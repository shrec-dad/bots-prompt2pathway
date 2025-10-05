import React, { useMemo, useState } from "react";

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
 * Storage key and metric types
 * ------------------------------------------------------------ */
const AKEY = "analytics.metrics.v2";

type Metrics = {
  // core six
  conversations: number;
  leads: number;
  appointments: number;
  csatPct: number;         // 0–100
  avgResponseSecs: number; // seconds
  conversionPct: number;   // 0–100

  // pro five
  dropoffPct: number;         // 0–100
  qualifiedLeads: number;     // count
  avgConversationSecs: number; // seconds
  handoffRatePct: number;     // 0–100
  peakChatTime: string;       // e.g., "2–3 PM"
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
  // Load persisted metrics (display-only on this page)
  const initial = useMemo(() => readJSON<Metrics>(AKEY, defaultMetrics), []);
  const [m, setM] = useState<Metrics>(initial);
  const [exporting, setExporting] = useState(false);

  /** Save whatever is currently in state (useful after you sync from backend later) */
  const save = () => {
    writeJSON(AKEY, m);
    alert("Analytics saved.");
  };

  /** Reset to zeros/placeholders */
  const reset = () => {
    if (!confirm("Reset all analytics to defaults?")) return;
    setM({ ...defaultMetrics });
    writeJSON(AKEY, { ...defaultMetrics });
  };

  /** Export a true .xlsx workbook using SheetJS (loaded on demand) */
  const exportXLSX = async () => {
    try {
      setExporting(true);
      const XLSX = await ensureXLSX();

      const rows: Array<[string, string | number]> = [
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
      a.download = `analytics-${timeStamp()}.xlsx`;
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
      {/* Header */}
      <div className="rounded-2xl border-2 border-black bg-white p-4 md:p-5 shadow mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold">Analytics</div>
            <div className="text-foreground/80 mt-1">
              Track performance, usage, and engagement metrics.
            </div>
          </div>

          {/* Export / Save / Reset controls */}
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
              title="Save metrics to your browser"
            >
              Save
            </button>
            <button
              onClick={reset}
              className="rounded-xl px-3.5 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
              title="Reset all metrics"
            >
              Reset
            </button>
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
