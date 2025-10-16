import React, { useEffect, useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { BotKey } from "@/lib/botSettings";
import BotSelector from "@/components/BotSelector";

/* THEME imports (single source of truth) */
import {
  DEFAULT_PALETTE,
  applyTheme,
  savePalette,
  loadPalette,
  resetPalette,
} from "@/lib/theme";

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

  // branding
  brandLogoDataUrl?: string;

  // notifications
  emailNotifications?: boolean;
  notifyEmail?: string;

  // palette used as defaults/new-bot seed (mirrors platform theme)
  palette?: {
    from: string;
    via: string;
    to: string;
  };

  // data sync
  syncMode?: SyncMode;

  // internal: last cloud backup ISO timestamp
  lastCloudBackupAt?: string;
};

const GLOBAL_KEY = "app:settings";
const INST_KEY = (instId: string) => `app:settings:inst:${instId}`;

/* -------------------------------------------------------------------------- */
/* UI helpers                                                                 */
/* -------------------------------------------------------------------------- */

/* page wrapper (keep your pastel gradient) */
const wrapper =
  "p-6 rounded-2xl border-2 border-purple-200 shadow-lg bg-[linear-gradient(135deg,#ffeef8_0%,#f3e7fc_25%,#e7f0ff_50%,#e7fcf7_75%,#fff9e7_100%)] space-y-6";

/* strong cards + header */
const sectionCard =
  "rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]";
const sectionHeader =
  "rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)] mb-6";

/* stripes & inputs */
const labelSm =
  "text-xs font-bold uppercase tracking-wide text-purple-700";
const inputCls =
  "w-full rounded-lg border px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

/* -------------------------------------------------------------------------- */
/* Cloud stub helpers (replace with real API later)                           */
/* -------------------------------------------------------------------------- */

const CLOUD_KEY = (scopeKey: string) => `cloud:${scopeKey}.v1`; // demo only

async function backupToCloudStub(scopeKey: string, payload: AppSettings) {
  await new Promise((r) => setTimeout(r, 350));
  localStorage.setItem(CLOUD_KEY(scopeKey), JSON.stringify(payload));
}

