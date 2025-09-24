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
          "mb-6

   
