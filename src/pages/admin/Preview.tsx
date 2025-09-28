// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";
import "../styles/admin-shared.css";

type Mode = "popup" | "inline" | "sidebar";
type Position = "bottom-right" | "bottom-left";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Position>("bottom-right");
  const [size, setSize] = useState<number>(64);
  const [color, setColor] = useState<string>("#8b5cf6");
  const [img, setImg] = useState<string>("");
  const [open, setOpen] = useState<boolean>(true); // modal open by default

  // In a real implementation you'd wire open/close to the widget's events.
  // For now, we simulate it so the bubble never overlaps the modal footer.
  const showBubble = !open && mode === "popup";

  const Stage: React.CSSProperties = useMemo(
    () => ({
      position: "relative",
      width: "100%",
      height: "70vh",
      minHeight: 480,
      borderRadius: 16,
      border: "1px solid rgba(0,0,0,.15)",
      overflow: "hidden",
      background:
        "linear-gradient(135deg,#ffeef8 0%,#f3e7fc 25%,#e7f0ff 50%,#e7fcf7 75%,#fff9e7 100%)",
    }),
    []
  );

  return (
    <div className="p-6 space-y-4">
      <div className="rounded-2xl border p-4 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100">
        <div className="text-2xl font-extrabold">Widget Preview</div>
        <p className="text-sm font-semibold text-foreground/80">
          Tune the widget and see exactly what a customer will see.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border p-4 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs font-bold uppercase mb-1">Bot ID</div>
          <input
            value={botId}
            onChange={(e) => setBotId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 font-semibold"
            placeholder="waitlist-bot"
          />
        </div>
        <div>
          <div className="text-xs font-bold uppercase mb-1">Mode</div>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="w-full rounded-lg border px-3 py-2 font-semibold"
          >
            <option value="popup">popup (floating bubble)</option>
            <option value="inline">inline (embed block)</option>
            <option value="sidebar">sidebar (right panel)</option>
          </select>
        </div>
        <div>
          <div className="text-xs font-bold uppercase mb-1">Position</div>
          <select
            value={pos}
            onChange={(e) => setPos(e.target.value as Position)}
            className="w-full rounded-lg border px-3 py-2 font-semibold"
          >
            <option value="bottom-right">bottom-right</option>
            <option value="bottom-left">bottom-left</option>
          </select>
        </div>
        <div>
          <div className="text-xs font-bold uppercase mb-1">Size (px)</div>
          <input
            type="number"
            min={48}
            max={96}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value || "64", 10))}
            className="w-full rounded-lg border px-3 py-2 font-semibold"
          />
        </div>
        <div className="md:col-span-2">
          <div className="text-xs font-bold uppercase mb-1">Color</div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-[42px] w-full rounded-lg border p-1"
          />
        </div>
        <div className="md:col-span-2">
          <div className="text-xs font-bold uppercase mb-1">Bubble image URL</div>
          <input
            value={img}
            onChange={(e) => setImg(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 font-semibold"
            placeholder="https://example.com/icon.png"
          />
        </div>
      </div>

      {/* Stage */}
      <div style={Stage} className="shadow-inner">
        {/* Your modal demo – we track 'open' to decide whether to show the bubble */}
        <iframe
          title="demo-modal"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          // simple little HTML demo that calls postMessage("close")
          srcDoc={`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter}
    .wrap{position:absolute;inset:0;display:grid;place-items:center}
    .panel{width:820px;max-width:92vw;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.12);overflow:hidden;border:2px solid #000;background:#fff}
    .bar{padding:14px 18px;font-weight:900;background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)}
    .body{padding:28px 22px 18px;text-align:center}
    .title{font-weight:900;font-size:34px;margin:8px 0 6px}
    .lead{color:#264e46;font-weight:700;margin:6px 0 18px}
    .foot{display:flex;justify-content:space-between;gap:16px;padding:16px 18px;border-top:2px solid #000;background:#f8fafc}
    button{font-weight:900;border-radius:14px;border:2px solid #000;padding:12px 22px;background:#fff}
    .primary{background:#a78bfa}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="panel">
      <div class="bar">Waitlist Bot</div>
      <div class="body">
        <div style="font-size:52px;margin:8px 0">👋</div>
        <div class="title">Welcome to the Waitlist</div>
        <div class="lead">I’ll ask a few quick questions to help our team help you.</div>
        <div style="font-weight:700">Press <span style="font-weight:900">Enter</span> to continue.</div>
      </div>
      <div class="foot">
        <button onclick="parent.postMessage('close','*')">Close</button>
        <button class="primary" onclick="parent.postMessage('close','*')">Next</button>
      </div>
    </div>
  </div>
  <script>window.addEventListener('message',e=>{});</script>
</body>
</html>`}
          onLoad={() => setOpen(true)}
        />
        {showBubble && (
          <div style={{ position: "absolute", right: 24, bottom: 24 }}>
            <ChatWidget
              mode="popup"
              botId={botId}
              color={color}
              size={size}
              position={pos}
              image={img || undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
