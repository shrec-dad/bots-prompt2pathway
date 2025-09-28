// src/pages/admin/Knowledge.tsx
import React, { useState } from "react";
import "../../styles/admin-shared.css"; // ✅ fixed path

type Doc = { id: string; name: string; size: string };

export default function Knowledge() {
  const [docs, setDocs] = useState<Doc[]>([]);

  const addMock = () =>
    setDocs((d) => [
      ...d,
      { id: crypto.randomUUID(), name: "Pricing.pdf", size: "412 KB" },
    ]);

  return (
    <div className="admin-page bg-grad-blue">
      <div className="h-row">
        <div className="h-title">Knowledge</div>
      </div>

      <div className="admin-section">
        <div className="h-row">
          <div className="h-title">Upload Documents</div>
          <div className="stack" style={{ gridTemplateColumns: "auto auto" }}>
            <button className="btn" onClick={addMock}>+ Upload</button>
            <button className="btn">Manage Sources</button>
          </div>
        </div>

        <p>PDF, Word, Excel (placeholder only — wiring later).</p>
      </div>

      <div className="admin-section">
        <div className="h-title">Uploaded Documents</div>
        <p>Static mock data persisted locally.</p>

        {docs.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            No documents yet. Use <b>+ Upload</b> to add PDF/Word/Excel.
          </div>
        ) : (
          <div className="stack">
            {docs.map((d) => (
              <div key={d.id} className="card h-row">
                <div>
                  <div className="h-title" style={{ fontSize: 16 }}>{d.name}</div>
                  <div className="muted">{d.size}</div>
                </div>
                <button
                  className="btn"
                  onClick={() => setDocs((x) => x.filter((y) => y.id !== d.id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
