// src/pages/admin/Knowledge.tsx
import React, { useEffect, useState } from "react";

type Doc = { id: string; name: string; size: number };

const STORAGE_KEY = "knowledge.docs";

export default function Knowledge() {
  const [docs, setDocs] = useState<Doc[]>([]);

  // load persisted docs (local only; wiring later)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDocs(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }, [docs]);

  const addMock = () => {
    const n = Math.floor(Math.random() * 1000);
    setDocs((d) => [
      ...d,
      { id: String(Date.now()), name: `PriceSheet-${n}.pdf`, size: 345_212 },
    ]);
  };
  const remove = (id: string) => setDocs((d) => d.filter((x) => x.id !== id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-3xl font-extrabold">Knowledge</h1>
        <p className="mt-2">
          Upload product guides, pricing, policies, FAQs — your bot will use this
          knowledge to answer questions.
        </p>
      </div>

      {/* Upload row */}
      <div
        className="border-2 border-black rounded-xl p-6 flex items-center justify-between gap-6"
        style={{
          background:
            "linear-gradient(90deg, #e9d5ff 0%, #fbcfe8 45%, #bbf7d0 100%)",
        }}
      >
        <div>
          <div className="font-bold text-lg">Upload Documents</div>
          <div className="text-sm opacity-80">
            PDF, Word, Excel (placeholder only — wiring later).
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={addMock}
            className="px-4 py-2 rounded-xl border-2 border-black bg-white font-semibold"
          >
            + Upload
          </button>
          <button
            onClick={() => alert("Source manager coming soon.")}
            className="px-4 py-2 rounded-xl border-2 border-black bg-white font-semibold"
          >
            Manage Sources
          </button>
        </div>
      </div>

      {/* Uploaded list */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <div className="font-bold text-lg mb-2">Uploaded Documents</div>
        <div className="text-sm opacity-80 mb-4">
          Static mock data persisted locally.
        </div>

        {docs.length === 0 ? (
          <div
            className="
