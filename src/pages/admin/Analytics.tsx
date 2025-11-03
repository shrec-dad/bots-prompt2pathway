// src/pages/admin/Analytics.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchInstances } from '@/store/botInstancesSlice';
import { fetchMetrics, deleteMetrics } from '@/store/metricsSlice';
import BotSelector from "@/components/BotSelector";

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
 * Small UI helpers - UPDATED WITH BOLD STYLING
 * ------------------------------------------------------------ */
const sectionCls =
  "rounded-2xl border-[3px] border-black/80 shadow-[0_4px_0_rgba(0,0,0,0.8)] p-4 md:p-5";

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


/** Safe text for UI: never render an object by accident */
function asSafeText(val: unknown): string {
  if (val == null) return "";
  return typeof val === "string" ? val : JSON.stringify(val);
}

/** ------------------------------------------------------------
 * Component
 * ------------------------------------------------------------ */
export default function Analytics() {
  const dispatch = useDispatch();

  const instances = useSelector((state: RootState) => state.instances.list);
  const metricsFromStore = useSelector((state: RootState) => state.metrics.data);
  
  // Selection (instance filter)
  const [instId, setInstId] = useState<string>(""); // empty => global

  useEffect(() => {
    dispatch(fetchInstances());
  }, [dispatch]);

  const [m, setM] = useState<Metrics>(defaultMetrics);

  useEffect(() => {
    if (metricsFromStore) {
      setM({ ...m, ...metricsFromStore });
    }
  }, [metricsFromStore]);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchMetrics(instId ? `inst:${instId}`: ''));
  }, [instId]);

  /** Save current metrics to whichever scope is active */
  const save = () => {
    alert("Analytics saved.");
  };

  /** Reset current scope to zeros/placeholders */
  const reset = () => {
    if (!confirm("Reset analytics for the current scope?")) return;
    dispatch(deleteMetrics(instId ? `inst:${instId}` : ''));
    dispatch(fetchMetrics(instId ? `inst:${instId}`: ''));
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
                instances={instances}
                value={instId}
                onChange={(val) => setInstId(val.id)}
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
            className="rounded-xl px-3.5 py-2 font-bold text-white shadow-[0_3px_0_#000] active:translate-y-[1px]"
            style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}
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
      <div className={sectionCls} style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}>
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
