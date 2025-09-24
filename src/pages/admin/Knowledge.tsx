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

// Emerald & Champagne Gold palette
const BASE_BG = "bg-[#022D1F]";          // deep forest
const PANEL_BG = "bg-[#013220]";         // emerald
const ACCENT_GOLD = "text-[#C5B358]";    // champagne gold
const ACCENT_RING = "ring-[#C5B358]/40"; // soft gold ring
const ACCENT_BORDER = "border-[#C5B358]/35";
const SOFT_TEXT = "text-[#DDE5E0]";      // soft light for body
const MUTED_TEXT = "text-[#A6B5AE]";     // muted

export default function Knowledge() {
  return (
    <div className={`mx-auto max-w-6xl ${BASE_BG} rounded-2xl p-0 sm:p-0`}>
      {/* Premium header */}
      <div
        className={[
          "mb-6 rounded-2xl border",
          ACCENT_BORDER,
          "ring-1",
          ACCENT_RING,
          "p-6 shadow-xl",
          "bg-gradient-to-r from-[#022D1F] via-[#013220] to-[#022D1F]",
        ].join(" ")}
      >
        <h1 className={`text-3xl font-extrabold ${ACCENT_GOLD}`}>Knowledge</h1>
        <p className={`mt-2 font-semibold ${SOFT_TEXT}`}>
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to answer
          questions.
        </p>
      </div>

      {/* Upload area */}
      <div className={`mb-6 rounded-xl border ${ACCENT_BORDER} ${PANEL_BG} p-5 shadow-lg`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className={`text-lg font-bold ${ACCENT_GOLD}`}>Upload Documents</div>
            <div className={`font-semibold ${MUTED_TEXT}`}>
              PDF, Word, Excel (placeholder only — wiring comes later).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className=
