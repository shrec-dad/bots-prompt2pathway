// src/pages/admin/Nurture.tsx
import React, { useMemo, useState } from "react";
import "../../styles/admin-shared.css";
import { getJSON, setJSON } from "../../lib/storage";
import { useAdminStore } from "@/lib/AdminStore"; // to know current bot + mode
import { createInstance, NurtureStep as Step } from "@/lib/instances";

type NurtureStep = Step;

const KEY = "nurtureSchedule";

export default function Nurture() {
  // Which bot/mode are we on?
  const { currentBot, mode } = useAdminStore();

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

  const duplicateToInstance = () => {
    const name = window.prompt(
      "Name this bot instance (customers will not see this name):",
      "Waitlist (Copy)"
    );
    if (!name) return;

    // Make sure the current schedule is persisted first
    setJSON(KEY, steps);

    const payload = createInstance({
      name,
      botId: currentBot,      // e.g. "waitlist-bot"
      mode,                   // "basic" | "custom"
      nurture: steps,         // carry 14-day sequence
    });

    // Show a clear success message with the new Instance ID
    alert(
      `Created instance!\n\nName: ${payload.name}\nBot: ${payload.botId} • ${payload.mode}\nInstance ID: ${payload.id}\n\nPaste this ID into Admin → Embed → "Instance ID" to use it in your widget snippet.`
    );
  };

  return (
    <div
      className="admin-page p-6 rounded-2xl border-2 border-purple-200 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      <div className="h-row mb-6">
        <div className="h-title text-black">Nurture (Day 1–14)</div>
        <div className="stack" style={{ gridTemplateColumns: "auto auto auto" }}>
          <button className="btn" onClick={duplicateToInstance} title="Clone this 14-day sequence into a new Instance">
            Duplicate to New Instance
          </button>
          <button className="btn primary" onClick={save}>
            Save Schedule
          </button>
        </div>
      </div>

      <div className="admin-section stack">
        <p className="text-black">
          Create simple 7–14 day sequences now. This page has placeholders ready
          to wire to your email service later.
        </p>

        <div className="grid-2 gap-4">
          {steps.map((s, idx) => (
            <div
              className="card stack border-2 border-black rounded-xl bg-white"
              key={idx}
            >
              <div className="h-row">
                <div className="h-title text-black">Day {idx + 1}</div>
                <label
                  className="label text-black"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
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
                <label className="label text-black">Subject</label>
                <input
                  className="input border-2 border-purple-300 rounded-lg"
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
                <label className="label text-black">Message</label>
                <textarea
                  className="textarea border-2 border-purple-300 rounded-lg"
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

        <div className="h-row mt-6" style={{ gap: 12 }}>
          <button className="btn" onClick={duplicateToInstance}>
            Duplicate to New Instance
          </button>
          <button className="btn primary" onClick={save}>
            Save All
          </button>
        </div>
      </div>
    </div>
  );
}
