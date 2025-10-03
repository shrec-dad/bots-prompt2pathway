// src/pages/admin/Analytics.tsx
import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

/** ------------------------------------------------------------
 *  Types & storage helpers
 *  ------------------------------------------------------------ */
type Metrics = {
  conversations: number;
  leads: number;
  appointments: number;
  csat: number; // percentage 0-100
  avgResponseSecs: number; // seconds
  conversionPct: number; // percentage 0-100
};

const KEY = "analytics.metrics.v1";

const defaultMetrics: Metrics = {
  conversations: 0,
  leads: 0,
  appointments: 0,
  csat: 0,
  avgResponseSecs: 0,
  conversionPct: 0,
};

/** ------------------------------------------------------------
 *  Small presentational card
 *  ------------------------------------------------------------ */
function MetricCard({
  title,
  value,
  suffix,
}: {
  title: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div
      className="rounded-2xl border-2 border-black bg-white p-5 shadow"
      style={{ boxShadow: "6px 6px 0 #000" }}
    >
      <div className="text-lg font-extrabold tracking-tight">{title}</div>
      <div className="mt-2 text-4xl font-extrabold">
        {value}
        {suffix ? <span className="text-2xl font-extrabold ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

/** ------------------------------------------------------------
 *  Page
 *  ------------------------------------------------------------ */
export default function Analytics() {
  const initial = useMemo<Metrics>(
    () => getJSON<Metrics>(KEY, defaultMetrics),
    []
  );

  const [metrics, setMetrics] = useState<Metrics>(initial);
  const [saving, setSaving] = useState(false);

  const save = (m: Metrics) => {
    setJSON(KEY, m);
    setMetrics(m);
  };

  const onReset = () => {
    const cleared = { ...defaultMetrics };
    save(cleared);
  };

  return (
    <div
      className="p-6 rounded-2xl border-2 border-purple-200"
      style={{
        background:
          "linear-gradient(135deg, #ffeef8 0%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* Header */}
      <div className="rounded-2xl border-2 border-black bg-white shadow mb-6">
        <div
          className="rounded-t-2xl p-5 text-white"
          style={{
            background:
              "linear-gradient(90deg, rgba(168,85,247,0.9) 0%, rgba(99,102,241,0.9) 50%, rgba(45,212,191,0.9) 100%)",
          }}
        >
          <div className="text-3xl font-extrabold">Analytics</div>
          <div className="text-sm opacity-90">
            Track performance, usage, and engagement metrics.
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex items-center gap-3">
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-black bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
            onClick={() => {
              setSaving(true);
              setTimeout(() => setSaving(false), 500);
              save(metrics);
            }}
          >
            {saving ? "Saved" : "Save Snapshot"}
          </button>

          <button
            className="ml-auto rounded-xl px-4 py-2 font-bold text-white"
            style={{
              background:
                "linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)",
              boxShadow: "0 3px 0 #000",
            }}
            onClick={onReset}
            title="Clear all metrics to zero"
          >
            Reset Metrics
          </button>
        </div>
      </div>

      {/* Metric grid */}
      <div
        className="rounded-2xl border-2 border-black p-5 shadow"
        style={{
          background:
            "linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(147,197,253,0.25) 50%, rgba(134,239,172,0.25) 100%)",
          boxShadow: "8px 8px 0 #000",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard title="Conversations" value={metrics.conversations} />
          <MetricCard title="Leads Captured" value={metrics.leads} />
          <MetricCard title="Appointments Booked" value={metrics.appointments} />

          <MetricCard
            title="CSAT (Customer Satisfaction Score)"
            value={metrics.csat}
            suffix="%"
          />
          <MetricCard
            title="Avg Response Time"
            value={metrics.avgResponseSecs}
            suffix="s"
          />
          <MetricCard
            title="Conversion Rate"
            value={metrics.conversionPct}
            suffix="%"
          />
        </div>

        {/* NOTE:
            This page now shows display-only metric cards.
            Data stays in localStorage using the same storage helpers.
            The Reset button clears everything back to zero.
            When you wire real data later, call `save({...})` with live values.
        */}
      </div>
    </div>
  );
}
