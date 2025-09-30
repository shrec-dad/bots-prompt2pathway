// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [instId, setInstId] = useState<string>("");

  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-left");
  const [size, setSize] = useState(56);
  const [color, setColor] = useState<string>("");
  const [img, setImg] = useState<string>("");

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);

  const gradientHeader =
    "bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 text-white";

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const title = useMemo(() => {
    switch (step) {
      case 0:
        return "Welcome to the Waitlist";
      case 1:
        return "Your email";
      case 2:
        return "Interest level";
      default:
        return "All set!";
    }
  }, [step]);

  // Instance-aware widget URL
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("position", pos);
    qp.set("size", String(size));
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());

    return `/widget?${qp.toString()}`;
  }, [instId, botId, pos, size, color, img]);

  const embedIframe = `<iframe
  src="${widgetSrc}"
  style="border:0;width:100%;height:560px"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
          <div className="text-xl font-extrabold">Widget Preview</div>
          <div className="text-sm opacity-90">
            Tune the customer-facing widget style.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Instance ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instance ID (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="inst_abc123…"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              If provided, the instance overrides the Bot ID.
            </div>
          </div>

          {/* Bot ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bot ID</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot ID ignored" : "Enter a bot id"}
            />
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Mode</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Position</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={pos}
              onChange={(e) => setPos(e.target.value as Pos)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Size (px)</label>
            <input
              type="number"
              min={40}
              max={120}
              className="w-full rounded-lg border px-3 py-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>

          {/* Image */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Bubble Image URL (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://example.com/icon.png"
              value={img}
              onChange={(e) => setImg(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Accent Color (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="#7aa8ff"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 hover:from-purple-500/20 hover:to-teal-500/20"
              onClick={() => setOpen(true)}
            >
              Open Preview Modal
            </button>

            {/* 🔹 New Button */}
            <a
              href={widgetSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            >
              Open in New Tab
            </a>

            <div className="ml-auto text-sm font-semibold">Embed URL:</div>
            <input
              readOnly
              value={widgetSrc}
              className="w-[280px] max-w-full rounded-lg border px-3 py-2 text-xs font-mono"
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Embed URL"
            />
          </div>

          {/* Full iframe code */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold">Embed (iframe)</label>
            <textarea
              readOnly
              className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
              rows={4}
              value={embedIframe}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>

      {/* Live UI area */}
      <div className="relative min-h-[70vh] rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 p-6 overflow-visible">
        {mode === "popup" && (
          <ChatWidget
            mode="popup"
            botId={botId}
            position={pos}
            size={size}
            color={color || undefined}
            image={img || undefined}
          />
        )}

        {open && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ pointerEvents: "none" }}
          >
            <div className="w-[420px] max-w-[92vw] rounded-2xl border bg-white shadow-2xl pointer-events-auto">
              <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
                <div className="text-lg font-extrabold">
                  {botId.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid place-items-center text-5xl">👋</div>

                <div className="text-center">
                  <h2 className="text-2xl font-extrabold">{title}</h2>

                  {step === 0 && (
                    <p className="mt-2 text-muted-foreground">
                      I’ll ask a few quick questions to help our team help you.
                      <br />
                      Press <span className="font-bold">Continue</span> to proceed.
                    </p>
                  )}

                  {step === 1 && (
                    <div className="mt-4">
                      <input
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="you@domain.com"
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="mt-4 grid gap-2">
                      {["Curious", "Very interested", "VIP"].map((o) => (
                        <button
                          key={o}
                          className="rounded-lg border px-3 py-2 hover:bg-muted/50"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 3 && (
                    <p className="mt-2 text-muted-foreground">
                      Thanks! You’re on the list — we’ll be in touch.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                  <div className="flex gap-2">
                    {step > 0 && step < 3 && (
                      <button
                        className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                        onClick={back}
                      >
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                        onClick={next}
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                        onClick={() => setOpen(false)}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
