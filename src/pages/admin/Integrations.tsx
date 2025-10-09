// src/pages/admin/Integrations.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { getJSON, setJSON } from "@/lib/storage";
import { listInstances, getInstance, type InstanceMeta } from "@/lib/instances";
import BotSelector from "@/components/BotSelector";

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

// Persist under a chosen key (admin id, instance id, or template key)
const KEY = (botId: string) => `integrations:${botId}`;

/** Map Template Keys to AdminStore ids for backward-compatibility */
function adminIdForTemplateKey(botKey: string): string | null {
  switch (botKey) {
    case "LeadQualifier":
      return "lead-qualifier";
    case "AppointmentBooking":
      return "appointment";
    case "CustomerSupport":
      return "customer-support";
    case "Waitlist":
      return "waitlist-bot";
    case "SocialMedia":
      return "social-media";
    case "Receptionist":
      // Add mapping for Receptionist so legacy storage remains consistent
      return "receptionist-bot";
    default:
      return null; // custom templates won't have an AdminStore id
  }
}

/** Resolve a storage key for a selection value (instance id OR template key) */
function resolveStorageKey(selection: string): string {
  if (selection.startsWith("inst_")) return selection; // instance
  // template path: prefer legacy admin id if available
  return adminIdForTemplateKey(selection) || selection; // fallback to template key
}

export default function Integrations() {
  const { bots } = useAdminStore();

  // ===== Client bots (instances) =====
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // selection value can be template key OR instance id
  const [appliesTo, setAppliesTo] = useState<string>(() => {
    // Prefer first admin bot id (backward compat) if present; else first template key; else instance if any; else ""
    const firstAdminId = bots?.[0]?.id || "";
    return firstAdminId || "";
  });

  // Load config for selected key.
  const cfg = useMemo<UniversalCfg>(() => {
    const key = resolveStorageKey(appliesTo);
    return getJSON<UniversalCfg>(KEY(key), {});
  }, [appliesTo]);

  const [form, setForm] = useState<UniversalCfg>(cfg);

  useEffect(() => {
    const key = resolveStorageKey(appliesTo);
    setForm(getJSON<UniversalCfg>(KEY(key), {}));
  }, [appliesTo]);

  const save = () => {
    const key = resolveStorageKey(appliesTo);
    setJSON(KEY(key), form);
    alert("Integrations saved for this target.");
  };

  const reset = () => {
    if (!appliesTo) return;
    if (!confirm("Clear all integration fields for this target?")) return;
    const key = resolveStorageKey(appliesTo);
    setForm({});
    setJSON(KEY(key), {});
  };

  const header =
    "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-purple-100 via-indigo-100 to-emerald-100";
  const group =
    "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-violet-100 via-sky-100 to-green-100";
  const card =
    "rounded-2xl border-2 border-black bg-white p-4 shadow space-y-3";

  const label = "text-xs font-bold uppercase text-purple-700";
  const input =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  // Little hint message when editing an instance
  const instanceHint =
    appliesTo.startsWith("inst_") ? (
      <div className="text-[12px] font-semibold text-black/70">
        Editing <span className="font-extrabold">client bot instance</span>. Blank
        fields effectively started as inherited from its base template when this form loaded.
        Any values you save here are stored only for this instance.
      </div>
    ) : null;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="block">
            <div className={label}>Target</div>
            <BotSelector
              scope="both"
              value={appliesTo}
              onChange={setAppliesTo}
              placeholderOption="— Select a Template or an Instance —"
              showGroups
            />
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
          <div className="md:col-span-3">{instanceHint}</div>
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

