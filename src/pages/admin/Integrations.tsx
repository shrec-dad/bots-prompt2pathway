import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

type IntegrationsState = {
  email: { enabled: boolean; smtpHost?: string; apiKey?: string };
  calendar: { enabled: boolean; provider?: "Google" | "Outlook"; webhook?: string };
  crm: { enabled: boolean; system?: "HubSpot" | "Salesforce" | "Pipedrive"; apiKey?: string };
};

const KEY = "integrations:state";

const header = "text-3xl font-extrabold mb-2";
const sub = "text-sm font-semibold text-foreground/80 mb-4";
const card = "rounded-2xl border bg-white p-5";

export default function Integrations() {
  const initial = useMemo<IntegrationsState>(
    () =>
      getJSON<IntegrationsState>(KEY, {
        email: { enabled: false, smtpHost: "", apiKey: "" },
        calendar: { enabled: false, provider: "Google", webhook: "" },
        crm: { enabled: false, system: "HubSpot", apiKey: "" },
      }),
    []
  );

  const [s, setS] = useState<IntegrationsState>(initial);

  function save() {
    setJSON(KEY, s);
    alert("Integrations saved.");
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border bg-white shadow-sm px-5 py-4 mb-6">
        <div className={header}>Integrations</div>
        <div className={sub}>
          Connect your bot to tools like email, CRM, and calendars.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Email */}
        <div className={card}>
          <div className="flex items-center justify-between">
            <div className="text-lg font-extrabold">Email Integration</div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={s.email.enabled}
                onChange={(e) =>
                  setS((p) => ({ ...p, email: { ...p.email, enabled: e.target.checked } }))
                }
              />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                SMTP Host (optional)
              </div>
              <input
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.email.smtpHost || ""}
                onChange={(e) =>
                  setS((p) => ({ ...p, email: { ...p.email, smtpHost: e.target.value } }))
                }
              />
            </div>
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                API Key (optional)
              </div>
              <input
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.email.apiKey || ""}
                onChange={(e) =>
                  setS((p) => ({ ...p, email: { ...p.email, apiKey: e.target.value } }))
                }
              />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className={card}>
          <div className="flex items-center justify-between">
            <div className="text-lg font-extrabold">Calendar Integration</div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={s.calendar.enabled}
                onChange={(e) =>
                  setS((p) => ({
                    ...p,
                    calendar: { ...p.calendar, enabled: e.target.checked },
                  }))
                }
              />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                Provider
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.calendar.provider}
                onChange={(e) =>
                  setS((p) => ({
                    ...p,
                    calendar: {
                      ...p.calendar,
                      provider: e.target.value as IntegrationsState["calendar"]["provider"],
                    },
                  }))
                }
              >
                <option value="Google">Google</option>
                <option value="Outlook">Outlook</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                Webhook URL (optional)
              </div>
              <input
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.calendar.webhook || ""}
                onChange={(e) =>
                  setS((p) => ({
                    ...p,
                    calendar: { ...p.calendar, webhook: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* CRM */}
        <div className={card}>
          <div className="flex items-center justify-between">
            <div className="text-lg font-extrabold">CRM Integration</div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={s.crm.enabled}
                onChange={(e) =>
                  setS((p) => ({ ...p, crm: { ...p.crm, enabled: e.target.checked } }))
                }
              />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                CRM System
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.crm.system}
                onChange={(e) =>
                  setS((p) => ({
                    ...p,
                    crm: { ...p.crm, system: e.target.value as any },
                  }))
                }
              >
                <option value="HubSpot">HubSpot</option>
                <option value="Salesforce">Salesforce</option>
                <option value="Pipedrive">Pipedrive</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                API Key (optional)
              </div>
              <input
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.crm.apiKey || ""}
                onChange={(e) =>
                  setS((p) => ({ ...p, crm: { ...p.crm, apiKey: e.target.value } }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
            onClick={save}
          >
            Save Integrations
          </button>
        </div>
      </div>
    </div>
  );
}
