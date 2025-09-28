// src/pages/admin/Knowledge.tsx
import React, { useState } from "react";

type Doc = { id: string; name: string; type: "pdf" | "docx" | "xlsx" };

export default function Knowledge() {
  const [docs, setDocs] = useState<Doc[]>([]);

  const addMock = () => {
    const n = docs.length + 1;
    setDocs((d) => [
      ...d,
      { id: String(n), name: `Document ${n}.pdf`, type: "pdf" },
    ]);
  };

  const remove = (id: string) => setDocs((d) => d.filter((x) => x.id !== id));

  return (
    <div className="p-6 rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">Knowledge</h1>
        <p className="text-sm text-muted-foreground">
          Upload product guides, pricing, policies, FAQs — your bot will use this knowledge to
          answer questions.
        </p>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl border bg-white shadow-sm mb-4">
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold">Upload Documents</div>
            <div className="text-sm text-muted-foreground">
              PDF, Word, Excel (placeholder only — wiring later).
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border hover:bg-muted/40"
              onClick={addMock}
            >
              + Upload
            </button>
            <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border hover:bg-muted/40">
              Manage Sources
            </button>
          </div>
        </div>
      </div>

      {/* List card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="p-4">
          <div className="text-lg font-extrabold mb-2">Uploaded Documents</div>
          <div className="text-sm text-muted-foreground mb-4">
            Static mock data persisted locally.
          </div>

          {docs.length === 0 ? (
            <div className="rounded-xl border bg-muted/20 px-4 py-6 text-sm">
              No documents yet. Use <span className="font-bold">+ Upload</span> to add PDF/Word/Excel.
            </div>
          ) : (
            <ul className="divide-y">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white text-xs font-bold">
                      {d.type.toUpperCase()}
                    </span>
                    <span className="font-semibold">{d.name}</span>
                  </div>
                  <button
                    className="rounded-lg px-3 py-1 text-sm ring-1 ring-border hover:bg-muted/40"
                    onClick={() => remove(d.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
