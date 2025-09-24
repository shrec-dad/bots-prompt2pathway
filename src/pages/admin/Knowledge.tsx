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
      {/* Gradient header */}
      <div className="mb-6 rounded-2xl border ring-1 ring-border bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 p-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">Knowledge</h1>
        <p className="mt-2 text-foreground/80 font-semibold">
          Upload product guides, pricing, policies, FAQs—your bot can use this to answer questions.
        </p>
      </div>

      {/* Upload area (placeholder) */}
      <div className="mb-6 rounded-xl border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Upload Documents</div>
            <div className="text-foreground/70 font-semibold">
              PDF, Word, Excel (placeholder only—wiring comes later).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 font-bold shadow-sm bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-teal-500/15 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              + Upload
            </button>
            <button
              type="button"
              className="rounded-lg border px-4 py-2 font-bold shadow-sm hover:bg-muted"
              title="Coming soon"
              disabled
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* Documents list (mock) */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <div className="font-bold">Uploaded Documents</div>
          <div className="text-foreground/70 font-semibold">Static mock data for now.</div>
        </div>
        <ul className="divide-y">
          {mockDocs.map((d) => (
            <li key={d.id} className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-border bg-gradient-to-br from-blue-500/15 via-cyan-500/15 to-teal-500/15 font-bold">
                  {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                </span>
                <div>
                  <div className="font-bold">{d.name}</div>
                  <div className="text-foreground/70 font-semibold">
                    {d.type} • {d.size} • {d.uploadedAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border px-3 py-1.5 font-bold hover:bg-muted" disabled title="Coming soon">
                  Preview
                </button>
                <button className="rounded-md border px-3 py-1.5 font-bold hover:bg-muted" disabled title="Coming soon">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer hint */}
      <p className="mt-4 text-foreground/70 font-semibold">
        Later we’ll wire this to real uploads, chunking, and retrieval for each bot.
      </p>
    </div>
  );
}
