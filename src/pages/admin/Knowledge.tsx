// src/pages/admin/Knowledge.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { BotKey } from "@/lib/botSettings";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import BotSelector from "@/components/BotSelector";

/** -----------------------------------------------------------------------
 *  Types & Config
 *  ---------------------------------------------------------------------*/
type DocFile = {
  id: string;
  name: string;
  size: number; // bytes
  type: string;
  dataUrl: string; // for preview/download (simple local prototype)
  uploadedAt: number;
};

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain";

/** -----------------------------------------------------------------------
 *  Storage helpers
 *  ---------------------------------------------------------------------*/
type Scope = { kind: "bot"; bot: BotKey } | { kind: "inst"; id: string };

const keyForScope = (s: Scope) =>
  s.kind === "bot" ? `knowledge:bot:${s.bot}` : `knowledge:inst:${s.id}`;

function loadDocs(scope: Scope): DocFile[] {
  try {
    const raw = localStorage.getItem(keyForScope(scope));
    return raw ? (JSON.parse(raw) as DocFile[]) : [];
  } catch {
    return [];
  }
}

function saveDocs(scope: Scope, docs: DocFile[]) {
  localStorage.setItem(keyForScope(scope), JSON.stringify(docs));
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

function instanceLabel(m: InstanceMeta) {
  return `${m.name || `${m.bot} Instance`} • ${m.mode}`;
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

  // Instances for label helper (purely for UX text); live-sync via storage
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

  // ---------- Scope state ----------
  const initialBot = useMemo<BotKey>(() => currentBot || ("Waitlist" as BotKey), [currentBot]);

  const [lastInstId, setLastInstId] = useState<string>(() => {
    const first = listInstances()[0];
    return first ? first.id : "";
  });

  const [scope, setScope] = useState<Scope>({ kind: "bot", bot: initialBot });

  // Docs list for the current scope
  const [docs, setDocs] = useState<DocFile[]>(() => loadDocs(scope));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep store and local docs in sync when scope changes
  useEffect(() => {
    if (scope.kind === "bot" && scope.bot !== currentBot && setCurrentBot) {
      setCurrentBot(scope.bot);
    }
    setDocs(loadDocs(scope));
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the store changes externally, refresh only when in bot mode
  useEffect(() => {
    if (scope.kind === "bot" && currentBot && currentBot !== scope.bot) {
      setScope({ kind: "bot", bot: currentBot });
      setDocs(loadDocs({ kind: "bot", bot: currentBot }));
    }
  }, [currentBot]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Upload handlers ----------
  function triggerUpload() {
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
        saveDocs(scope, next);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeDoc(id: string) {
    const next = docs.filter((d) => d.id !== id);
    setDocs(next);
    saveDocs(scope, next);
  }

  // ---------- UI helpers ----------
  const selectedInst =
    scope.kind === "inst" ? instances.find((m) => m.id === scope.id) : undefined;

  const scopeLabel =
    scope.kind === "bot"
      ? scope.bot
      : selectedInst?.name || "(deleted instance)";

  const instanceOptions = instances
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const selectedInstLabel =
    scope.kind === "inst"
      ? instanceOptions.find((m) => m.id === scope.id)
        ? instanceLabel(instanceOptions.find((m) => m.id === scope.id) as InstanceMeta)
        : "Select an instance"
      : "";

  return (
    <div className="space-y-6">
      {/* Header / Pickers */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Knowledge</h1>
            <p className="text-sm text-foreground/70">
              Upload product guides, pricing, policies, FAQs — your bot will use these to answer customer questions.
            </p>
          </div>

          {/* Scope selector */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase text-foreground/70">Scope</label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope.kind === "bot"}
                    onChange={() =>
                      setScope({
                        kind: "bot",
                        bot: scope.kind === "bot" ? scope.bot : (currentBot || "Waitlist"),
                      })
                    }
                  />
                  Bot Template
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope.kind === "inst"}
                    onChange={() => {
                      const first = instances[0];
                      const nextId = lastInstId || (first ? first.id : "");
                      setScope({ kind: "inst", id: nextId });
                    }}
                  />
                  Client Bot (instance)
                </label>
              </div>
            </div>

            {/* Bot template picker (BotSelector) */}
            {scope.kind === "bot" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase text-foreground/70">Bot</label>
                <BotSelector
                  scope="template"
                  value={scope.bot}
                  onChange={(v) => {
                    if (!v || v.kind !== "template") return;
                    setScope({ kind: "bot", bot: v.key as BotKey });
                  }}
                  ariaLabel="Choose bot template"
                />
              </div>
            )}

            {/* Instance picker (with wrapped label UI preserved) */}
            {scope.kind === "inst" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase text-foreground/70">My Bot</label>
                <div className="relative w-full md:w-[380px]">
                  <div
                    className="
                      rounded-lg border bg-white pr-10 px-3 py-2
                      font-semibold leading-snug
                      whitespace-normal break-words
                      min-h-[42px]
                    "
                  >
                    {instances.length === 0
                      ? "No instances yet — duplicate or create one first"
                      : selectedInstLabel}
                  </div>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-foreground/70">
                    ▾
                  </span>

                  {/* Real select via BotSelector (instance scope) */}
                  <BotSelector
                    scope="instance"
                    value={scope.kind === "inst" ? scope.id : ""}
                    onChange={(v) => {
                      if (!v) return;
                      if (v.kind === "instance") {
                        setLastInstId(v.id);
                        setScope({ kind: "inst", id: v.id });
                      }
                    }}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    ariaLabel="Choose client bot instance"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload row */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold">Upload Documents</div>
              <div className="text-sm text-foreground/70">
                PDF, Word, Excel, or plain text. Files are stored locally <b>per selected scope</b>.
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
                disabled={busy || (scope.kind === "inst" && !scope.id)}
              >
                + Upload
              </button>
              {/* Removed “Manage Sources” button */}
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
            Stored for <span className="font-semibold">{scopeLabel}</span>.
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
