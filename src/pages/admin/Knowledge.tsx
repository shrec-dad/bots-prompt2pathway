// src/pages/admin/Knowledge.tsx
// Pastel / light UI to match your Dashboard / Bot cards

import React from "react";

type Doc = {
  id: string;
  name: string;
  type: "PDF" | "Word" | "Excel";
  size: string;
  uploadedAt: string;
};

const docs: Doc[] = [
  { id: "1", name: "Pricing Guide 2025.pdf", type: "PDF", size: "1.2 MB", uploadedAt: "2 days ago" },
  { id: "2", name: "Onboarding Playbook.docx", type: "Word", size: "824 KB", uploadedAt: "5 days ago" },
  { id: "3", name: "Lead Sources.xlsx", type: "Excel", size: "403 KB", uploadedAt: "1 week ago" },
];

export default function Knowledge() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-3xl font-extrabold tracking-tight">Knowledge</h1>
        <p className="mt-2 text-muted-foreground">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer questions.
        </p>
      </div>

      {/* Upload section */}
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-lg font-bold">Upload Documents</div>
            <div className="text-muted-foreground">
              PDF, Word, Excel (placeholder only — wiring later).
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="rounded-xl border bg-gradient-to-r from-pink-100 to-indigo-100 px-4 py-2 text-sm font-semibold text-foreground shadow-sm disabled:opacity-70"
            >
              + Upload
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="rounded-xl border bg-gradient-to-r from-sky-100 to-emerald-100 px-4 py-2 text-sm font-semibold text-foreground shadow-sm disabled:opacity-70"
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded docs */}
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm ring-1 ring-black/5">
        <div className="mb-3">
          <div className="text-lg font-bold">Uploaded Documents</div>
          <div className="text-muted-foreground">Static mock data for now.</div>
        </div>

        <ul className="divide-y">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-col items-start justify-between gap-3 py-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br from-violet-50 to-rose-50 text-lg">
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
                  disabled
                  className="rounded-lg border bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        ⚡ We’ll connect this to real uploads and retrieval after core pages are in.
      </p>
    </div>
  );
}
