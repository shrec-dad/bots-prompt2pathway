// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

const prettyName: Record<string, string> = {
  "lead-qualifier": "Lead Qualifier",
  "appointment-bot": "Appointment Booking",
  "customer-support": "Customer Support",
  "waitlist-bot": "Waitlist",
  "social-bot": "Social Media",
};

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<"popup" | "inline" | "sidebar">("popup");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [color, setColor] = useState<string>("#b7a6ff"); // pastel violet
  const [size, setSize] = useState<number>(64);
  const [image, setImage] = useState<string>("");
  const [open, setOpen] = useState<boolean>(true);

  // new: editable welcome copy
  const [welcomeTitle, setWelcomeTitle] = useState<string>(
    `Welcome to the ${prettyName[botId] ?? "Bot"}`
  );
  const [welcomeSub, setWelcomeSub] = useState<string>(
    "I’ll ask a few quick questions to help our team help you."
  );

  // keep title synced when bot changes (only if user didn’t customize)
  useMemo(() => {
    setWelcomeTitle((prev) =>
      prev.startsWith("Welcome to") ? `Welcome to the ${prettyName[botId] ?? "Bot"}` : prev
    );
  }, [botId]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 p-4 shadow-md">
        <div className="text-lg font-extrabold mb-2">Widget Preview</div>
        <p className="text-sm text-foreground/70">
          Tune the widget and dialog copy. Click the bubble to open/close the modal.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 p-4 shadow-md">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold">
            Bot ID
            <input
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              placeholder="waitlist-bot"
            />
          </label>

          <label className="text-sm font-semibold">
            Mode
            <select
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </label>

          <label className="text-sm font-semibold">
            Position
            <select
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </label>

          <label className="text-sm font-semibold">
            Color
            <input
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>

          <label className="text-sm font-semibold">
            Size (px)
            <input
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              type="number"
              min={44}
              max={120}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value || "64", 10))}
            />
          </label>

          <label className="text-sm font-semibold">
            Bubble Image URL (optional)
            <input
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/icon.png"
            />
          </label>
        </div>

        {/* Copy overrides */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold">
            Welcome Title
            <input
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              value={welcomeTitle}
              onChange={(e) => setWelcomeTitle(e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Welcome Subtitle
            <input
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              value={welcomeSub}
              onChange={(e) => setWelcomeSub(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Live Preview area */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4 shadow-md min-h-[60vh] relative overflow-hidden">
        {/* The modal */}
        {open && (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <div
              className="
                w-[92vw] max-w-[520px]
                rounded-2xl border-2 border-black/70 bg-white shadow-2xl
                overflow-hidden
              "
            >
              {/* header */}
              <div className="bg-gradient-to-r from-purple-300 via-indigo-300 to-teal-200 text-black/80 font-semibold px-4 py-3 flex items-center justify-between">
                <span className="truncate">
                  Quick intake to match you with the right plan
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full border-2 border-black/70 bg-white hover:bg-black/5 flex items-center justify-center"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* progress */}
              <div className="px-4 pt-3">
                <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                  <div className="h-full w-1/3 bg-black/70" />
                </div>
              </div>

              {/* body */}
              <div className="px-6 sm:px-8 py-8 text-center">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-3">
                  {welcomeTitle}
                </h2>
                <p className="text-base sm:text-lg text-black/70">{welcomeSub}</p>
                <p className="text-sm text-black/60 mt-4">Press <b>Enter</b> to continue.</p>
              </div>

              {/* footer */}
              <div className="px-6 py-5 flex items-center justify-between bg-black/5">
                <button
                  onClick={() => setOpen(false)}
                  className="px-5 py-3 rounded-xl border-2 border-black bg-white font-bold hover:bg-black/5"
                >
                  Close
                </button>
                <button className="px-6 py-3 rounded-xl border-2 border-black bg-indigo-300 font-bold hover:bg-indigo-200">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bubble you can click to open again */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-4 bottom-4 pointer-events-auto">
            <div onClick={() => setOpen(true)}>
              <ChatWidget
                botId={botId}
                mode="popup"
                position={position}
                color={color}
                size={size}
                image={image || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
