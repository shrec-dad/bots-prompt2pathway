// src/pages/admin/Integrations.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { getJSON, setJSON } from "@/lib/storage";

type UniversalCfg = {
  // Email (optional)
  emailWebhook?: string;
  emailApiKey?: string;

  // Calendar (universal)
  calendarWebhook?: string;
  calendarSecret?: string;

  // CRM (universal)
  crmWebhook?: string;
  crmAuthToken?: string;
};

const KEY = (botId: string) => `integrations:${botId}`;

export default function Integrations() {
  const { bots, currentBot } = useAdminStore();
  const [botId, setBotId] = useState<string>(currentBot);

  // load config for selected bot
  const cfg = useMemo<UniversalCfg>(
    () => getJSON(KEY(botId), {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [botId]
  );
  const [form, setForm] = useState<UniversalCfg>(cfg);

  useEffect(() => {
    // refresh form when bot changes
    setForm(getJSON(KEY(botId), {}));
  }, [botId]);

  const save = () => {
    setJSON(KEY(botId), form);
    alert("Integrations saved for this bot.");
  };

  const reset = () => {
    if (!confirm("Clear all integration fields for this bot?")) return;
    setForm({});
    setJSON(KEY(botId), {});
  };

  const header =
    "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-purple-100 via-indigo-100 to-emerald-100";
  const group  =
    "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-violet-100 via-sky-100 to-green-100";
  const card   =
    "rounded-2xl border-2 border-black bg-white p-4 shadow space-y-3";

  const label =
    "text-xs font-bold uppercase text-purple-700";
  const input =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  return (
    <div
      className="p-6 space-y-6 rounded-2xl border-2 border-purple-200 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      <div className={header}>
        <div className="text-3xl font-extrabold">Integrations</div>
        <div className="text-black/80">
          Connect your bot universally—no provider dropdowns. Use your own webhook URLs or API
          endpoints. This keeps you future-proof across any CRM or calendar.
        </div>
      </div>

      {/* Applies-to selector */}
      <div className={group}>
        <div className="text-lg font-extrabold mb-3">Applies to</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className={label}>Bot</div>
            <select
              className={input}
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id})
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3">
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
        </div>
      </div>

      {/* Universal sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Email (optional) */}
        <div className={card}>
          <div className="text-lg font-extrabold">Email Integration (optional)</div>
          <p className="text-black/80">
            Use a webhook or relay endpoint to send emails (e.g., to your ESP, Zapier, or a serverless function).
          </p>

          <label className="block">
            <div className={label}>Email Webhook URL</div>
            <input
              className={input}
              placeholder="https://api.yourdomain.com/email/send"
              value={form.emailWebhook || ""}
              onChange={(e) => setForm({ ...form, emailWebhook: e.target.value })}
            />
          </label>

          <label className="block">
            <div className={label}>Email API Key / Secret (optional)</div>
            <input
              className={input}
              placeholder="sk_live_***"
              value={form.emailApiKey || ""}
              onChange={(e) => setForm({ ...form, emailApiKey: e.target.value })}
            />
          </label>
        </div>

        {/* Calendar (universal) */}
        <div className={card}>
          <div className="text-lg font-extrabold">Calendar Integration (universal)</div>
          <p className="text-black/80">
            Provide a single webhook that creates events on your system or a third-party calendar
            (Google, Outlook, Cal.com, etc.). Your backend can route to the right provider.
          </p>

          <label className="block">
            <div className={label}>Create Event Webhook URL</div>
            <input
              className={input}
              placeholder="https://api.yourdomain.com/calendar/create"
              value={form.calendarWebhook || ""}
              onChange={(e) => setForm({ ...form, calendarWebhook: e.target.value })}
            />
          </label>

          <label className="block">
            <div className={label}>Secret / API Key (optional)</div>
            <input
              className={input}
              placeholder="calc_secret_***"
              value={form.calendarSecret || ""}
              onChange={(e) => setForm({ ...form, calendarSecret: e.target.value })}
            />
          </label>
        </div>

        {/* CRM (universal) */}
        <div className={card}>
          <div className="text-lg font-extrabold">CRM Integration (universal)</div>
          <p className="text-black/80">
            Post new leads to a universal endpoint on your side. From there you can map to any CRM
            (HubSpot, Salesforce, Pipedrive, Close, etc.).
          </p>

          <label className="block">
            <div className={label}>Lead Webhook URL</div>
            <input
              className={input}
              placeholder="https://api.yourdomain.com/crm/leads"
              value={form.crmWebhook || ""}
              onChange={(e) => setForm({ ...form, crmWebhook: e.target.value })}
            />
          </label>

          <label className="block">
            <div className={label}>Auth Token (optional)</div>
            <input
              className={input}
              placeholder="crm_token_***"
              value={form.crmAuthToken || ""}
              onChange={(e) => setForm({ ...form, crmAuthToken: e.target.value })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
