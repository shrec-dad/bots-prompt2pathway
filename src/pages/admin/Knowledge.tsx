// src/pages/admin/Knowledge.tsx
import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

type DocType = "PDF" | "Word" | "Excel";

export default function Knowledge() {
  const { knowledge = [], addKnowledgeDoc, removeKnowledgeDoc } = useAdminStore();

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const ext = f.name.toLowerCase().split(".").pop() || "";
      const type: DocType =
        ext === "pdf" ? "PDF" : ext === "xlsx" || ext === "xls" || ext === "csv" ? "Excel" : "Word";

      // ✅ Backticks fixed + size label as a string to avoid TS shape mismatches
      const sizeKb = Math.max(1, Math.round(f.size / 1024));
      addKnowledgeDoc({
        id: `${Date.now()}_${f.name}`,
        name: f.name,
        type,
        size: `${sizeKb} KB`,
        uploadedAt: "just now",
      } as any);
    });
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border-2 border-black p-6 bg-white shadow">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Knowledge</h1>
        <p className="mt-2 text-black">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer questions.
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl border-2 border-black p-6 bg-gradient-to-br from-violet-200 via-rose-200 to-emerald-200 shadow">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-lg font-bold text-black">Upload Documents</div>
            <div className="text-black">PDF, Word, Excel (placeholder only — wiring later).</div>
          </div>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow hover:bg-gray-100">
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
              className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow disabled:opacity-80"
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="rounded-xl border-2 border-black p-6 bg-white shadow">
        <div className="mb-3">
          <div className="text-lg font-bold text-black">Uploaded Documents</div>
          <div className="text-black">Static mock data persisted locally.</div>
        </div>

        {knowledge.length === 0 ? (
          <div className="rounded-lg border-2 border-black p-6 bg-gradient-to-r from-amber-200 via-sky-200 to-violet-200">
            <p className="text-black">
              No documents yet. Use <span className="font-bold">+ Upload</span> to add PDF/Word/Excel.
            </p>
          </div>
        ) : (
          <ul className="divide-y-2 divide-black/20">
            {knowledge.map((d: any) => (
              <li
                key={d.id}
                className="flex flex-col items-start justify-between gap-3 py-4 md:flex-row md:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-gradient-to-br from-violet-200 via-rose-200 to-emerald-200 text-lg">
                    {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                  </span>
                  <div>
                    <div className="font-bold text-black">{d.name}</div>
                    <div className="text-sm text-black">
                      {d.type} • {d.size} • {d.uploadedAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="rounded-md border-2 border-black bg-white px-3 py-1.5 text-sm font-bold text-black shadow disabled:opacity-70"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => removeKnowledgeDoc(d.id)}
                    className="rounded-md border-2 border-black bg-white px-3 py-1.5 text-sm font-bold text-black shadow hover:bg-rose-50"
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
