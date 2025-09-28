// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";

/**
 * Simple phone-style modal that mimics the customer view.
 * This replaces the old "Live Preview" box and opens vertically in-page.
 */

type Mode = "popup" | "inline" | "sidebar";
type Position = "bottom-right" | "bottom-left";

export default function Preview() {
  // widget knobs (you can change defaults if you like)
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<Mode>("popup");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [color, setColor] = useState("#8b5cf6"); // purple
  const [bubbleUrl, setBubbleUrl] = useState("");
  const [open, setOpen] = useState(false);

  const headerGradient = useMemo(
    () =>
      `linear-gradient(90deg, rgba(168,85,247,.95) 0%, rgba(99,102,241,.95) 50%, rgba(52,211,153,.95) 100%)`,
    []
  );

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-bold">Widget Preview</h1>
        <p className="text-sm mt-2">
          Tune the widget settings and then click <b>Open Preview</b> to see the customer view.
          This opens a vertical, phone-like modal (no boxed iframe).
        </p>
      </div>

      {/* Controls */}
      <div
        className="border-2 border-black rounded-xl p-6"
        style={{
          background:
            "linear-gradient(90deg, #e9d5ff 0%, #c7d2fe 50%, #bbf7d0 100%)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">Bot ID</label>
            <input
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2"
              placeholder="waitlist-bot"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="w-full rounded-xl border-2 border-black px-3 py-2 bg-white"
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline (embed)</option>
              <option value="sidebar">sidebar (right dock)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="w-full rounded-xl border-2 border-black px-3 py-2 bg-white"
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Accent color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20 rounded-lg border-2 border-black cursor-pointer"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">
              Bubble image URL (optional)
            </label>
            <input
              value={bubbleUrl}
              onChange={(e) => setBubbleUrl(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2"
              placeholder="https://example.com/icon.png"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-xl bg-black text-white font-semibold"
          >
            Open Preview
          </button>

          <a
            href="/admin/builder"
            className="px-4 py-2 rounded-xl border-2 border-black bg-white font-semibold"
          >
            Open Builder
          </a>
        </div>
      </div>

      {/* Vertical modal preview (phone-like) */}
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: "rgba(17,24,39,0.55)" }} // opaque backdrop
          role="dialog"
          aria-modal="true"
        >
          {/* “phone” container */}
          <div
            className="relative rounded-[24px] border-2 border-black shadow-[0_12px_0_#000] bg-white overflow-hidden"
            style={{
              width: 420,
              maxWidth: "95vw",
              height: 720,
              maxHeight: "92vh",
            }}
          >
            {/* header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: headerGradient }}
            >
              <div className="text-white font-bold">
                {botId.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
              </div>
              <button
                title="Close"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full inline-flex items-center justify-center bg-white/90 border-2 border-black"
              >
                ✕
              </button>
            </div>

            {/* step bar */}
            <div className="px-4 py-3">
              <div className="h-2 w-full rounded-full bg-neutral-200 border-2 border-black overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: "33%",
                    background: color,
                    transition: "width 300ms",
                  }}
                />
              </div>
            </div>

            {/* content */}
            <div className="px-6 pt-6">
              <div className="text-center text-6xl mb-4">👋</div>
              <h2 className="text-center text-2xl font-extrabold mb-2">
                Welcome to the Waitlist
              </h2>
              <p className="text-center text-neutral-700">
                I’ll ask a few quick questions to help our team help you.
                <br />
                <span className="text-neutral-500">Press <b>Enter</b> to continue.</span>
              </p>
            </div>

            {/* footer actions */}
            <div className="absolute left-0 right-0 bottom-0 px-6 py-5 bg-neutral-50 border-t-2 border-black">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setOpen(false)}
                  className="px-5 py-3 rounded-2xl border-2 border-black bg-white font-semibold"
                >
                  Close
                </button>

                <button
                  onClick={() => alert("This is a static preview screen. Connect steps later.")}
                  className="px-6 py-3 rounded-2xl border-2 border-black font-semibold text-white"
                  style={{ background: color }}
                >
                  Next
                </button>
              </div>
            </div>

            {/* optional: show the launcher bubble if popup mode */}
            {mode === "popup" && (
              <div
                className="absolute"
                style={{
                  bottom: 16,
                  right: position === "bottom-right" ? 16 : undefined,
                  left: position === "bottom-left" ? 16 : undefined,
                }}
              >
                <button
                  onClick={() =>
                    alert("Launcher tapped. In production this would open the chat.")
                  }
                  className="h-14 w-14 rounded-full border-2 border-black shadow-[0_6px_0_#000] bg-white overflow-hidden"
                  title={`Bot: ${botId}`}
                >
                  {bubbleUrl ? (
                    <img
                      src={bubbleUrl}
                      alt="bubble"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold">Chat</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
