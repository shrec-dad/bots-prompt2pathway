// src/components/KnowledgePanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { BotKey } from "@/lib/botSettings";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: number;
  dataUrl: string; // demo-only local storage
};

export const BOT_OPTIONS: { key: BotKey; label: string }[] = [
  { key: "LeadQualifier",       label: "Lead Qualifier" },
  { key: "AppointmentBooking",  label: "Appointment Booking" },
  { key: "CustomerSupport",     label: "Customer Support" },
  { key: "Waitlist",            label: "Waitlist" },
  { key: "SocialMedia",         label: "Social Media" },
];

const lsKey = (bot: BotKey) => `knowledge:${bot}`;

function loadForBot(bot: BotKey): UploadItem[] {
  try {
    const raw = localStorage.getItem(lsKey(bot));
    if (!raw) return [];
    return JSON.parse(raw) as UploadItem[];
  } catch {
    return [];
  }
}

function saveForBot(bot: BotKey, items: UploadItem[]) {
  localStorage.setItem(lsKey(bot), JSON.stringify(items));
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

export type KnowledgePanelProps = {
  /** If provided, the panel will manage docs for this bot. */
  bot?: BotKey;
  /** If true, shows a bot dropdown inside the panel and manages its own bot state. */
  showBotPicker?: boolean;
  /** Called when the internal picker changes bots. Ignored if showBotPicker = false. */
  onBotChange?: (bot: BotKey) => void;
  /** Optional custom title (defaults to "Knowledge"). */
  title?: string;
  /** Optional wrapper className. */
  className?: string;
};

export default function KnowledgePanel(props: KnowledgePanelProps) {
  // If no bot prop provided and no picker requested, try to follow the global store.
  let globalBot: BotKey | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    globalBot = useAdminStore?.()!.currentBot as BotKey | undefined;
  } catch { /* store not required */ }

  const [internalBot, setInternalBot] = useState<BotKey>(
    props.bot ?? globalBot ?? "LeadQualifier"
  );

  // Keep internal bot in sync with controlled prop
  useEffect(() => {
    if (props.bot && props.bot !== internalBot) setInternalBot(props.bot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.bot]);

  // Also follow global store when using neither prop nor picker
  useEffect(() => {
    if (!props.bot && !props.showBotPicker && globalBot && globalBot !== internalBot) {
      setInternalBot(globalBot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalBot]);

  const bot = internalBot;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<UploadItem[]>(() => loadForBot(bot));

  useEffect(() => {
    setItems(loadForBot(bot));
  }, [bot]);

  const botLabel = useMemo(
    () => BOT_OPTIONS.find(b => b.key === bot)?.label ?? bot,
    [bot]
  );

  const triggerUpload = () => fileRef.current?.click();

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBusy(true);
    const newOnes: UploadItem[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await fileToDataURL(f);
      newOnes.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
        addedAt: Date.now(),
        dataUrl,
      });
    }
    const merged = [...items, ...newOnes];
    setItems(merged);
    saveForBot(bot, merged);
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  };

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    saveForBot(bot, next);
  };

  const clearAll = () => {
    if (!confirm(`Remove all documents for "${botLabel}"?`)) return;
    setItems([]);
    saveForBot(bot, []);
  };

  return (
    <div className={props.className ?? ""}>
      {/* Header */}
      <div className="rounded-2xl border bg-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-extrabold">{props.title ?? "Knowledge"}</div>
          <div className="text-sm text-muted-foreground">
            Documents this bot can use to answer questions.
          </div>
        </div>

        {(props.showBotPicker || !props.bot) && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Bot:</span>
            <select
              className="rounded-xl border bg-card px-3 py-2 text-sm font-bold shadow-sm"
              value={bot}
              onChange={(e) => {
                const next = e.target.value as BotKey;
                setInternalBot(next);
                props.onBotChange?.(next);
              }}
            >
              {BOT_OPTIONS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Upload controls */}
      <section className="mt-4 rounded-2xl border p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold">Upload Documents</h3>
            <p className="text-sm text-muted-foreground">
              PDF, Word, Excel, or text. Stored locally for demo; backend wiring later.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={triggerUpload}
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/70 transition"
              disabled={busy}
            >
              {busy ? "Uploading…" : "+ Upload"}
            </button>
            <button
              onClick={() => alert("External sources (Drive/Notion/URLs) coming soon.")}
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/70 transition"
            >
              Manage Sources
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          hidden
          onChange={onFiles}
        />
      </section>

      {/* List */}
      <section className="mt-4 rounded-2xl border p-5 bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">Uploaded — {botLabel}</h3>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-xl px-3 py-2 text-sm font-bold ring-1 ring-border bg-white hover:bg-muted/70 transition"
              title="Remove all documents for this bot"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
            No documents yet. Click <span className="font-semibold">+ Upload</span> to add files for{" "}
            <span className="font-semibold">{botLabel}</span>.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border bg-white p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(f.size / 1024).toFixed(0)} KB • {new Date(f.addedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={f.dataUrl}
                    download={f.name}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl px-3 py-2 text-sm font-bold ring-1 ring-border bg-white hover:bg-muted/70 transition"
                  >
                    Preview
                  </a>
                  <button
                    onClick={() => removeItem(f.id)}
                    className="rounded-xl px-3 py-2 text-sm font-bold ring-1 ring-border bg-white hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
