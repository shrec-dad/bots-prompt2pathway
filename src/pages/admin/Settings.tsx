// src/pages/admin/Settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { BotKey } from "@/lib/botSettings";
import BotSelector from "@/components/BotSelector";

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

  // palette (used as defaults when creating bots/instances) + platform theme
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

/** Global key + per-instance variant */
const GLOBAL_KEY = "app:settings";
const INST_KEY = (instId: string) => `app:settings:inst:${instId}`;

/* -------------------------------------------------------------------------- */
/* Platform theme helpers (live preview + auto-contrast text)                 */
/* -------------------------------------------------------------------------- */

// Current platform "default" gradient (matches what you’re using today)
const DEFAULT_PLATFORM_GRADIENT = {
  from: "#a855f7", // purple-500-ish
  via: "#6366f1",  // indigo-500-ish
  to: "#14b8a6",   // teal-500-ish
};

// Simple relative luminance
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L;
}

// Choose white or black for maximum contrast against a gradient.
// We average the luminance of the three stops; if it's dark → use white text.
function pickReadableText(from: string, via: string, to: string): "#000000" | "#ffffff" {
  const avgL = (luminance(from) + luminance(via) + luminance(to)) / 3;
  return avgL < 0.5 ? "#ffffff" : "#000000";
}

// Apply variables to :root so the whole app can style with them.
function applyPlatformGradient(palette: { from: string; via: string; to: string }) {
  const root = document.documentElement;
  root.style.setProperty("--brand-from", palette.from);
  root.style.setProperty("--brand-via", palette.via);
  root.style.setProperty("--brand-to", palette.to);

  const fg = pickReadableText(palette.from, palette.via, palette.to);
  root.style.setProperty("--brand-fg-strong", fg);

  // Optional: bold on brand text everywhere we use the var.
  // (Components can simply use font-semibold/extrabold; this keeps it simple.)
}

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
        // Default palette matches current platform colors.
        palette: { ...DEFAULT_PLATFORM_GRADIENT },
        emailNotifications: false,
        notifyEmail: "",
        syncMode: "local",
      }),
    []
  );

  const [s, setS] = useState<AppSettings>(initial);
  const [busyCloud, setBusyCloud] = useState(false);

  /** Apply palette live to the platform (auto text color) */
  useEffect(() => {
    const p = s.palette ?? DEFAULT_PLATFORM_GRADIENT;
    applyPlatformGradient(p);
  }, [s.palette]);

  /** Reload settings whenever scope changes */
  useEffect(() => {
    const key = activeStorageKey(instId);
    const next = getJSON<AppSettings>(key, s); // fall back to current to avoid flicker
    setS(next);
  }, [instId]);

  /* -------------------------------- Actions -------------------------------- */

  function save() {
    const key = activeStorageKey(instId);
    setJSON(key, s);
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
        `Backed up ${instId ? `Instance ${instId}` : "Global"} to cloud (demo stub). Replace with your DO call.`
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
      alert("Restored from cloud (demo stub).");
    } catch {
      alert("Cloud restore failed.");
    } finally {
      setBusyCloud(false);
    }
  }

  /* Convenience: reset just the gradient to the current platform defaults */
  function resetPlatformGradient() {
    setS((p) => ({
      ...p,
      palette: { ...DEFAULT_PLATFORM_GRADIENT },
    }));
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className={wrapper}>
      {/* Header with Scope Picker */}
      <div className={sectionHeader}>
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
                  value={s.palette?.from || DEFAULT_PLATFORM_GRADIENT.from}
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
                  value={s.palette?.via || DEFAULT_PLATFORM_GRADIENT.via}
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
                  value={s.palette?.to || DEFAULT_PLATFORM_GRADIENT.to}
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

          {/* Live preview bar that uses the CSS vars + auto text color */}
          <div className="mt-4">
            <div className="text-xs text-foreground/70 mb-2">
              These colors become the <strong>default gradient</strong> for new bots and headers.
              Text color adjusts automatically for readability.
            </div>

            <div
              className="rounded-xl px-4 py-3 font-extrabold text-center shadow"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-from), var(--brand-via), var(--brand-to))",
                color: "var(--brand-fg-strong)",
              }}
            >
              Live Preview — Auto-contrast text
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={resetPlatformGradient}
                className="rounded-xl px-3 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                title="Revert to the current platform’s default colors"
              >
                Reset to Platform Defaults
              </button>
            </div>
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
              className="rounded-xl px-4 py-2 font-bold text-[var(--brand-fg-strong)] shadow-[0_3px_0_#000]"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-from), var(--brand-via), var(--brand-to))",
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
