import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { BotKey } from "@/lib/botSettings";

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

type SyncMode = "local" | "digitalocean";

type AppSettings = {
  // existing
  mode: "basic" | "custom";
  domain: string; // comma-separated hostnames
  language: "English";
  darkMode: boolean;
  defaultBot?: BotKey;
  consentText?: string;

  // NEW: branding
  brandLogoDataUrl?: string;

  // NEW: notifications
  emailNotifications?: boolean;
  notifyEmail?: string;

  // NEW: palette (used as defaults when creating bots/instances)
  palette?: {
    from: string;
    via: string;
    to: string;
  };

  // NEW: data sync
  syncMode?: SyncMode; // local (default) vs DigitalOcean (stub)

  // internal: last cloud backup ISO timestamp
  lastCloudBackupAt?: string;
};

const KEY = "app:settings";

/* -------------------------------------------------------------------------- */
/* UI helpers                                                                 */
/* -------------------------------------------------------------------------- */

const wrapper =
  "p-6 rounded-2xl border-2 border-purple-200 shadow-lg bg-[linear-gradient(135deg,#ffeef8_0%,#f3e7fc_25%,#e7f0ff_50%,#e7fcf7_75%,#fff9e7_100%)]";

const sectionCard = "rounded-2xl border bg-white/95 p-5 shadow-sm";
const sectionHeader =
  "rounded-2xl border-2 border-black bg-white p-5 shadow mb-6";
const labelSm = "text-xs font-bold uppercase tracking-wide text-purple-700";
const inputCls =
  "w-full rounded-lg border px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

/* -------------------------------------------------------------------------- */
/* Cloud stub helpers (replace with real API later)                           */
/* -------------------------------------------------------------------------- */

const CLOUD_KEY = "cloud:app-settings.v1"; // demo only

async function backupToCloudStub(payload: AppSettings) {
  // TODO: swap with your DigitalOcean call
  await new Promise((r) => setTimeout(r, 350));
  localStorage.setItem(CLOUD_KEY, JSON.stringify(payload));
}

