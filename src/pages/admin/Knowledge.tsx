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

// Black Marble & Gold palette
// Base black: #0D0D0D, Charcoal panel: #1A1A1A, True gold: #D4AF37
export default function Knowledge() {
  return (
    <div className="mx-auto max-w-6xl bg-[#0D0D0D] rounded-2xl p-0 sm:p-0">
      {/* Premium header */}
      <div className="mb-6 rounded-2xl border border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/45 p-6 shadow-xl bg-gradient-to-r from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D]">
        <h1 className="text-3xl font-extrabold text-[#D4AF37]">Knowledge</h1>
        <p className="mt-2 font-semibold text-[#E6E6E6]">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer
          questions.
        </p>
      </div>

      {/* Upload area */}
      <div className="mb-6 rounded-xl border border-[#D4AF37]/40 bg-[#1A1A1A] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-[#D4AF37]">Upload Documents</div>
            <div className="font-semibold text-[#BFBFBF]">
              PDF, Word, Excel (placeholder only — wiring comes later).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 font-bold text-[#D4AF37] shadow bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              + Upload
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 font-bold text-[#D4AF37] shadow bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* Documents list */}
      <div className="rounded-xl border border-[#D4AF37]/40 bg-[#1A1A1A] shadow-lg">
        <div className="border-b border-[#D4AF37]/40 px-5 py-3">
          <div className="font-bold text-[#D4AF37]">Uploaded Documents</div>
          <div className="font-semibold text-[#BFBFBF]">Static mock data for now.</div>
        </div>
        <ul className="divide-y divide-[#D4AF37]/25">
          {mockDocs.map((d) => (
            <li key={d.id} className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-[#D4AF37]/45 bg-gradient-to-br from-[#0D0D0D] to-[#1A1A1A] font-bold text-[#D4AF37]">
                  {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                </span>
                <div>
                  <div className="font-bold text-[#F2F2F2]">{d.name}</div>
                  <div className="font-semibold text-[#BFBFBF]">
                    {d.type} • {d.size} • {d.uploadedAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-[#D4AF37]/40 px-3 py-1.5 font-bold text-[#D4AF37] bg-[#0D0D0D] shadow cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Preview
                </button>
                <button
                  className="rounded-md border border-[#D4AF37]/40 px-3 py-1.5 font-bold text-[#D4AF37] bg-[#0D0D0D] shadow cursor-not-allowed"
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
      <p className="mt-4 font-semibold text-[#BFBFBF]">
        ⚡ Later we’ll wire this to real uploads, chunking, and retrieval for each bot.
      </p>
    </div>
  );
}
