// src/pages/admin/Knowledge.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore"; // ok if this already exists; we fall back if not
import { getBotSettings, BotKey } from "@/lib/botSettings"; // used only for types / mapping

type UploadItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: number;
  dataUrl: string; // base64 preview (demo storage)
};

// ---- Bot catalog (keys + human names) ----
const BOT_OPTIONS: { key: BotKey; label: string }[] = [
  { key: "LeadQualifier", label: "Lead Qualifier" },
  { key: "AppointmentBooking", label: "Appointment Booking" },
  { key: "CustomerSupport", label: "Customer Support" },
  { key: "Waitlist", label: "Waitlist" },
  { key: "SocialMedia", label: "Social Media" },
];

const lsKey = (bot: BotKey) => `knowledge:${bot}`;

// LocalStorage helpers
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

export default function Knowledge() {
  // try to respect your global store if present
  let storeBot: BotKey | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    storeBot = useAdminStore?.()!.currentBot as BotKey | undefined;
  } catch {
    /* ignore if store not wired */
  }

  const [bot, setBot] = useState<BotKey>(storeBot ?? "LeadQualifier");
  const [items, setItems] = useState<UploadItem[]>(() => loadForBot(storeBot ?? "LeadQualifier"));
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isBusy, setBusy] = useState(false);

  // Reload when bot changes or store changes
  useEffect(() => {
    setItems(loadForBot(bot));
  }, [bot]);

  // If global store bot changes externally, follow it
  useEffect(() => {
    if (storeBot && storeBot !== bot) setBot(storeBot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeBot]);

  const botLabel = useMemo(
    () => BOT_OPTIONS.find((b) => b.key === bot)?.label ?? bot,
    [bot]
  );

  const onSelectFiles = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const files = evt.target.files;
    if (!files || files.length === 0) return;

    setBusy(true);
    const newItems: UploadItem[] = [];

    // Convert files -> base64 DataURL (demo-only storage)
    for (const f of Array.from(files)) {
      const dataUrl = await fileToDataURL(f);
      newItems.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
        addedAt: Date.now(),
        dataUrl,
      });
    }

    const merged = [...items, ...newItems];
    setItems(merged);
    saveForBot(bot, merged);

    // reset input so the same file can be picked again later
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  };

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveForBot(bot, next);
  };

  const clearAll = () => {
    if (!confirm(`Remove all documents for "${botLabel}"?`)) return;
    setItems([]);
    saveForBot(bot, []);
  };

  const manageSources = () => {
    alert("Coming soon: connect Google Drive / Notion / URLs as external sources.");
  };

  const triggerUpload = () => fileRef.current?.click();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-extrabold">Knowledge</div>
          <div className="text-sm text-muted-foreground">
            Attach documents the bot can use to answer questions.
          </div>
        </div>

        {/* Bot picker */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Bot:</span>
          <select
            className="rounded-xl border bg-card px-3 py-2 text-sm font-bold shadow-sm"
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
      <section className="rounded-2xl border p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50">
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
              disabled={isBusy}
            >
              {isBusy ? "Uploading…" : "+ Upload"}
            </button>
            <button
              onClick={manageSources}
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/70 transition"
            >
              Manage Sources
            </button>
          </div>
        </div>

        {/* hidden input */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          hidden
          onChange={onSelectFiles}
        />
      </section>

      {/* List */}
      <section className="rounded-2xl border p-5 bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">Uploaded Documents — {botLabel}</h3>
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
                  {/* Download/preview (opens DataURL) */}
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

// Utility: file -> DataURL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
