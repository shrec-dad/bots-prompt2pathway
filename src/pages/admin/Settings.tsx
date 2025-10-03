import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { BotKey } from "@/lib/botSettings";

type AppSettings = {
  mode: "basic" | "custom";
  domain: string;
  language: "English";
  darkMode: boolean;
  defaultBot?: BotKey;
  consentText?: string;
};

const KEY = "app:settings";

const wrapper =
  "rounded-2xl border-2 border-black p-5 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50";
const section = "rounded-2xl border bg-white p-5";

export default function Settings() {
  const initial = useMemo<AppSettings>(
    () =>
      getJSON<AppSettings>(KEY, {
        mode: "basic",
        domain: "",
        language: "English",
        darkMode: false,
        defaultBot: "Waitlist",
        consentText:
          "By continuing, you agree to our Terms and Privacy Policy.",
      }),
    []
  );

  const [s, setS] = useState<AppSettings>(initial);

  function save() {
    setJSON(KEY, s);
    alert("Settings saved.");
  }

  function resetAll() {
    if (!confirm("Clear ALL local settings/data? This is not reversible.")) return;
    localStorage.clear();
    alert("Local data cleared. Refresh the page.");
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(s, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      setS(parsed);
      setJSON(KEY, parsed);
      alert("Settings imported.");
    } catch {
      alert("Invalid JSON.");
    } finally {
      e.currentTarget.value = "";
    }
  }

  return (
    <div className={wrapper}>
      <div className="text-3xl font-extrabold mb-4">Settings</div>
      <div className="text-sm font-semibold text-foreground/80 mb-6">
        Adjust system preferences and account details.
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className={section}>
          <div className="text-xl font-extrabold mb-3">Preferences</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                Mode
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.mode}
                onChange={(e) =>
                  setS((p) => ({ ...p, mode: e.target.value as AppSettings["mode"] }))
                }
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                Domain Whitelist
              </div>
              <input
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                placeholder="example.com"
                value={s.domain}
                onChange={(e) => setS((p) => ({ ...p, domain: e.target.value }))}
              />
            </div>

            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                Language
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.language}
                onChange={(e) =>
                  setS((p) => ({ ...p, language: e.target.value as AppSettings["language"] }))
                }
              >
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <div className="text-sm font-bold uppercase text-purple-700">
                Default Bot
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2 font-semibold"
                value={s.defaultBot}
                onChange={(e) =>
                  setS((p) => ({ ...p, defaultBot: e.target.value as BotKey }))
                }
              >
                <option value="LeadQualifier">Lead Qualifier</option>
                <option value="AppointmentBooking">Appointment Booking</option>
                <option value="CustomerSupport">Customer Support</option>
                <option value="Waitlist">Waitlist</option>
                <option value="SocialMedia">Social Media</option>
              </select>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!s.darkMode}
              onChange={(e) => setS((p) => ({ ...p, darkMode: e.target.checked }))}
            />
            <span className="text-sm font-semibold">Dark Mode</span>
          </label>

          <div className="mt-4">
            <div className="text-sm font-bold uppercase text-purple-700">
              Consent / Disclaimer Text
            </div>
            <textarea
              className="w-full rounded-lg border px-3 py-2 font-semibold"
              rows={3}
              value={s.consentText || ""}
              onChange={(e) => setS((p) => ({ ...p, consentText: e.target.value }))}
            />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
              onClick={save}
            >
              Save Changes
            </button>
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
              onClick={exportJson}
            >
              Export
            </button>
            <label className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40 cursor-pointer">
              Import
              <input type="file" accept="application/json" className="hidden" onChange={importJson} />
            </label>
            <button
              className="ml-auto rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-rose-50"
              onClick={resetAll}
            >
              Reset All Local Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
