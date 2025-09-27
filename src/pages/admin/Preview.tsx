// src/pages/admin/Preview.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

/** Small palette helper so we match the rest of your app */
const card = "rounded-2xl border-[2px] border-black/80 shadow-[0_6px_0_#000] bg-white";
const grad = "bg-[linear-gradient(135deg,#f7d7ff_0%,#dfe4ff_40%,#c8f4ea_100%)]";

/** The faux bot modal we preview when the bubble is clicked */
function BotModal({
  open,
  onClose,
  title,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center"
      style={{ pointerEvents: "none" }} // let the overlay pass clicks except on the modal
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        style={{ pointerEvents: "auto" }}
      />

      {/* Modal */}
      <div
        className={`${card} ${grad}`}
        style={{
          width: 740,
          maxWidth: "92vw",
          pointerEvents: "auto",
        }}
      >
        {/* Title bar */}
        <div className="relative px-6 py-4 rounded-t-2xl">
          <div className="font-extrabold text-lg">Quick intake to match you with the right plan</div>
          {/* progress */}
          <div className="mt-3 h-2 w-full rounded-full bg-black/10 overflow-hidden">
            <div className="h-full w-1/3 bg-black/50 rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 grid place-items-center rounded-full border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          <div className="text-6xl text-center select-none">👋</div>
          <h2 className="mt-4 text-center text-4xl font-extrabold">
            Welcome to the Waitlist
          </h2>
          <p className="mt-4 text-center text-[18px] text-black/70">
            I’ll ask a few quick questions to help our team help you.
          </p>
          <p className="mt-2 text-center text-black/60">
            Press <span className="font-bold">Enter</span> to continue.
          </p>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <button
              className="px-6 py-3 rounded-2xl border-2 border-black bg-white text-lg font-bold shadow-[0_4px_0_#000] active:translate-y-[2px] active:shadow-[0_2px_0_#000]"
              onClick={onClose}
            >
              Close
            </button>

            <button
              className="px-8 py-3 rounded-2xl border-2 border-black bg-[#b8b9ff] text-lg font-bold shadow-[0_4px_0_#000] active:translate-y-[2px] active:shadow-[0_2px_0_#000]"
              onClick={onClose}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AutoScale wraps children and scales them down to fit the container when needed.
 * This keeps the modal from overflowing the preview canvas.
 */
function AutoScale({
  children,
  padding = 24,
}: {
  children: React.ReactNode;
  padding?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const c = containerRef.current;
      const d = contentRef.current;
      if (!c || !d) return;

      const cw = c.clientWidth - padding * 2;
      const ch = c.clientHeight - padding * 2;
      const dw = d.scrollWidth;
      const dh = d.scrollHeight;

      const next = Math.min(1, cw / dw, ch / dh);
      setScale(Number.isFinite(next) ? next : 1);
    });

    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [padding]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div
        ref={contentRef}
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Preview() {
  // Controls
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<"popup" | "inline" | "sidebar">("popup");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [color, setColor] = useState("#b392ff");
  const [size, setSize] = useState(64);
  const [image, setImage] = useState<string>("");

  // Bubble -> modal
  const [open, setOpen] = useState(false);

  // Make sure Preview page has a nice gradient background
  const wrapperGrad = useMemo(
    () =>
      "bg-[linear-gradient(135deg,#ffeef8_0%,#f3e7fc_25%,#e7f0ff_50%,#e7fcf7_75%,#fff9e7_100%)]",
    []
  );

  return (
    <div className={`p-4 md:p-6 ${wrapperGrad}`}>
      {/* Title */}
      <div className={`${card} ${grad} p-5 mb-4`}>
        <h1 className="text-2xl font-extrabold">Widget Preview</h1>
        <p className="text-black/70 mt-1">
          Tune the widget settings and see exactly what a customer will see.
        </p>
      </div>

      {/* Controls */}
      <div className={`${card} ${grad} p-4 mb-5`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Bot ID</label>
            <input
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Mode</label>
            <select
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Position</label>
            <select
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Color</label>
            <input
              type="color"
              className="h-10 w-full rounded-lg border-2 border-black p-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Size (px)</label>
            <input
              type="number"
              min={48}
              max={96}
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Bubble Image URL (optional)
            </label>
            <input
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              placeholder="https://example.com/icon.png"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className={`${card} p-0 overflow-hidden`}>
        <div className="px-5 pt-4 pb-3 border-b-[2px] border-black/80">
          <div className="font-extrabold">Live Preview</div>
        </div>

        {/* Canvas */}
        <div
          className={`${grad}`}
          style={{
            position: "relative",
            height: "72vh",         // plenty of room so the modal isn’t clipped
            maxHeight: "calc(100vh - 220px)",
          }}
        >
          {/* Scale-to-fit layer */}
          <AutoScale padding={16}>
            <div className="relative" style={{ width: 960, height: 640 }}>
              {/* This is where the modal renders and scales */}
              <BotModal open={open} onClose={() => setOpen(false)} title="Welcome" />
            </div>
          </AutoScale>

          {/* Bubble inside the preview canvas so it stays within the box */}
          <div className="absolute inset-0">
            <div className="relative h-full w-full">
              <div className="absolute bottom-4 right-4">
                {mode === "popup" && (
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
                )}

                {mode === "sidebar" && (
                  <ChatWidget
                    botId={botId}
                    mode="sidebar"
                    position={position}
                    color={color}
                    size={size}
                    image={image || undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
