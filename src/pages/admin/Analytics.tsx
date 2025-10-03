// src/pages/admin/Analytics.tsx
import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

type Metrics = {
  conversations: number;
  leads: number;
  appointments: number;
  csat: number;              // 0–100
  avgResponseSecs: number;   // seconds
  conversionRate: number;    // 0–100
};

const KEY = "analyticsMetrics";

const DEFAULT_METRICS: Metrics = {
  conversations: 0,
  leads: 0,
  appointments: 0,
  csat: 0,
  avgResponseSecs: 0,
  conversionRate: 0,
};

export default function Analytics() {
  const initial = useMemo<Metrics>(() => getJSON(KEY, DEFAULT_METRICS), []);
  const [m, setM] = useState<Metrics>(initial);

  const save = () => {
    setJSON(KEY, m);
    alert("Analytics metrics saved.");
  };

  const reset = () => {
    if (!confirm("Reset all metrics to 0?")) return;
    setM(DEFAULT_METRICS);
    setJSON(KEY, DEFAULT_METRICS);
  };

  const card =
    "rounded-2xl border-2 border-black bg-white px-5 py-4 shadow";

  const header =
    "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-purple-100 via-indigo-100 to-emerald-100";

  const band =
    "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-violet-100 via-sky-100 to-green-100";

  const label = "text-sm font-extrabold text-black/80";
  const big   = "text-2xl md:text-3xl font-extrabold tracking-tight";

  return (
    <div
      className="p-6 space-y-6 rounded-2xl border-2 border-purple-200 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* Header */}
      <div className={header}>
        <div className="text-3xl font-extrabold">Analytics</div>
        <div className="text-black/80">
          Track performance, usage, and engagement metrics.
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px] border-2 border-black"
        >
          Save
        </button>
        <button
          onClick={reset}
          className="rounded-xl px-4 py-2 font-bold border-2 border-black bg-white shadow hover:bg-muted/40"
        >
          Reset
        </button>
      </div>

      {/* Metrics band */}
      <div className={band}>
        <div className="text-2xl font-extrabold mb-4">Metrics</div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className={card}>
            <div className={label}>Conversations</div>
            <div className={big}>{m.conversations}</div>
          </div>

          <div className={card}>
            <div className={label}>Leads Captured</div>
            <div className={big}>{m.leads}</div>
          </div>

          <div className={card}>
            <div className={label}>Appointments Booked</div>
            <div className={big}>{m.appointments}</div>
          </div>

          <div className={card}>
            <div className={label}>CSAT (Customer Satisfaction Score)</div>
            <div className={big}>{m.csat}%</div>
          </div>

          <div className={card}>
            <div className={label}>Avg Response Time</div>
            <div className={big}>
              {m.avgResponseSecs}s
            </div>
          </div>

          <div className={card}>
            <div className={label}>Conversion Rate</div>
            <div className={big}>{m.conversionRate}%</div>
          </div>
        </div>

        {/* Quick edit area (so you can play with values until backend exists) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberField
            label="Conversations"
            value={m.conversations}
            onChange={(v) => setM({ ...m, conversations: v })}
          />
          <NumberField
            label="Leads"
            value={m.leads}
            onChange={(v) => setM({ ...m, leads: v })}
          />
          <NumberField
            label="Appointments"
            value={m.appointments}
            onChange={(v) => setM({ ...m, appointments: v })}
          />
          <NumberField
            label="CSAT %"
            value={m.csat}
            onChange={(v) => setM({ ...m, csat: clampPct(v) })}
          />
          <NumberField
            label="Avg Response (secs)"
            value={m.avgResponseSecs}
            onChange={(v) => setM({ ...m, avgResponseSecs: Math.max(0, v) })}
          />
          <NumberField
            label="Conversion %"
            value={m.conversionRate}
            onChange={(v) => setM({ ...m, conversionRate: clampPct(v) })}
          />
        </div>
      </div>
    </div>
  );
}

function clampPct(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs font-bold uppercase text-purple-700 mb-1">
        {label}
      </div>
      <input
        type="number"
        className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
    </label>
  );
}
