import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocs, addDoc, deleteDoc } from '@/store/docsSlice';
import { fetchBots } from '@/store/botsSlice';
import { fetchInstances } from '@/store/botInstancesSlice';
import { RootState } from '@/store';
import BotSelector from "@/components/BotSelector";

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** -----------------------------------------------------------------------
 *  Page
 *  ---------------------------------------------------------------------*/
export default function Knowledge() {
  const dispatch = useDispatch();
  const docs = useSelector((state: RootState) => state.docs.list);
  const bots = useSelector((state: RootState) => state.bots.list);
  const instances = useSelector((state: RootState) => state.instances.list);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchInstances());
  }, [dispatch]);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [kind, setKind] = useState<string>("bot");

  useEffect(() => {
    if (selectedId) dispatch(fetchDocs(selectedId));
  }, [selectedId]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Upload handlers ----------
  function triggerUpload() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!selectedId) return;

    try {
      setBusy(true);
      const file = files[0];
  
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" is larger than 10 MB. Please upload a smaller file.`);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("botId", selectedId || "");
      formData.append("botModelType", kind === "bot" ? "Bot" : "BotInstance");
      formData.append("name", file.name);
      formData.append("size", file.size.toString());

      await dispatch(addDoc(formData)).unwrap();

      dispatch(fetchDocs(selectedId));
    } catch (err: any) {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeDoc(id: string) {
    try {
      await dispatch(deleteDoc(id)).unwrap();
      dispatch(fetchDocs(selectedId));
    } catch (err: any) {
      setError("Delete file failed.");
    }
  }

  // ---------- UI helpers ----------
  const scopeLabel =
    kind === "bot"
      ? bots.find((m) => m._id === selectedId)?.name
      : instances.find((m) => m._id === selectedId)?.name || "(deleted instance)";

  const selectedInstLabel =
    kind === "inst"
      ? instances.find((m) => m._id === selectedId)?.name || "Select an instance"
      : "";
      
  const downloadFromCloudinary = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header / Pickers */}
      <div className="rounded-2xl border-[3px] border-black/80 bg-white shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        {/* header stripe */}
        <div className="h-2 rounded-md bg-black mx-5 mt-5 mb-4" />
        <div className="gap-4 p-5 border-b" style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}>
          <div className="mb-3">
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
                    name="kind"
                    checked={kind === "bot"}
                    onChange={() => {
                      const first = bots[0];
                      setKind("bot")
                      setSelectedId(first ? first._id : "");
                    }}
                  />
                  Bot Template
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="kind"
                    checked={kind === "inst"}
                    onChange={() => {
                      const first = instances[0];
                      setKind("inst");
                      setSelectedId(first ? first._id : "");
                    }}
                  />
                  Client Bot (instance)
                </label>
              </div>
            </div>

            {/* Bot template picker (BotSelector) */}
            {kind === "bot" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase text-foreground/70">Bot</label>
                <BotSelector
                  scope="template"
                  templates={bots}
                  instances={instances}
                  value={selectedId}
                  onChange={(v) => {
                    if (!v || v.kind !== "template") return;
                    setSelectedId(v.id);
                  }}
                  ariaLabel="Choose bot template"
                />
              </div>
            )}

            {/* Instance picker (with wrapped label UI preserved) */}
            {kind === "inst" && (
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
                    templates={bots}
                    instances={instances}
                    value={selectedId}
                    onChange={(v) => {
                      console.log(v);
                      if (!v) return;
                      if (v.kind === "instance") {
                        setSelectedId(v.id);
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
                disabled={busy || !selectedId}
              >
                + Upload
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
      <div className="rounded-2xl border-[3px] border-black/80 bg-white shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        {/* header stripe */}
        <div className="h-2 rounded-md bg-black mx-5 mt-5 mb-4" />
        <div className="p-5 border-b rounded-t-2xl" style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}>
          <div className="text-xl font-extrabold">Uploaded Documents</div>
          <div className="text-sm text-foreground/70">
            Stored for <span className="font-semibold">{scopeLabel}</span>.
          </div>
        </div>

        <div className="p-5">
          {docs.length === 0 ? (
            <div className="rounded-xl border-[3px] border-black/20 bg-muted/10 px-4 py-6 text-sm text-foreground/70">
              No documents yet. Use <span className="font-semibold">+ Upload</span> to add PDF/Word/Excel.
            </div>
          ) : (
            <ul className="space-y-3">
              {docs.map((d) => (
                <li
                  key={d._id}
                  className="flex items-center justify-between gap-3 rounded-xl border-[3px] border-black/20 px-4 py-3 bg-white hover:bg-muted/20"
                >
                  <a
                    className="min-w-0 flex-1 truncate font-semibold hover:underline cursor-pointer"
                    onClick={() => downloadFromCloudinary(d.url, d.name)}
                    title="Click to download"
                  >
                    {d.name}
                    <span className="ml-2 text-xs font-normal text-foreground/60">
                      • {formatSize(d.size)}
                    </span>
                  </a>

                  <button
                    className="rounded-lg px-3 py-1.5 font-bold ring-1 ring-border hover:bg-muted/40"
                    onClick={() => removeDoc(d._id)}
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
