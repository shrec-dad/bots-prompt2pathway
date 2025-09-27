// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

// small helper so we can copy code
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Embed code copied!");
  } catch {
    alert("Could not copy. Select & copy manually.");
  }
}

type Mode = "popup" | "inline" | "sidebar";
type Pos  = "bottom-right" | "bottom-left";

export default function Preview() {
  // basic controls
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos]   = useState<Pos>("bottom-right");
  const [color, setColor] = useState("#a78bfa"); // pastel purple (matches Builder vibe)
  const [size, setSize] = useState(64);
  const [image, setImage] = useState<string>("");

  // embed snippet (customers can paste this in their site)
  const embed = useMemo(() => {
    const opts = encodeURIComponent(
      JSON.stringify({ botId, mode, position: pos, color, size, image })
    );
    return [
      `<script src="https://cdn.example.com/mybot-widget.js" async></script>`,
      `<script>(function(){`,
      `  function mount(){`,
      `    if(window.MyBotWidget && window.MyBotWidget.mount){`,
      `      window.MyBotWidget.mount(document.body, JSON.parse(decodeURIComponent("${opts}")));`,
      `    }`,
      `  }`,
      `  if(document.readyState==="complete") mount(); else window.addEventListener("load", mount);`,
      `})();</script>`
    ].join("\n");
  }, [botId, mode, pos, color, size, image]);

  return (
    <div className="p-6 space-y-6">
      {/* Heading */}
      <div className="rounded-xl border-2 border-black bg-white p-6">
        <h1 className="text-2xl font-bold">Widget Preview</h1>
        <p className="text-black/80 mt-1">
          Tune the widget settings and see exactly what a customer will see. You can also copy a ready-to-paste embed.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border-2 border-black bg-gradient-to-r from-purple-200 via-indigo-200 to-teal-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className="font-bold">Bot ID</div>
            <input
              className="mt-1 w-full rounded-md border-2 border-black px-3 py-2"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              placeholder="waitlist-bot"
            />
          </label>

          <label className="block">
            <div className="font-bold">Mode</div>
            <select
              className="mt-1 w-full rounded-md border-2 border-black px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline (sits in content)</option>
              <option value="sidebar">sidebar (full-height)</option>
            </select>
          </label>

          <label className="block">
            <div className="font-bold">Position</div>
            <select
              className="mt-1 w-full rounded-md border-2 border-black px-3 py-2"
              value={pos}
              onChange={(e) => setPos(e.target.value as Pos)}
              disabled={mode === "inline"}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </label>

          <label className="block">
            <div className="font-bold">Color</div>
            <input
              className="mt-1 w-full rounded-md border-2 border-black px-3 py-2"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="font-bold">Size (px)</div>
            <input
              className="mt-1 w-full rounded-md border-2 border-black px-3 py-2"
              type="number"
              min={48}
              max={120}
              value={size}
              onChange={(e) => setSize(Number(e.target.value || 64))}
              disabled={mode === "sidebar"}
            />
          </label>

          <label className="block md:col-span-1">
            <div className="font-bold">Bubble Image URL (optional)</div>
            <input
              className="mt-1 w-full rounded-md border-2 border-black px-3 py-2"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/icon.png"
            />
          </label>
        </div>
      </div>

      {/* Live preview surface */}
      <div className="rounded-xl border-2 border-black bg-white p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-black font-bold">Live Preview</div>

        {/* A big canvas so you can see popup + sidebar positions easily */}
        <div
          className="relative"
          style={{
            width: "100%",
            height: "60vh",
            background:
              "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
          }}
        >
          {/* Inline mode renders inside a centered content card */}
          {mode === "inline" ? (
            <div className="absolute inset-0 grid place-items-center p-6">
              <div className="w-full max-w-3xl h-64 rounded-xl border-2 border-black bg-white relative">
                <div className="p-3 border-b-2 border-black font-semibold">
                  Your page content
                </div>
                <div className="p-3">
                  <ChatWidget
                    mode="inline"
                    botId={botId}
                    color={color}
                    size={size}
                    position={pos}
                    image={image || undefined}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Popup/sidebar render over the preview surface */}
              <ChatWidget
                mode={mode}
                botId={botId}
                color={color}
                size={size}
                position={pos}
                image={image || undefined}
              />
            </>
          )}
        </div>
      </div>

      {/* Embed code */}
      <div className="rounded-xl border-2 border-black bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">Embed</h2>
          <button
            className="px-4 py-2 rounded-md bg-black text-white font-semibold"
            onClick={() => copy(embed)}
          >
            Copy
          </button>
        </div>
        <textarea
          className="w-full h-56 rounded-md border-2 border-black font-mono text-sm p-3"
          value={embed}
          readOnly
        />
      </div>
    </div>
  );
}
