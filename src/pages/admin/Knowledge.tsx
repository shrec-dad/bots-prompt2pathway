// src/pages/admin/Knowledge.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { BotKey } from "@/lib/botSettings";

/** -----------------------------------------------------------------------
 *  Config
 *  ---------------------------------------------------------------------*/
type DocFile = {
  id: string;
  name: string;
  size: number; // bytes
  type: string;
  dataUrl: string; // for preview/download (simple local prototype)
  uploadedAt: number;
};

const BOT_OPTIONS: Array<{ key: BotKey; label: string }> = [
  { key: "LeadQualifier",      label: "Lead Qualifier" },
  { key: "AppointmentBooking", label: "Appointment Booking" },
  { key: "CustomerSupport",    label: "Customer Support" },
  { key: "Waitlist",           label: "Waitlist" },
  { key: "SocialMedia",        label: "Social Media" },
];

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain";

/** -----------------------------------------------------------------------
 *  Small helpers for per-bot persistence
 *  ---------------------------------------------------------------------*/
const storeKey = (bot: BotKey) => `knowledge:${bot}`;

function loadDocs(bot: BotKey): DocFile[] {
  try {
    const raw = localStorage.getItem(storeKey(bot));
    return raw ? (JSON.parse(raw) as DocFile[]) : [];
  } catch {
    return [];
  }
}

function saveDocs(bot: BotKey, docs: DocFile[]) {
  localStorage.setItem(storeKey(bot), JSON.stringify(docs));
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** -----------------------------------------------------------------------
 *  Page
 *  ---------------------------------------------------------------------*/
export default function Knowledge() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pull currentBot from your admin store; also allow switching here
  const { currentBot, setCurrentBot } = useAdminStore() as {
    currentBot: BotKey;
    setCurrentBot?: (key: BotKey) => void;
  };

  // Fallback if store lacks a setter or current value
  const initialBot = useMemo<BotKey>(
    () => currentBot || BOT_OPTIONS[0].key,
    [currentBot]
  );

  const [bot, setBot] = useState<BotKey>(initialBot);
  const [docs, setDocs] = useState<DocFile[]>(() => loadDocs(initialBot));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep store and local state in sync when the picker changes
  useEffect(() => {
    if (bot !== currentBot && setCurrentBot) setCurrentBot(bot);
    setDocs(loadDocs(bot));
  }, [bot]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the store changes externally, refresh
  useEffect(() => {
    if (currentBot && currentBot !== bot) {
      setBot(currentBot);
      setDocs(loadDocs(currentBot));
    }
  }, [currentBot]); // eslint-disable-line react-hooks/exhaustive-deps

  async function triggerUpload() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setBusy(true);
      const additions: DocFile[] = [];
      for (const f of files) {
        // Simple 10 MB guard to avoid blowing up localStorage
        if (f.size > 10 * 1024 * 1024) {
          setError(`"${f.name}" is larger than 10 MB. Please upload a smaller file.`);
          continue;
        }
        const dataUrl = await readFileAsDataURL(f);
        additions.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: f.name,
          size: f.size,
          type: f.type || "application/octet-stream",
          dataUrl,
          uploadedAt: Date.now(),
        });
      }

      if (additions.length) {
        const next = [...docs, ...additions];
        setDocs(next);
        saveDocs(bot, next);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeDoc(id: string) {
    const next = docs.filter((d) => d.id !== id);
    setDocs(next);
    saveDocs(bot, next);
  }

  return (
    <div className="space-y-6">
      {/* Header / Bot picker */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Knowledge</h1>
            <p className="text-sm text-foreground/70">
              Upload product guides, pricing, policies, FAQs — your bot will use these to answer customer questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase text-foreground/70">Bot</label>
            <select
              className="rounded-lg border px-3 py-2 font-semibold bg-white"
              value={bot}
              onChange={(e) => setBot(e.target.value as BotKey)}
            >
              {BOT_OPTIONS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload row */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold">Upload Documents</div>
              <div className="text-sm text-foreground/70">
                PDF, Word, Excel, or plain text. Files are stored locally per bot for this prototype.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                hidden
                onChange={onFilesChosen}
              />
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/15 to-emerald-500/15 hover:from-indigo-500/25 hover:to-emerald-500/25 disabled:opacity-60"
                onClick={triggerUpload}
                disabled={busy}
              >
                + Upload
              </button>
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border hover:bg-muted/40"
                onClick={() => alert("Source management UI coming soon.")}
              >
                Manage Sources
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Uploaded list */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="p-5 border-b bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl">
          <div className="text-xl font-extrabold">Uploaded Documents</div>
          <div className="text-sm text-foreground/70">
            Stored for <span className="font-semibold">{BOT_OPTIONS.find((b) => b.key === bot)?.label}</span>.
          </div>
        </div>

        <div className="p-5">
          {docs.length === 0 ? (
            <div className="rounded-xl border bg-muted/10 px-4 py-6 text-sm text-foreground/70">
              No documents yet. Use <span className="font-semibold">+ Upload</span> to add PDF/Word/Excel.
            </div>
          ) : (
            <ul className="space-y-3">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 bg-white hover:bg-muted/20"
                >
                  <a
                    className="min-w-0 flex-1 truncate font-semibold hover:underline"
                    href={d.dataUrl}
                    download={d.name}
                    title="Click to download"
                  >
                    {d.name}
                    <span className="ml-2 text-xs font-normal text-foreground/60">
                      • {formatSize(d.size)}
                    </span>
                  </a>

                  <button
                    className="rounded-lg px-3 py-1.5 font-bold ring-1 ring-border hover:bg-muted/40"
                    onClick={() => removeDoc(d.id)}
                    aria-label={`Remove ${d.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
