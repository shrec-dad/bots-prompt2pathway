import React, { useMemo, useState } from "react";

/** Local storage helpers (kept inline so file is self-contained) */
const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
};
const writeJSON = (key: string, value: any) =>
  localStorage.setItem(key, JSON.stringify(value));

/** Storage key for analytics */
const AKEY = "analytics.metrics.v2";

/** Metric type (core + new pro cards) */
type Metrics = {
  // core six
  conversations: number;
  leads: number;
  appointments: number;
  csatPct: number;            // 0–100
  avgResponseSecs: number;    // seconds
  conversionPct: number;      // 0–100

  // ✨ new five
  dropoffPct: number;         // 0–100
  qualifiedLeads: number;     // count
  avgConversationSecs: number;// seconds
  handoffRatePct: number;     // 0–100
  peakChatTime: string;       // label like "2–3 PM"
};

/** Default data (safe placeholders) */
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

/** Small helper for CSV escaping */
function csvEscape(v: string | number) {
  const s = String(v ?? "");
  // If it contains comma, quote or newline, wrap in quotes and escape quotes.
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Timestamp for filenames: 2025-03-01_142355 */
function stamp() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export default function Analytics() {
  const initial = useMemo(
    () => readJSON<Metrics>(AKEY, defaultMetrics),
    []
  );
  const [m, setM] = useState<Metrics>(initial);

  const save = () => {
    writeJSON(AKEY, m);
    alert("Analytics saved.");
  };

  const reset = () => {
    if (!confirm("Reset all analytics to defaults?")) return;
    setM({ ...defaultMetrics });
    writeJSON(AKEY, { ...defaultMetrics });
  };

  /** Export as CSV (Excel-compatible). Two columns: Metric, Value. */
  const exportCSV = () => {
    const rows: Array<[string, string | number]> = [
      // core six
      ["Conversations", m.conversations],
      ["Leads Captured", m.leads],
      ["Appointments Booked", m.appointments],
      ["CSAT (Customer Satisfaction Score) %", `${m.csatPct}`],
      ["Avg Response Time (secs)", `${m.avgResponseSecs}`],
      ["Conversion Rate %", `${m.conversionPct}`],
      // pro five
      ["Drop-off Rate %", `${m.dropoffPct}`],
      ["Qualified Leads", m.qualifiedLeads],
      ["Avg Conversation Length (secs)", `${m.avgConversationSecs}`],
      ["Sales Handoff Rate %", `${m.handoffRatePct}`],
      ["Peak Chat Time", m.peakChatTime || "—"],
      // meta
      ["Exported At", new Date().toISOString()],
    ];

    const header = ["Metric", "Value"];
    const csv =
      header.map(csvEscape).join(",") +
      "\n" +
      rows.map((r) => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${stamp()}.csv`; // Excel will open this directly
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const card = (title: React.ReactNode, value: React.ReactNode) => (
    <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-sm">
      <div className="text-lg font-extrabold leading-tight">{title}</div>
      <div className="mt-2 text-4xl font-black">{value}</div>
    </div>
  );

  const section =
    "rounded-2xl border-2 border-black bg-gradient-to-r from-violet-100 via-sky-100 to-emerald-100 p-5";

  const label = "text-xs font-bold uppercase text-purple-700";
  const input =
    "w-full rounded-lg border-2 border-purple-300 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  return (
    <div
      className="p-6 rounded-2xl border-2 border-purple-200 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg,#ffeef8 0%,#f3e7fc 25%,#e7f0ff 50%,#e7fcf7 75%,#fff9e7 100%)",
      }}
    >
      {/* Header */}
      <div className="rounded-2xl border-2 border-black bg-white p-5 shadow mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-3xl font-extrabold">Analytics</div>
            <div className="text-foreground/80 mt-1">
              Track performance, usage, and engagement metrics.
            </div>
          </div>

          {/* Export / Save / Reset controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
              title="Download as CSV (Excel)"
            >
              Export CSV
            </button>
            <button
              onClick={save}
              className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
              title="Save metrics to your browser"
            >
              Save
            </button>
            <button
              onClick={reset}
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
              title="Reset all metrics"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className={section}>
        <div className="text-2xl font-extrabold mb-4">Metrics</div>

        {/* Core six */}
        <div className="grid gap-4 md:grid-cols-3">
          {card("Conversations", m.conversations)}
          {card("Leads Captured", m.leads)}
          {card("Appointments Booked", m.appointments)}

          {card("CSAT (Customer Satisfaction Score)", `${m.csatPct}%`)}
          {card("Avg Response Time", `${m.avgResponseSecs}s`)}
          {card("Conversion Rate", `${m.conversionPct}%`)}
        </div>

        {/* New Pro Five */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {card("Drop-off Rate", `${m.dropoffPct}%`)}
          {card("Qualified Leads", m.qualifiedLeads)}
          {card("Avg Conversation Length", `${m.avgConversationSecs}s`)}

          {card("Sales Handoff Rate", `${m.handoffRatePct}%`)}
          {card("Peak Chat Time", m.peakChatTime || "—")}
          {/* Empty spacer to balance grid if needed */}
          <div className="hidden md:block" />
        </div>
      </div>

      {/* Edit inputs */}
      <div className="mt-6 rounded-2xl border-2 border-black bg-white p-5 shadow">
        <div className="text-lg font-extrabold mb-3">Update Metrics (demo inputs)</div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* core six */}
          <div>
            <div className={label}>Conversations</div>
            <input
              type="number"
              className={input}
              value={m.conversations}
              onChange={(e) => setM({ ...m, conversations: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Leads</div>
            <input
              type="number"
              className={input}
              value={m.leads}
              onChange={(e) => setM({ ...m, leads: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Appointments</div>
            <input
              type="number"
              className={input}
              value={m.appointments}
              onChange={(e) => setM({ ...m, appointments: Number(e.target.value || 0) })}
            />
          </div>

          <div>
            <div className={label}>CSAT %</div>
            <input
              type="number"
              className={input}
              min={0}
              max={100}
              value={m.csatPct}
              onChange={(e) => setM({ ...m, csatPct: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Avg Response (secs)</div>
            <input
              type="number"
              className={input}
              min={0}
              value={m.avgResponseSecs}
              onChange={(e) => setM({ ...m, avgResponseSecs: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Conversion %</div>
            <input
              type="number"
              className={input}
              min={0}
              max={100}
              value={m.conversionPct}
              onChange={(e) => setM({ ...m, conversionPct: Number(e.target.value || 0) })}
            />
          </div>

          {/* pro five */}
          <div>
            <div className={label}>Drop-off %</div>
            <input
              type="number"
              className={input}
              min={0}
              max={100}
              value={m.dropoffPct}
              onChange={(e) => setM({ ...m, dropoffPct: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Qualified Leads</div>
            <input
              type="number"
              className={input}
              min={0}
              value={m.qualifiedLeads}
              onChange={(e) => setM({ ...m, qualifiedLeads: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Avg Conversation (secs)</div>
            <input
              type="number"
              className={input}
              min={0}
              value={m.avgConversationSecs}
              onChange={(e) => setM({ ...m, avgConversationSecs: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Sales Handoff %</div>
            <input
              type="number"
              className={input}
              min={0}
              max={100}
              value={m.handoffRatePct}
              onChange={(e) => setM({ ...m, handoffRatePct: Number(e.target.value || 0) })}
            />
          </div>
          <div>
            <div className={label}>Peak Chat Time (label)</div>
            <input
              className={input}
              placeholder="e.g., 2–3 PM"
              value={m.peakChatTime}
              onChange={(e) => setM({ ...m, peakChatTime: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
            title="Download as CSV (Excel)"
          >
            Export CSV
          </button>
          <button
            onClick={save}
            className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
            title="Save metrics to your browser"
          >
            Save
          </button>
          <button
            onClick={reset}
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
            title="Reset all metrics"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
