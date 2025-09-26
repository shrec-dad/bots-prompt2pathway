// src/pages/admin/Dashboard.tsx
import React from "react";

/** ---- mock data for the widgets (safe to swap later) ---- */
const kpis = [
  { label: "Conversations (7d)", value: "1,284", trend: [6, 7, 5, 9, 8, 10, 12] },
  { label: "Leads / Tickets (7d)", value: "312", trend: [2, 3, 4, 4, 5, 6, 7] },
  { label: "Avg. Response (sec)", value: "2.1s", trend: [3, 2, 2, 2, 3, 2, 2] },
  { label: "CSAT (7d)", value: "94%", trend: [90, 92, 93, 92, 95, 94, 94] },
];

type BotRow = { bot: string; conversations: number; leads: number; plan: "Basic" | "Custom" };
const topBots: BotRow[] = [
  { bot: "Lead Qualifier", conversations: 486, leads: 210, plan: "Custom" },
  { bot: "Appointment Booking", conversations: 392, leads: 74, plan: "Basic" },
  { bot: "Customer Support", conversations: 248, leads: 18, plan: "Custom" },
  { bot: "Waitlist", conversations: 101, leads: 10, plan: "Basic" },
  { bot: "Social Media", conversations: 57, leads: 0, plan: "Basic" },
];

const recentActivity = [
  { time: "2m ago", text: "New conversation started on /pricing" },
  { time: "9m ago", text: "Lead captured (Customer Support)" },
  { time: "27m ago", text: "Appointment request submitted" },
  { time: "1h ago", text: "Knowledge base updated: “Refund policy”" },
  { time: "3h ago", text: "Waitlist sign-up received" },
];

/** tiny inline sparkline (no deps) */
function Sparkline({ points, stroke = "currentColor" }: { points: number[]; stroke?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 60;
  const h = 24;
  const dx = w / Math.max(1, points.length - 1);
  const norm = (v: number) => {
    if (max === min) return h / 2;
    return h - ((v - min) / (max - min)) * h;
  };
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * dx} ${norm(p)}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** CSV export for the Top Bots table */
function exportBotsCsv(rows: BotRow[]) {
  const header = ["Bot", "Conversations (7d)", "Leads/Tickets (7d)", "Plan"];
  const body = rows.map((r) => [r.bot, String(r.conversations), String(r.leads), r.plan]);
  const lines = [header, ...body].map((arr) => arr.map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "top-bots.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Title bar – keeps your current feel */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-extrabold text-black">Dashboard</h1>
        <p className="mt-2 text-black">
          A quick snapshot of conversations, conversions, and activity.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="border-2 border-black rounded-xl p-4 bg-gradient-to-br from-violet-200 via-indigo-200 to-emerald-200"
          >
            <div className="text-xs font-bold uppercase text-black/80">{k.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-black">{k.value}</div>
            <div className="mt-2 ring-1 ring-black/20 rounded-md bg-white/60 inline-flex px-2 py-1">
              <Sparkline points={k.trend} />
            </div>
          </div>
        ))}
      </div>

      {/* 2-column: Recent activity + Top bots */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-1 border-2 border-black rounded-xl bg-white">
          <div className="border-b-2 border-black px-4 py-3 bg-gradient-to-r from-purple-200 via-blue-200 to-emerald-200 rounded-t-[11px]">
            <div className="font-extrabold text-black">Recent Activity</div>
          </div>
          <ul className="divide-y-2 divide-black/10">
            {recentActivity.map((a, i) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="mt-1 text-sm font-bold text-black/70">•</span>
                <div>
                  <div className="text-sm font-semibold text-black">{a.text}</div>
                  <div className="text-xs text-black/70">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Bots table */}
        <div className="xl:col-span-2 border-2 border-black rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200">
            <div className="font-extrabold text-black">Top Bots This Week</div>
            <button
              onClick={() => exportBotsCsv(topBots)}
              className="rounded-lg px-3 py-1.5 font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-extrabold">Bot</th>
                  <th className="text-left px-4 py-2 text-sm font-extrabold">Conversations (7d)</th>
                  <th className="text-left px-4 py-2 text-sm font-extrabold">Leads/Tickets (7d)</th>
                  <th className="text-left px-4 py-2 text-sm font-extrabold">Plan</th>
                </tr>
              </thead>
              <tbody>
                {topBots.map((r, i) => (
                  <tr key={r.bot} className={i % 2 ? "bg-black/[0.03]" : "bg-white"}>
                    <td className="px-4 py-2 font-extrabold text-black">{r.bot}</td>
                    <td className="px-4 py-2 text-black">{r.conversations}</td>
                    <td className="px-4 py-2 text-black">{r.leads}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-md border-2 border-black px-2 py-0.5 text-xs font-extrabold bg-gradient-to-r from-indigo-200 to-emerald-200">
                        {r.plan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
