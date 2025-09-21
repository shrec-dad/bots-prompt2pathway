import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

const StatCard = ({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note?: string;
  icon?: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-white shadow-md p-5 flex items-center gap-4">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
      {icon ?? <span className="font-bold">★</span>}
    </div>
    <div className="flex-1">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {note ? <div className="text-xs text-emerald-600 mt-1">{note}</div> : null}
    </div>
  </div>
);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Overview for <span className="font-medium">{currentBot}</span>
          </p>
        </div>

        {/* Quick plan controls for convenience */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBotPlan("basic")}
            className={`px-4 py-2 rounded-lg border text-sm ${
              botPlan === "basic"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => setBotPlan("custom")}
            className={`px-4 py-2 rounded-lg border text-sm ${
              botPlan === "custom"
                ? "bg-fuchsia-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Custom
          </button>

          {(currentBot === "LeadQualifier" || currentBot === "Waitlist") && (
            <label className="ml-3 inline-flex items-center gap-2 text-sm">
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

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Active Bots" value={12} note="+2 this month" />
        <StatCard label="Total Leads" value={1247} note="+12% from last month" />
        <StatCard label="Conversations" value={3891} note="+8% from last month" />
        <StatCard label="Conversion Rate" value={"23.4%"} note="+2.1% this month" />
      </div>

      {/* Current configuration panel */}
      <div className="rounded-2xl bg-white shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-1">Bot Type</div>
            <div className="text-xl font-semibold">{currentBot}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-1">Plan</div>
            <div className="text-xl font-semibold">{planTitle}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-1">Nurture</div>
            <div className="text-xl font-semibold">{nurtureTitle}</div>
            {(currentBot === "LeadQualifier" || currentBot === "Waitlist") && (
              <p className="text-xs text-gray-500 mt-1">
                Available only for Lead Qualifier and Waitlist.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 p-4">
          <p className="text-sm text-gray-700">
            Toggle **Basic/Custom** and **Nurture** here or in the side panel. Your
            choices persist locally and will drive which features the embed exposes.
          </p>
        </div>
      </div>

      {/* Recent bots (static sample for now) */}
      <div className="rounded-2xl bg-white shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bots</h3>
        <div className="space-y-3">
          {[
            { name: "Lead Qualifier Pro", type: "Lead Qualifier", leads: 245, conv: "28.4%", status: "Active" },
            { name: "Appointment Scheduler", type: "Appointment Booking", leads: 158, conv: "41.2%", status: "Active" },
            { name: "Support Assistant", type: "Customer Support", leads: 89, conv: "15.7%", status: "Active" },
            { name: "Waitlist Manager", type: "Waitlist", leads: 0, conv: "0%", status: "Draft" },
          ].map((b) => (
            <div
              key={b.name}
              className="flex items-center justify-between rounded-xl border p-4"
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
