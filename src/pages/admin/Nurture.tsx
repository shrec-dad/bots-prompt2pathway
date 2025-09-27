// src/pages/admin/Nurture.tsx
import React, { useMemo, useState } from "react";
import "../../styles/admin-shared.css";
import { getJSON, setJSON } from "../../lib/storage";

type NurtureStep = {
  enabled: boolean;
  subject: string;
  message: string;
};

const KEY = "nurtureSchedule";

export default function Nurture() {
  const initial = useMemo<NurtureStep[]>(
    () =>
      getJSON<NurtureStep[]>(
        KEY,
        Array.from({ length: 14 }, () => ({
          enabled: false,
          subject: "",
          message: "",
        }))
      ),
    []
  );

  const [steps, setSteps] = useState<NurtureStep[]>(initial);

  const save = () => {
    setJSON(KEY, steps);
    alert("Nurture schedule saved!");
  };

  return (
    <div className="admin-page bg-grad-pink">
      <div className="h-row">
        <div className="h-title">Nurture (Day 1–14)</div>
        <div className="stack" style={{ gridTemplateColumns: "auto auto" }}>
          <button className="btn primary" onClick={save}>
            Save Schedule
          </button>
        </div>
      </div>

      <div className="admin-section stack">
        <p>
          Create simple 7–14 day sequences now. This page has placeholders ready
          to wire to your email service later.
        </p>

        <div className="grid-2">
          {steps.map((s, idx) => (
            <div className="card stack" key={idx}>
              <div className="h-row">
                <div className="h-title">Day {idx + 1}</div>
                <label
                  className="label"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => {
                      const copy = [...steps];
                      copy[idx].enabled = e.target.checked;
                      setSteps(copy);
                    }}
                  />
                  Enabled
                </label>
              </div>

              <div className="stack">
                <label className="label">Subject</label>
                <input
                  className="input"
                  placeholder="Subject for Day X"
                  value={s.subject}
                  onChange={(e) => {
                    const copy = [...steps];
                    copy[idx].subject = e.target.value;
                    setSteps(copy);
                  }}
                />
              </div>

              <div className="stack">
                <label className="label">Message</label>
                <textarea
                  className="textarea"
                  placeholder="Short message for Day X"
                  value={s.message}
                  onChange={(e) => {
                    const copy = [...steps];
                    copy[idx].message = e.target.value;
                    setSteps(copy);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="btn primary" onClick={save}>
          Save All
        </button>
      </div>
    </div>
  );
}
