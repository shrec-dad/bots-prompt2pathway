import React from "react";
import { useAdminStore } from "@/lib/AdminStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** Small helper: stat card */
const StatCard = ({
  label,
  value,
  note,
  emoji,
}: {
  label: string;
  value: string | number;
  note?: string;
  emoji?: string;
}) => (
  <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5 flex items-center gap-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-lg">
      {emoji ?? "★"}
    </div>
    <div className="flex-1">
      <div className="text-xs sm:text-sm text-gray-500">{label}</div>
      <div className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
        {value}
      </div>
      {note ? (
        <div className="text-[11px] sm:text-xs text-emerald-600 mt-1">{note}</div>
      ) : null}
    </div>
  </div>
);

/** Demo data for chart (replace later with real analytics) */
const leadSeries = [
  { day: "Mon", leads: 42 },
  { day: "Tue", leads: 51 },
  { day: "Wed", leads: 39 },
  { day: "Thu", leads: 66 },
  { day: "Fri", leads: 58 },
  { day: "Sat", leads: 23 },
  { day: "Sun", leads: 31 },
];

export const Dashboard: React.FC = () => {
  const { currentBot, botPlan, includeNurture, setBotPlan, setIncludeNurture } =
    useAdminStore();

  const planTitle = botPlan === "basic" ? "Basic" : "Custom";
  const nurtureTitle =
    currentBot === "LeadQualifier" || currentBot === "Waitlist"
      ? includeNurture
        ? "Nurture ON"
        : "Nurture OFF"
      : "N/A";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Overview for <span className="font-medium">{currentBot}</span>
          </p>
        </div>

        {/* Quick plan controls (mobile-first, wrap nicely) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBotPlan("basic")}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              botPlan === "basic"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => setBotPlan("custom")}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              botPlan === "custom"
                ? "bg-fuchsia-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Custom
          </button>

          {(currentBot === "LeadQualifier" || currentBot === "Waitlist") && (
            <label className="ml-1 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeNurture}
                onChange={(e) => setIncludeNurture(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              Nurture
            </label>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Active Bots" value={12} note="+2 this month" emoji="🤖" />
        <StatCard label="Total Leads" value={1247} note="+12% MoM" emoji="👥" />
        <StatCard label="Conversations" value={3891} note="+8% MoM" emoji="💬" />
        <StatCard label="Conversion Rate" value={"23.4%"} note="+2.1% MoM" emoji="📈" />
      </div>

      {/* Chart + configuration */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart card */}
        <div className="xl:col-span-2 rounded-2xl bg-white shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lead Trend</h2>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadSeries} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis width={28} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#7c3aed"
                  fill="url(#leadFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current configuration */}
        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border p-3 sm:p-4">
              <div className="text-xs text-gray-500 mb-1">Bot Type</div>
              <div className="text-lg font-semibold">{currentBot}</div>
            </div>
            <div className="rounded-xl border p-3 sm:p-4">
              <div className="text-xs text-gray-500 mb-1">Plan</div>
              <div className="text-lg font-semibold">{planTitle}</div>
            </div>
            <div className="rounded-xl border p-3 sm:p-4 sm:col-span-2">
              <div className="text-xs text-gray-500 mb-1">Nurture</div>
              <div className="text-lg font-semibold">{nurtureTitle}</div>
              {(currentBot === "LeadQualifier" || currentBot === "Waitlist") && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Available only for Lead Qualifier and Waitlist.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 p-3 sm:p-4 text-sm text-gray-700">
            Toggle **Basic/Custom** and **Nurture** here or in the side panel. Your
            choices persist locally and will control which features the embed exposes.
          </div>
        </div>
      </div>

      {/* Recent bots list (static sample) */}
      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Bots</h3>
        <div className="space-y-3">
          {[
            { name: "Lead Qualifier Pro", type: "Lead Qualifier", leads: 245, conv: "28.4%", status: "Active" },
            { name: "Appointment Scheduler", type: "Appointment Booking", leads: 158, conv: "41.2%", status: "Active" },
            { name: "Support Assistant", type: "Customer Support", leads: 89, conv: "15.7%", status: "Active" },
            { name: "Waitlist Manager", type: "Waitlist", leads: 0, conv: "0%", status: "Draft" },
          ].map((b) => (
            <div
              key={b.name}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border p-3 sm:p-4 gap-2"
            >
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-gray-500">{b.type}</div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <div className="text-gray-500">Leads</div>
                  <div className="font-semibold">{b.leads}</div>
                </div>
                <div>
                  <div className="text-gray-500">Conversion</div>
                  <div className="font-semibold">{b.conv}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    b.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

    
      
            
          
               
