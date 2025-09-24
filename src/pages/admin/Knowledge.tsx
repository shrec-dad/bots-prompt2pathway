// src/pages/admin/Knowledge.tsx
// Palette: Royal Navy (#0A0E27 / #274690) + Platinum (#E5E4E2)

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
    <div className="mx-auto max-w-6xl bg-[#0A0E27] rounded-2xl">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-[#E5E4E2]/35 ring-1 ring-[#E5E4E2]/40 p-6 shadow-xl bg-gradient-to-r from-[#0A0E27] via-[#12183A] to-[#0A0E27]">
        <h1 className="text-3xl font-extrabold text-[#E5E4E2]">Knowledge</h1>
        <p className="mt-2 font-semibold text-white/90">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer questions.
        </p>
      </div>

      {/* Upload */}
      <div className="mb-6 rounded-xl border border-[#E5E4E2]/35 bg-[#111737] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-[#E5E4E2]">Upload Documents</div>
            <div className="font-semibold text-[#B7C1E6]">PDF, Word, Excel (placeholder only — wiring later).</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-[#E5E4E2]/35 px-4 py-2 font-bold text-[#E5E4E2] shadow bg-gradient-to-r from-[#0A0E27] to-[#12183A] cursor-not-allowed"
              disabled
            >
              + Upload
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#E5E4E2]/35 px-4 py-2 font-bold text-[#E5E4E2] shadow bg-gradient-to-r from-[#0A0E27] to-[#12183A] cursor-not-allowed"
              disabled
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-[#E5E4E2]/35 bg-[#111737] shadow-lg">
        <div className="border-b border-[#E5E4E2]/35 px-5 py-3">
          <div className="font-bold text-[#E5E4E2]">Uploaded Documents</div>
          <div className="font-semibold text-[#B7C1E6]">Static mock data for now.</div>
        </div>
        <ul className="divide-y divide-[#E5E4E2]/20">
          {mockDocs.map((d) => (
            <li key={d.id} className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-[#E5E4E2]/40 bg-gradient-to-br from-[#0A0E27] to-[#111737] font-bold text-[#E5E4E2]">
                  {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                </span>
                <div>
                  <div className="font-bold text-white">{d.name}</div>
                  <div className="font-semibold text-[#B7C1E6]">
                    {d.type} • {d.size} • {d.uploadedAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-[#E5E4E2]/35 px-3 py-1.5 font-bold text-[#E5E4E2] bg-[#0A0E27] shadow cursor-not-allowed" disabled>
                  Preview
                </button>
                <button className="rounded-md border border-[#E5E4E2]/35 px-3 py-1.5 font-bold text-[#E5E4E2] bg-[#0A0E27] shadow cursor-not-allowed" disabled>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 font-semibold text-[#B7C1E6]">⚡ Real uploads & retrieval coming later.</p>
    </div>
  );
}
