// src/pages/admin/Integrations.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Row = ({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full rounded-xl border bg-white px-4 py-4 text-left font-bold ring-1 ring-border hover:bg-white/90 hover:shadow-sm transition flex items-center gap-3"
      aria-label={`Open ${label}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-6 bg-card">
        <h1 className="text-2xl font-extrabold">Integrations</h1>
        <p className="mt-2">
          Connect your bot to tools like email, CRM, and calendars.
        </p>
      </div>

      <div className="rounded-xl border p-6 bg-gradient-to-r from-emerald-200/60 via-sky-200/60 to-indigo-200/60">
        <h2 className="font-extrabold text-lg mb-4">Available Integrations</h2>

        <div className="space-y-3">
          <Row icon={<span>📧</span>} label="Email Integration" to="/admin/settings?tab=email" />
          <Row icon={<span>📅</span>} label="Calendar Integration" to="/admin/settings?tab=calendar" />
          <Row icon={<span>💼</span>} label="CRM Integration" to="/admin/settings?tab=crm" />
        </div>
      </div>
    </div>
  );
}
 
