// src/pages/admin/Knowledge.tsx
import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

export default function Knowledge() {
  const { knowledge, addKnowledgeDoc, removeKnowledgeDoc } = useAdminStore();

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const ext = f.name.toLowerCase().split(".").pop() || "";
      const type =
        ext === "pdf" ? "PDF" : ext === "xlsx" || ext === "xls" ? "Excel" : "Word";
      addKnowledgeDoc({
        id: `${Date.now()}_${f.name}`,
        name: f.name,
        type: type as any,
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        uploadedAt: "just now",
      });
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-3xl font-extrabold tracking-tight">Knowledge</h1>
        <p className="mt-2 text-muted-foreground">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to
          answer questions.
        </p>
      </div>

      {/* Upload Section — DARKER pastel like bot cards */}
      <div className="mt-6 rounded-2xl border bg-gradient-to-br from-violet-200 via-rose-200 to-emerald-200 p-6 shadow-md ring-1 ring-black/10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-lg font-bold text-gray-900">Upload Documents</div>
            <div className="text-gray-800/80">
              PDF, Word, Excel (placeholder only — wiring later).
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-xl border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-white">
              + Upload
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                multiple
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
            </label>

            <button
              type="button"
              disabled
              title="Coming soon"
              className="rounded-xl border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-foreground shadow-sm disabled:opacity-80"
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded docs container (white card) */}
      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="mb-3">
          <div className="text-lg font-bold">Uploaded Documents</div>
          <div className="text-muted-foreground">Static mock data persisted locally.</div>
        </div>

        {knowledge.length === 0 ? (
          <div className="rounded-xl border bg-gradient-to-r from-amber-100 via-sky-100 to-violet-100 p-6 text-gray-800">
            No documents yet. Use <span className="font-semibold">+ Upload</span> to add
            PDF/Word/Excel.
          </div>
        ) : (
          <ul className="divide-y">
            {knowledge.map((d) => (
              <li
                key={d.id}
                className="flex flex-col items-start justify-between gap-3 py-4 md:flex-row md:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br from-violet-200 via-rose-200 to-emerald-200 text-lg">
                    {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                  </span>
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {d.type} • {d.size} • {d.uploadedAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="rounded-lg border bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm disabled:opacity-60"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => removeKnowledgeDoc(d.id)}
                    className="rounded-lg border bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
