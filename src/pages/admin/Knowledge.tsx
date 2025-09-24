// src/pages/admin/Knowledge.tsx
import React from "react";

type Doc = {
  id: string;
  name: string;
  type: "PDF" | "Word" | "Excel";
  size: string;
  uploadedAt: string;
};

const mockDocs: Doc[] = [
  { id: "1", name: "Pricing Guide 2025.pdf", type: "PDF", size: "1.2 MB", uploadedAt: "2 days ago" },
  { id: "2", name: "Onboarding Playbook.docx", type: "Word", size: "824 KB", uploadedAt: "5 days ago" },
  { id: "3", name: "Lead Sources.xlsx", type: "Excel", size: "403 KB", uploadedAt: "1 week ago" },
];

export default function Knowledge() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Premium gradient header */}
      <div className="mb-6 rounded-2xl border ring-1 ring-amber-500/40 bg-gradient-to-r from-indigo-900 via-violet-800 to-purple-900 p-6 shadow-lg">
        <h1 className="text-3xl font-extrabold text-amber-300">Knowledge</h1>
        <p className="mt-2 text-zinc-100 font-semibold">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer
          questions.
        </p>
      </div>

      {/* Upload area */}
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-indigo-950 p-5 shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-amber-300">Upload Documents</div>
            <div className="text-zinc-200 font-semibold">
              PDF, Word, Excel (placeholder only — wiring comes later).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-amber-500/40 px-4 py-2 font-bold text-amber-300 shadow-sm bg-gradient-to-r from-indigo-900 to-violet-900 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              + Upload
            </button>
            <button
              type="button"
              className="rounded-lg border border-amber-500/40 px-4 py-2 font-bold text-amber-300 shadow-sm bg-gradient-to-r from-indigo-900 to-violet-900 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* Documents list */}
      <div className="rounded-xl border border-amber-500/30 bg-indigo-950 shadow">
        <div className="border-b border-amber-500/30 px-5 py-3">
          <div className="font-bold text-amber-300">Uploaded Documents</div>
          <div className="text-zinc-300 font-semibold">Static mock data for now.</div>
        </div>
        <ul className="divide-y divide-amber-500/20">
          {mockDocs.map((d) => (
            <li
              key={d.id}
              className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-amber-500/40 bg-gradient-to-br from-violet-900 to-purple-900 font-bold text-amber-300">
                  {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                </span>
                <div>
                  <div className="font-bold text-zinc-50">{d.name}</div>
                  <div className="text-zinc-300 font-semibold">
                    {d.type} • {d.size} • {d.uploadedAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-amber-500/40 px-3 py-1.5 font-bold text-amber-300 bg-violet-900 shadow cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Preview
                </button>
                <button
                  className="rounded-md border border-amber-500/40 px-3 py-1.5 font-bold text-amber-300 bg-violet-900 shadow cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer hint */}
      <p className="mt-4 text-zinc-300 font-semibold">
        ⚡ Later we’ll wire this to real uploads, chunking, and retrieval for each bot.
      </p>
    </div>
  );
}