async function restoreFromCloudStub(scopeKey: string): Promise<AppSettings | null> {
  await new Promise((r) => setTimeout(r, 350));
  try {
    const raw = localStorage.getItem(CLOUD_KEY(scopeKey));
    return raw ? (JSON.parse(raw) as AppSettings) : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Small guards/utilities                                                     */
/* -------------------------------------------------------------------------- */

function normalizeInstId(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "id" in (val as any)) {
    const id = (val as any).id;
    return typeof id === "string" ? id : String(id ?? "");
  }
  return "";
}

function activeStorageKey(instId: string): string {
  return instId ? INST_KEY(instId) : GLOBAL_KEY;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function Settings() {
  /** Scope picker (empty string = Global) */
  const [instId, setInstId] = useState<string>("");

  /** Load initial from global; subsequent loads will re-read by scope */
  const initial = useMemo<AppSettings>(
    () =>
      getJSON<AppSettings>(GLOBAL_KEY, {
        mode: "basic",
        domain: "",
        language: "English",
        darkMode: false,
        defaultBot: "Waitlist",
        consentText:
          "By continuing, you agree to our Terms and Privacy Policy.",
        palette: { ...DEFAULT_PALETTE },
        emailNotifications: false,
        notifyEmail: "",
        syncMode: "local",
      }),
    []
  );

  const [s, setS] = useState<AppSettings>(initial);
  const [busyCloud, setBusyCloud] = useState(false);

  /** Apply platform theme on first mount and whenever palette changes */
  useEffect(() => {
    const p = s.palette ?? DEFAULT_PALETTE;
    applyTheme(p);
  }, [s.palette]);

  /** Reload settings whenever scope changes */
  useEffect(() => {
    const key = activeStorageKey(instId);
    const next = getJSON<AppSettings>(key, s);
    setS(next);
  }, [instId]);

  /* -------------------------------- Actions -------------------------------- */

  function save() {
    const key = activeStorageKey(instId);
    setJSON(key, s);

    if (s.palette) savePalette(s.palette);
    alert(`Settings saved to ${instId ? `Instance ${instId}` : "Global"}.`);
  }

  function resetAll() {
    if (!confirm("Clear ALL local settings/data? This is not reversible.")) return;
    localStorage.clear();
    alert("Local data cleared. Refresh the page.");
  }

  function exportJson() {
    const scopeLabel = instId ? `instance-${instId}` : "global";
    const blob = new Blob([JSON.stringify(s, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-settings-${scopeLabel}.json`;
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
      const key = activeStorageKey(instId);
      setJSON(key, parsed);
      if (parsed.palette) savePalette(parsed.palette);
      alert(`Settings imported to ${instId ? `Instance ${instId}` : "Global"}.`);
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
      const key = activeStorageKey(instId);
      const next = { ...s, lastCloudBackupAt: new Date().toISOString() };
      await backupToCloudStub(key, next);
      setS(next);
      setJSON(key, next);
      alert(
        `Backed up ${instId ? `Instance ${instId}` : "Global"} to cloud (demo stub).`
      );
    } catch {
      alert("Cloud backup failed.");
    } finally {
      setBusyCloud(false);
    }
  }

  async function restoreFromCloud() {
    try {
      setBusyCloud(true);
      const key = activeStorageKey(instId);
      const remote = await restoreFromCloudStub(key);
      if (!remote) {
        alert("No cloud backup found for this scope.");
        return;
      }
      setS(remote);
      setJSON(key, remote);
      if (remote.palette) savePalette(remote.palette);
      alert("Restored from cloud (demo stub).");
    } catch {
      alert("Cloud restore failed.");
    } finally {
      setBusyCloud(false);
    }
  }

  function resetPlatformGradient() {
    const next = { ...DEFAULT_PALETTE };
    setS((p) => ({ ...p, palette: next }));
    savePalette(next);
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className={wrapper}>
      {/* Header with Scope Picker */}
      <div className={sectionHeader}>
        {/* header stripe */}
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-extrabold">Settings</div>
            <div className="text-foreground/80 mt-1">
              Adjust system preferences and account details.
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-purple-700">
              Scope
            </div>
            <div className="min-w-[260px]">
              <BotSelector
                scope="instance"
                value={instId}
                onChange={(val) => setInstId(normalizeInstId(val))}
                placeholderOption="All (Global)"
              />
            </div>
            {!!instId && (
              <button
                className="rounded-lg border px-3 py-2 font-semibold bg-white hover:bg-muted/40"
                onClick={() => setInstId("")}
                title="Clear instance — back to Global"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold bg-white">
            Viewing: {instId ? `Instance ${instId}` : "Global"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Preferences */}
        <div className={sectionCard}>
          {/* header stripe */}
          <div className="h-2 rounded-md bg-black mb-4" />
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

            {/* Default bot via BotSelector */}
            <div>
              <div className={labelSm}>Default Bot</div>
              <BotSelector
                scope="template"
                value={s.defaultBot || ""}
                onChange={(key) => setS((p) => ({ ...p, defaultBot: key as BotKey }))}
              />
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
          {/* header stripe */}
          <div className="h-2 rounded-md bg-black mb-4" />
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
                  value={s.palette?.from || DEFAULT_PALETTE.from}
                  onChange={(e) => {
                    const next = { ...(s.palette || DEFAULT_PALETTE), from: e.target.value };
                    setS((p) => ({ ...p, palette: next }));
                    savePalette(next);
                  }}
                />
              </div>
              <div>
                <div className={labelSm}>Gradient Via</div>
                <input
                  type="color"
                  className="h-10 w-full rounded-lg border"
                  value={s.palette?.via || DEFAULT_PALETTE.via}
                  onChange={(e) => {
                    const next = { ...(s.palette || DEFAULT_PALETTE), via: e.target.value };
                    setS((p) => ({ ...p, palette: next }));
                    savePalette(next);
                  }}
                />
              </div>
              <div>
                <div className={labelSm}>Gradient To</div>
                <input
                  type="color"
                  className="h-10 w-full rounded-lg border"
                  value={s.palette?.to || DEFAULT_PALETTE.to}
                  onChange={(e) => {
                    const next = { ...(s.palette || DEFAULT_PALETTE), to: e.target.value };
                    setS((p) => ({ ...p, palette: next }));
                    savePalette(next);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-4">
            <div className="text-xs text-foreground/70 mb-2">
              These colors become the <strong>default gradient</strong> for new bots and headers.
              Text color adjusts automatically for readability.
            </div>

            <div
              className="rounded-xl px-4 py-3 font-extrabold text-center shadow"
              style={{
                background:
                  "linear-gradient(90deg, var(--grad-from), var(--grad-via), var(--grad-to))",
                color: "var(--grad-text)",
              }}
            >
              Live Preview — Auto-contrast text
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const current = loadPalette();
                  setS((p) => ({ ...p, palette: current }));
                  applyTheme(current);
                }}
                className="rounded-xl px-3 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
              >
                Use Saved Theme
              </button>

              <button
                onClick={resetPlatformGradient}
                className="rounded-xl px-3 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                title="Revert to the platform’s default colors"
              >
                Reset to Platform Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={sectionCard}>
          {/* header stripe */}
          <div className="h-2 rounded-md bg-black mb-4" />
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
          {/* header stripe */}
          <div className="h-2 rounded-md bg-black mb-4" />
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
          {/* header stripe */}
          <div className="h-2 rounded-md bg-black mb-4" />
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl px-4 py-2 font-bold text-[var(--grad-text)] shadow-[0_3px_0_#000]"
              style={{
                background:
                  "linear-gradient(90deg, var(--grad-from), var(--grad-via), var(--grad-to))",
              }}
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