async function restoreFromCloudStub(): Promise<AppSettings | null> {
  await new Promise((r) => setTimeout(r, 350));
  try {
    const raw = localStorage.getItem(CLOUD_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

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
        palette: { from: "#c4b5fd", via: "#a5b4fc", to: "#86efac" },
        emailNotifications: false,
        notifyEmail: "",
        syncMode: "local",
      }),
    []
  );

  const [s, setS] = useState<AppSettings>(initial);
  const [busyCloud, setBusyCloud] = useState(false);

  /* -------------------------------- Actions -------------------------------- */

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
      const parsed = JSON.parse(text) as AppSettings;
      setS(parsed);
      setJSON(KEY, parsed);
      alert("Settings imported.");
    } catch {
      alert("Invalid JSON.");
    } finally {
      e.currentTarget.value = "";
    }
  }

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () =>
      setS((p) => ({ ...p, brandLogoDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(f);
  }

  async function backupToCloud() {
    try {
      setBusyCloud(true);
      const next = { ...s, lastCloudBackupAt: new Date().toISOString() };
      await backupToCloudStub(next);
      setS(next);
      setJSON(KEY, next);
      alert("Backed up to cloud (demo stub). Replace with your DO call.");
    } catch {
      alert("Cloud backup failed.");
    } finally {
      setBusyCloud(false);
    }
  }

  async function restoreFromCloud() {
    try {
      setBusyCloud(true);
      const remote = await restoreFromCloudStub();
      if (!remote) {
        alert("No cloud backup found.");
        return;
      }
      setS(remote);
      setJSON(KEY, remote);
      alert("Restored from cloud (demo stub).");
    } catch {
      alert("Cloud restore failed.");
    } finally {
      setBusyCloud(false);
    }
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className={wrapper}>
      {/* Header (premium) */}
      <div className={sectionHeader}>
        <div className="text-3xl font-extrabold">Settings</div>
        <div className="text-foreground/80 mt-1">
          Adjust system preferences and account details.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Preferences */}
        <div className={sectionCard}>
          <div className="text-xl font-extrabold mb-3">Preferences</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode */}
            <div>
              <div className={labelSm}>Mode</div>
              <select
                className={inputCls}
                value={s.mode}
                onChange={(e) =>
                  setS((p) => ({
                    ...p,
                    mode: e.target.value as AppSettings["mode"],
                  }))
                }
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Domain whitelist */}
            <div>
              <div className="flex items-center justify-between">
                <div className={labelSm}>Domain Whitelist</div>
                <div className="text-[11px] font-semibold text-foreground/70">
                  (Only these domains can embed your widget — comma-separated)
                </div>
              </div>
              <input
                className={inputCls}
                placeholder="example.com, anotherdomain.com"
                value={s.domain}
                onChange={(e) => setS((p) => ({ ...p, domain: e.target.value }))}
              />
            </div>

            {/* Language */}
            <div>
              <div className={labelSm}>Language</div>
              <select
                className={inputCls}
                value={s.language}
                onChange={(e) =>
                  setS((p) => ({
                    ...p,
                    language: e.target.value as AppSettings["language"],
                  }))
                }
              >
                <option value="English">English</option>
              </select>
            </div>

            {/* Default bot */}
            <div>
              <div className={labelSm}>Default Bot</div>
              <select
                className={inputCls}
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

          {/* Dark mode */}
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!s.darkMode}
              onChange={(e) => setS((p) => ({ ...p, darkMode: e.target.checked }))}
            />
            <span className="text-sm font-semibold">Dark Mode</span>
          </label>

          {/* Consent text */}
          <div className="mt-4">
            <div className={labelSm}>Consent / Disclaimer Text</div>
            <textarea
              className={inputCls}
              rows={3}
              value={s.consentText || ""}
              onChange={(e) => setS((p) => ({ ...p, consentText: e.target.value }))}
            />
          </div>
        </div>

        {/* Branding + Palette */}
        <div className={sectionCard}>
          <div className="text-xl font-extrabold mb-3">Branding & Palette</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logo */}
            <div className="md:col-span-1">
              <div className={labelSm}>Brand Logo</div>
              <div className="flex items-center gap-3">
                <label className="rounded-lg border px-3 py-2 font-semibold bg-white cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickLogo}
                  />
                </label>
                {s.brandLogoDataUrl && (
                  <button
                    className="rounded-lg border px-3 py-2 font-semibold bg-white"
                    onClick={() => setS((p) => ({ ...p, brandLogoDataUrl: undefined }))}
                  >
                    Clear
                  </button>
                )}
              </div>
              {s.brandLogoDataUrl && (
                <div className="mt-3">
                  <img
                    src={s.brandLogoDataUrl}
                    alt="Brand logo"
                    className="h-16 w-auto rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Palette */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className={labelSm}>Gradient From</div>
                <input
                  type="color"
                  className="h-10 w-full rounded-lg border"
                  value={s.palette?.from || "#c4b5fd"}
                  onChange={(e) =>
                    setS((p) => ({
                      ...p,
                      palette: { ...(p.palette || {}), from: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <div className={labelSm}>Gradient Via</div>
                <input
                  type="color"
                  className="h-10 w-full rounded-lg border"
                  value={s.palette?.via || "#a5b4fc"}
                  onChange={(e) =>
                    setS((p) => ({
                      ...p,
                      palette: { ...(p.palette || {}), via: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <div className={labelSm}>Gradient To</div>
                <input
                  type="color"
                  className="h-10 w-full rounded-lg border"
                  value={s.palette?.to || "#86efac"}
                  onChange={(e) =>
                    setS((p) => ({
                      ...p,
                      palette: { ...(p.palette || {}), to: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-foreground/70">
            These colors become the <strong>default gradient</strong> for new bots and headers.
          </div>
        </div>

        {/* Notifications */}
        <div className={sectionCard}>
          <div className="text-xl font-extrabold mb-3">Notifications</div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!s.emailNotifications}
              onChange={(e) =>
                setS((p) => ({ ...p, emailNotifications: e.target.checked }))
              }
            />
            <span className="text-sm font-semibold">
              Send email when a lead is captured
            </span>
          </label>

          <div className="mt-3 max-w-md">
            <div className={labelSm}>Notification Email</div>
            <input
              className={inputCls}
              placeholder="you@company.com"
              value={s.notifyEmail || ""}
              onChange={(e) =>
                setS((p) => ({ ...p, notifyEmail: e.target.value }))
              }
              disabled={!s.emailNotifications}
              title={
                s.emailNotifications ? "" : "Enable notifications to set an email"
              }
            />
          </div>
        </div>

        {/* Data Sync */}
        <div className={sectionCard}>
          <div className="text-xl font-extrabold mb-3">Data Sync</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className={labelSm}>Sync Mode</div>
              <select
                className={inputCls}
                value={s.syncMode || "local"}
                onChange={(e) =>
                  setS((p) => ({ ...p, syncMode: e.target.value as SyncMode }))
                }
              >
                <option value="local">Local (browser)</option>
                <option value="digitalocean">DigitalOcean (API)</option>
              </select>
              <div className="mt-2 text-xs text-foreground/70">
                Switching to DigitalOcean is a future-ready option; this demo uses local storage.
              </div>
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
              <button
                onClick={backupToCloud}
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40 disabled:opacity-60"
                disabled={busyCloud}
              >
                {busyCloud ? "Backing up…" : "Backup to Cloud"}
              </button>
              <button
                onClick={restoreFromCloud}
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40 disabled:opacity-60"
                disabled={busyCloud}
              >
                {busyCloud ? "Restoring…" : "Restore from Cloud"}
              </button>
              {s.lastCloudBackupAt && (
                <div className="ml-2 text-xs text-foreground/70">
                  Last backup: {new Date(s.lastCloudBackupAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className={sectionCard}>
          <div className="flex items-center gap-3">
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
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importJson}
              />
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
