// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

// ✅ correct path from src/pages/admin/* -> src/styles/*
import "../../styles/admin-shared.css";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-right");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#9c8cff");
  const [imageUrl, setImageUrl] = useState("");
  const [open, setOpen] = useState(true); // open modal by default

  // hide the floating FAB whenever the modal is open to avoid overlap
  const showFab = mode !== "popup" || !open;

  const widgetProps = useMemo(
    () => ({
      mode,
      botId,
      position: pos,
      size,
      color,
      image: imageUrl || undefined,
    }),
    [mode, botId, pos, size, color, imageUrl]
  );

  return (
    <div className="admin-page bg-grad-pink">
      <div className="h-row">
        <div className="h-title">Widget Preview</div>
      </div>

      {/* Controls */}
      <div className="admin-section">
        <div className="grid-2 gap-4">
          <label className="stack">
            <span className="label">Bot ID</span>
            <input
              className="input"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              placeholder="waitlist-bot"
            />
          </label>

          <label className="stack">
            <span className="label">Mode</span>
            <select
              className="input"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </label>

          <label className="stack">
            <span className="label">Position</span>
            <select
              className="input"
              value={pos}
              onChange={(e) => setPos(e.target.value as Pos)}
              disabled={mode === "inline"}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </label>

          <label className="stack">
            <span className="label">Size (px)</span>
            <input
              className="input"
              type="number"
              min={48}
              max={96}
              value={size}
              onChange={(e) => setSize(Number(e.target.value || 64))}
              disabled={mode === "sidebar"}
            />
          </label>

          <label className="stack">
            <span className="label">Color</span>
            <input
              className="input"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>

          <label className="stack">
            <span className="label">Bubble Image URL (optional)</span>
            <input
              className="input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
            />
          </label>
        </div>

        <div className="h-row mt-4">
          <button className="btn" onClick={() => setOpen((v) => !v)}>
            {open ? "Close Modal" : "Open Modal"}
          </button>
        </div>
      </div>

      {/* Live area – give it its own stacking context */}
      <div
        className="admin-section"
        style={{ position: "relative", minHeight: 540, overflow: "hidden" }}
      >
        {/* The widget (inline/sidebar render inside this container) */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <ChatWidget {...widgetProps} />
        </div>

        {/* Simulated modal when in popup mode */}
        {mode === "popup" && open && (
          <div
            style={{
              position: "absolute",
              inset: 24,
              display: "grid",
              placeItems: "center",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,.18), rgba(0,0,0,.25))",
              zIndex: 2,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 520,
                maxWidth: "95%",
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,.25)",
                paddingBottom: 84, // ⬅ gives space so the Next button is never covered
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  background:
                    "linear-gradient(90deg, #9b5cff, #82d6c5 80%)",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                Waitlist Bot
              </div>
              <div style={{ padding: 28 }}>
                <div style={{ fontSize: 56, textAlign: "center" }}>👋</div>
                <h2
                  style={{
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 28,
                    marginTop: 8,
                  }}
                >
                  Welcome to the Waitlist
                </h2>
                <p style={{ textAlign: "center", opacity: 0.8 }}>
                  I’ll ask a few quick questions to help our team help you.
                </p>
                <p style={{ textAlign: "center", opacity: 0.6 }}>
                  Press <b>Enter</b> to continue.
                </p>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0 16px",
                }}
              >
                <button className="btn" onClick={() => setOpen(false)}>
                  Close
                </button>
                <button className="btn primary">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* FAB should not appear when the modal is open */}
        {showFab && (
          <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 1 }}>
            <ChatWidget {...widgetProps} />
          </div>
        )}
      </div>
    </div>
  );
}
