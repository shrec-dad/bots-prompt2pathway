// src/components/BackgroundManager.tsx
import React, { useEffect, useState } from "react";

/**
 * BackgroundManager
 * - Applies a site-wide background color
 * - Persists the choice in localStorage
 * - Floating control lets you switch between 6 professional presets
 *
 * Usage: Render <BackgroundManager /> once anywhere at the top level (e.g., in App.tsx)
 */

const STORAGE_KEY = "mb.ui.background";

type Preset = {
  name: string;
  hex: string;
};

const PRESETS: Preset[] = [
  { name: "Soft Blue Gray", hex: "#f0f4f8" },
  { name: "Light Lavender", hex: "#f3e8ff" },
  { name: "Pale Green Tint", hex: "#e8f5e9" },
  { name: "Warm Beige", hex: "#fdf6e3" },
  { name: "Light Slate", hex: "#f5f7fa" },
  { name: "Blush", hex: "#fff0f5" },
];

function applyBackground(hex: string) {
  // Whole-page background (including Builder canvas area)
  document.documentElement.style.backgroundColor = hex; // <html>
  document.body.style.backgroundColor = hex;           // <body>
}

const BackgroundManager: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [bg, setBg] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || PRESETS[0].hex;
    } catch {
      return PRESETS[0].hex;
    }
  });

  // Apply & persist
  useEffect(() => {
    applyBackground(bg);
    try {
      localStorage.setItem(STORAGE_KEY, bg);
    } catch {}
  }, [bg]);

  return (
    <>
      {/* Floating Toggle */}
      <button
        aria-label="Change background"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "1.25rem",
          left: "1.25rem",
          zIndex: 1000,
          borderRadius: "9999px",
          padding: "0.6rem 0.8rem",
          background: "#ffffffcc",
          border: "1px solid #e5e7eb",
          boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
          backdropFilter: "saturate(140%) blur(6px)",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        🎨 Background
      </button>

      {/* Palette */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "4.5rem",
            left: "1.25rem",
            zIndex: 1000,
            minWidth: 220,
            padding: "0.75rem",
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            Choose background
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {PRESETS.map((p) => {
              const selected = p.hex.toLowerCase() === bg.toLowerCase();
              return (
                <button
                  key={p.hex}
                  onClick={() => setBg(p.hex)}
                  title={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0.5rem 0.6rem",
                    borderRadius: 10,
                    border: selected ? "2px solid #6366f1" : "1px solid #e5e7eb",
                    background: selected ? "#eef2ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      background: p.hex,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default BackgroundManager;

