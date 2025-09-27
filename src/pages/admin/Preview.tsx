// src/pages/admin/Preview.tsx
import React, { useMemo, useRef, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";
import ModalChat from "@/components/ModalChat";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-right");
  const [color, setColor] = useState("#7aa8ff");
  const [size, setSize] = useState(64);
  const [image, setImage] = useState("");

  // NEW: control modal open/close
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black bg-gradient-to-r from-purple-100 via-purple-50 to-teal-50 rounded-t-2xl">
          <h1 className="text-xl font-extrabold">Widget Preview</h1>
          <p className="text-sm text-black/70">
            Tune the widget settings and see exactly what a customer will see.
          </p>
        </div>

        {/* Controls */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 rounded-b-2xl">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase">Bot ID</div>
            <input
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase">Mode</div>
            <select
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase">Position</div>
            <select
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={pos}
              onChange={(e) => setPos(e.target.value as Pos)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase">Bubble Image URL (optional)</div>
            <input
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              placeholder="https://example.com/icon.png"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase">Color</div>
            <input
              type="color"
              className="w-24 h-10 rounded border-2 border-black"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase">Size (px)</div>
            <input
              type="number"
              min={48}
              max={120}
              step={2}
              className="w-full rounded-lg border-2 border-black px-3 py-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value) || 64)}
            />
          </div>
        </div>
      </div>

      {/* Live Preview container */}
      <div className="rounded-2xl border-2 border-black overflow-hidden">
        <div className="px-4 py-2 font-semibold bg-white border-b-2 border-black">
          Live Preview
        </div>
        <div
          className="relative"
          style={{
            height: 480,
            background:
              "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
          }}
        >
          {/* The bubble */}
          <ChatWidget
            mode={mode}
            botId={botId}
            color={color}
            size={size}
            position={pos}
            image={image || undefined}
            onClick={() => setOpen(true)} // <-- open modal on click
          />

          {/* The modal chat */}
          <ModalChat
            open={open}
            onClose={() => setOpen(false)}
            accent={color}
            title="Quick intake to match you with the right plan"
          />
        </div>
      </div>
    </div>
  );
}
