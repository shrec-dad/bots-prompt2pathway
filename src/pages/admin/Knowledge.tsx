// src/pages/admin/Knowledge.tsx
// Palette: Obsidian Black (#0A0A0A) + Crimson (#8B0000) + Bronze Gold (#B8860B)

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
    <div className="mx-auto max-w-6xl bg-[#0A0A0A] rounded-2xl">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-[#B8860B]/40 ring-1 ring-[#B8860B]/45 p-6 shadow-xl bg-gradient-to-r from-[#0A0A0A] via-[#121212] to-[#0A0A0A]">
        <h1 className="text-3xl font-extrabold text-[#B8860B]">Knowledge</h1>
        <p className="mt-2 font-semibold text-[#F5F5F5]">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer questions.
        </p>
      </div>

      {/* Upload */}
      <div className="mb-6 rounded-xl border border-[#B8860B]/40 bg-[#121212] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-[#B8860B]">Upload Documents</div>
            <div className="font-semibold text-[#CFCFCF]">PDF, Word, Excel (placeholder only — wiring later).</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-[#B8860B]/40 px-4 py-2 font-bold text-[#B8860B] shadow bg-gradient-to-r from-[#0A0A0A] to-[#121212] cursor-not-allowed"
              disabled
            >
              + Upload
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#B8860B]/40 px-4 py-2 font-bold text-[#B8860B] shadow bg-gradient-to-r from-[#0A0A0A] to-[#121212] cursor-not-allowed"
              disabled
            >
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-[#B8860B]/40 bg-[#121212] shadow-lg">
        <div className="border-b border-[#B8860B]/40 px-5 py-3">
          <div className="font-bold text-[#B8860B]">Uploaded Documents</div>
          <div className="font-semibold text-[#CFCFCF]">Static mock data for now.</div>
        </div>
        <ul className="divide-y divide-[#B8860B]/25">
          {mockDocs.map((d) => (
            <li key={d.id} className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-[#B8860B]/45 bg-gradient-to-br from-[#0A0A0A] to-[#121212] font-bold text-[#B8860B]">
                  {d.type === "PDF" ? "📄" : d.type === "Word" ? "📝" : "📊"}
                </span>
                <div>
                  <div className="font-bold text-[#F5F5F5]">{d.name}</div>
                  <div className="font-semibold text-[#CFCFCF]">
                    {d.type} • {d.size} • {d.uploadedAt}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-[#B8860B]/40 px-3 py-1.5 font-bold text-[#B8860B] bg-[#0A0A0A] shadow cursor-not-allowed" disabled>
                  Preview
                </button>
                <button className="rounded-md border border-[#B8860B]/40 px-3 py-1.5 font-bold text-[#B8860B] bg-[#0A0A0A] shadow cursor-not-allowed" disabled>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 font-semibold text-[#CFCFCF]">⚡ Real uploads & retrieval coming later.</p>
    </div>
  );
}
