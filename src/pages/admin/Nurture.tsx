// src/pages/admin/Nurture.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/admin-shared.css";
import { getJSON, setJSON } from "../../lib/storage";

type NurtureStep = {
  enabled: boolean;
  subject: string;
  message: string;
};

const KEY = "nurtureSchedule";
const makeDefault = (days = 14): NurtureStep[] =>
  Array.from({ length: days }, () => ({
    enabled: false,
    subject: "",
    message: "",
  }));

export default function Nurture() {
  // Seed from localStorage or fall back to 14 clean steps
  const initial = useMemo<NurtureStep[]>(
    () => getJSON<NurtureStep[]>(KEY, makeDefault(14)),
    []
  );

  const [steps, setSteps] = useState<NurtureStep[]>(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // --- 1) AUTOSAVE (debounced) ------------------------------------------------
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    setSaveState("saving");
    setErrorMsg("");

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      try {
        setJSON(KEY, steps);
        setSaveState("saved");
        // gently clear "Saved" state after a moment
        window.setTimeout(() => setSaveState("idle"), 1200);
      } catch (err: any) {
        setSaveState("error");
        setErrorMsg(
          err?.message?.includes("quota")
            ? "Save failed: Browser storage is full. Try exporting and clearing older data."
            : "Save failed: Unable to write to local storage."
        );
      }
    }, 500); // 500ms debounce
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [steps]);

  // Manual save (kept for your original buttons)
  const save = () => {
    try {
      setJSON(KEY, steps);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
      alert("Nurture schedule saved!");
    } catch (err: any) {
      setSaveState("error");
      setErrorMsg(
        err?.message?.includes("quota")
          ? "Save failed: Browser storage is full. Try exporting and clearing older data."
          : "Save failed: Unable to write to local storage."
      );
      alert(errorMsg || "Save failed. See banner for details.");
    }
  };

  // --- 2) RESET TO DEFAULTS ---------------------------------------------------
  const onReset = () => {
    if (!confirm("Reset all 14 days to blank defaults? This will overwrite the current schedule.")) return;
    const fresh = makeDefault(14);
    setSteps(fresh); // autosave effect will persist
  };

  // --- 3) EXPORT / IMPORT -----------------------------------------------------
  const onExport = () => {
    try {
      const blob = new Blob([JSON.stringify(steps, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nurture-schedule.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed.");
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onClickImport = () => fileInputRef.current?.click();

  const onImport = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Basic shape validation
      if (!Array.isArray(parsed)) throw new Error("Invalid file: expected an array.");
      const cleaned: NurtureStep[] = parsed.map((it: any) => ({
        enabled: !!it?.enabled,
        subject: String(it?.subject ?? ""),
        message: String(it?.message ?? ""),
      }));

      // If client file has fewer/more than 14, normalize to exactly 14 for consistency
      const normalized =
        cleaned.length === 14
          ? cleaned
          : [...cleaned.slice(0, 14), ...makeDefault(Math.max(0, 14 - cleaned.length))];

      setSteps(normalized); // autosave effect will persist
      alert("Nurture schedule imported successfully.");
    } catch (e: any) {
      alert(`Import failed: ${e?.message || "Unknown error"}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="admin-page p-6 rounded-2xl border-2 border-purple-200 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* Header row */}
      <div className="h-row mb-6">
        <div className="h-title text-black">Nurture (Day 1–14)</div>

        <div className="stack" style={{ gridTemplateColumns: "auto auto auto auto" }}>
          <button className="btn" onClick={onReset} title="Reset to 14 blank steps">
            Reset
          </button>
          <button className="btn" onClick={onExport} title="Download nurture-schedule.json">
            Export
          </button>
          <button className="btn" onClick={onClickImport} title="Upload a previously exported JSON">
            Import
          </button>
          <button className="btn primary" onClick={save}>
            Save Now
          </button>
        </div>
      </div>

      {/* Save state banner */}
      {saveState !== "idle" && (
        <div
          className="rounded-xl border-2 p-3 mb-4"
          style={{
            borderColor:
              saveState === "saving" ? "#a78bfa" : saveState === "saved" ? "#10b981" : "#ef4444",
            background:
              saveState === "saving"
                ? "#ede9fe"
                : saveState === "saved"
                ? "#ecfdf5"
                : "#fee2e2",
            color: "#000",
          }}
        >
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Saved"}
          {saveState === "error" && (errorMsg || "Save error")}
        </div>
      )}

      {/* Main */}
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
                <label className="label text-black">Subject</label>
                <input
                  className="input border-2 border-purple-300 rounded-lg"
                  placeholder={`Subject for Day ${idx + 1}`}
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
                  placeholder={`Short message for Day ${idx + 1}`}
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

        <button className="btn primary mt-6" onClick={save}>
          Save All
        </button>
      </div>

      {/* Hidden file input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => onImport(e.target.files?.[0] || null)}
      />
    </div>
  );
}
