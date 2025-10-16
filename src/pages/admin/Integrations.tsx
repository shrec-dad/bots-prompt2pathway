// src/pages/admin/Integrations.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { getJSON, setJSON } from "@/lib/storage";
import { listInstances, type InstanceMeta } from "@/lib/instances";
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
      return "receptionist-bot";
    default:
      return null; // custom templates won't have an AdminStore id
  }
}

/** Safely resolve a storage key for a selection value (instance id OR template key OR object) */
function resolveStorageKey(selection: unknown): string {
  // If we already have a string, normalize it
  if (typeof selection === "string") {
    if (selection.startsWith("inst_")) return selection; // instance id
    // template: prefer legacy admin id if available
    return adminIdForTemplateKey(selection) || selection;
  }

  // Some UIs may pass an object; try to glean id/key safely
  if (selection && typeof selection === "object") {
    const anySel = selection as any;
    // Instance objects often have an id like "inst_..."
    if (typeof anySel.id === "string") {
      if (anySel.id.startsWith("inst_")) return anySel.id;
      // If it's an admin id (e.g., "waitlist-bot"), use it as-is
      return anySel.id;
    }
    // Template objects may expose a `key`
    if (typeof anySel.key === "string") {
      return adminIdForTemplateKey(anySel.key) || anySel.key;
    }
    // Or a generic value field
    if (typeof anySel.value === "string") {
      return resolveStorageKey(anySel.value);
    }
  }

  // Fallback: empty string means "no selection"
  return "";
}

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const Grad =
  "bg-gradient-to-br from-indigo-200/60 via-blue-200/55 to-emerald-200/55";
const strongCard =
  "rounded-2xl border-[3px] border-black/80 shadow-[0_6px_0_rgba(0,0,0,0.8)] transition hover:shadow-[0_8px_0_rgba(0,0,0,0.9)]";

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

  // selection value can be template key OR instance id OR an object from BotSelector
  const [appliesTo, setAppliesTo] = useState<string>(() => {
    const firstAdminId = typeof bots?.[0]?.id === "string" ? bots[0].id : "";
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
    if (!key) {
      alert("Pick a target (template or instance) first.");
      return;
    }
    setJSON(KEY(key), form);
    alert("Integrations saved for this target.");
  };

  const reset = () => {
    const key = resolveStorageKey(appliesTo);
    if (!key) return;
    if (!confirm("Clear all integration fields for this target?")) return;
    setForm({});
    setJSON(KEY(key), {});
  };

  const input =
    "w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const label = "text-xs font-bold uppercase tracking-wide text-foreground/80";

  // Little hint message when editing an instance
  const instanceHint =
    typeof appliesTo === "string" && appliesTo.startsWith("inst_") ? (
      <div className="text-xs font-semibold text-black/70">
        Editing <span className="font-extrabold">client bot instance</span>. Blank fields effectively started as inherited from its base template when this form loaded. Any values you save here are stored only for this instance.
      </div>
    ) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className={classNames("p-5", strongCard)}>
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Integrations</h1>
            <p className="text-foreground/80">
              Connect your bot universally with webhook URLs and API endpoints. Stay future-proof across any CRM or calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Applies-to selector */}
      <div className={classNames(strongCard, Grad)}>
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="p-5 space-y-4">
          <div className="text-lg font-extrabold">Applies to</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="block">
              <div className={label}>Target</div>
              <BotSelector
                scope="both"
                value={appliesTo}
                onChange={(v) => {
                  const next = resolveStorageKey(v);
                  setAppliesTo(next);
                }}
                placeholderOption="— Select a Template or an Instance —"
                showGroups
              />
            </label>

            <div className="flex items-end gap-3">
              <button
                onClick={save}
                className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px] border-2 border-black hover:shadow-[0_4px_0_#000]"
              >
                Save
              </button>
              <button
                onClick={reset}
                className="rounded-xl px-4 py-2 font-bold border-2 border-black bg-white shadow hover:shadow-md"
              >
                Reset
              </button>
            </div>
          </div>
          {instanceHint && <div className="md:col-span-3">{instanceHint}</div>}
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Email Integration */}
        <div className={classNames(strongCard, Grad)}>
          <div className="h-2 rounded-md bg-black mb-4" />
          <div className="p-5 space-y-4">
            <div>
              <div className="text-lg font-extrabold">Email Integration (optional)</div>
              <p className="text-foreground/80 text-sm mt-1">
                Use a webhook or relay endpoint to send emails to your ESP, Zapier, or serverless function.
              </p>
            </div>

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
                type="password"
                value={form.emailApiKey || ""}
                onChange={(e) => setForm({ ...form, emailApiKey: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Calendar Integration */}
        <div className={classNames(strongCard, Grad)}>
          <div className="h-2 rounded-md bg-black mb-4" />
          <div className="p-5 space-y-4">
            <div>
              <div className="text-lg font-extrabold">Calendar Integration (universal)</div>
              <p className="text-foreground/80 text-sm mt-1">
                Provide a single webhook that creates events on your system or third-party calendar (Google, Outlook, Cal.com, etc.).
              </p>
            </div>

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
                type="password"
                value={form.calendarSecret || ""}
                onChange={(e) => setForm({ ...form, calendarSecret: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* CRM Integration */}
        <div className={classNames(strongCard, Grad)}>
          <div className="h-2 rounded-md bg-black mb-4" />
          <div className="p-5 space-y-4">
            <div>
              <div className="text-lg font-extrabold">CRM Integration (universal)</div>
              <p className="text-foreground/80 text-sm mt-1">
                Post new leads to a universal endpoint that routes to any CRM (HubSpot, Salesforce, Pipedrive, Close, etc.).
              </p>
            </div>

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
                type="password"
                value={form.crmAuthToken || ""}
                onChange={(e) => setForm({ ...form, crmAuthToken: e.target.value })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
