// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<"popup" | "inline" | "sidebar">("popup");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    "bottom-right"
  );
  const [color, setColor] = useState<string>("#a78bfa");
  const [size, setSize] = useState<number>(64);
  const [imgUrl, setImgUrl] = useState("");

  const containerStyle: React.CSSProperties = {
    position: "relative",
    minHeight: 520,
    border: "2px solid #000",
    borderRadius: 12,
    background:
      "linear-gradient(135deg,#fde2f3 0%,#ede9fe 25%,#e0f2fe 50%,#dcfce7 75%,#fef3c7 100%)",
    overflow: "hidden",
  };

  const previewNote =
    mode === "inline"
      ? "Inline mode is placed at the current DOM position."
      : mode === "sidebar"
      ? "Sidebar mode shows a full-height panel."
      : "Popup mode shows a floating bubble that opens a panel on click.";

  const openDefault = mode !== "popup"; // auto-open inline/sidebar in preview

  // ---------- EMBED CODE (iframe overlay) ----------
  const embedCode = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://YOUR_DOMAIN";

    const params = new URLSearchParams({
      botId,
      mode,
      position,
      color,
      size: String(size),
    });
    if (imgUrl) params.set("image", imgUrl);

    // Make the iframe big enough to contain the popup panel when open.
    // For sidebar, we anchor full height.
    const dim =
      mode === "sidebar"
        ? { w: "360px", h: "100vh" }
        : { w: "380px", h: "560px" };

    const side = position === "bottom-left" ? "left:24px;" : "right:24px;";

    return `<!-- Bot Widget -->
<iframe
  src="${origin}/widget?${params.toString()}"
  style="position:fixed; bottom:24px; ${side} width:${dim.w}; height:${dim.h}; border:0; z-index:999999; background:transparent;"
  title="Bot Widget"
  loading="lazy"
></iframe>`;
  }, [botId, mode, position, color, size, imgUrl]);

  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      alert("Embed code copied to clipboard!");
    } catch {
      // Fallback: select the textarea if clipboard fails (permissions, http, etc.)
      const ta = document.getElementById("embed-ta") as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        ta.select();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-black p-4 bg-white">
        <h1 className="text-2xl font-bold">Widget Preview</h1>
        <p className="text-sm text-black/70">
          Tune the widget settings and see exactly what a customer will see.
          You can also copy a ready-to-paste embed.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border-2 border-black p-4 bg-gradient-to-r from-purple-200 via-blue-200 to-teal-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-sm">Bot ID</label>
            <input
              className="w-full mt-1 px-3 py-2 border-2 border-black rounded-lg"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-sm">Mode</label>
            <select
              className="w-full mt-1 px-3 py-2 border-2 border-black rounded-lg"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-sm">Position</label>
            <select
              className="w-full mt-1 px-3 py-2 border-2 border-black rounded-lg"
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-sm">Color</label>
            <input
              type="color"
              className="w-full mt-1 h-[42px] border-2 border-black rounded-lg"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-sm">Size (px)</label>
            <input
              type="number"
              min={44}
              max={96}
              className="w-full mt-1 px-3 py-2 border-2 border-black rounded-lg"
              value={size}
              onChange={(e) => setSize(Number(e.target.value || 64))}
            />
          </div>

          <div>
            <label className="font-bold text-sm">Bubble Image URL (optional)</label>
            <input
              className="w-full mt-1 px-3 py-2 border-2 border-black rounded-lg"
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
            />
          </div>
        </div>
        <div className="mt-2 text-sm font-semibold">{previewNote}</div>
      </div>

      {/* Live Preview */}
      <div className="rounded-xl border-2 border-black bg-white">
        <div className="px-4 py-2 border-b-2 border-black font-bold">Live Preview</div>
        <div style={containerStyle}>
          <ChatWidget
            mode={mode}
            botId={botId}
            color={color}
            size={size}
            position={position}
            image={imgUrl || undefined}
            preview
            openDefault={openDefault}
          />
        </div>
      </div>

      {/* Embed code (copy & paste) */}
      <div className="rounded-xl border-2 border-black overflow-hidden">
        <div className="px-4 py-2 border-b-2 border-black font-bold bg-gradient-to-r from-purple-200 via-blue-200 to-teal-200">
          Embed Code (copy & paste)
        </div>
        <div className="p-4 space-y-2 bg-white">
          <textarea
            id="embed-ta"
            readOnly
            className="w-full h-40 font-mono text-sm border-2 border-black rounded-lg p-3"
            value={embedCode}
          />
          <div className="flex justify-end">
            <button
              onClick={copyEmbed}
              className="px-4 py-2 rounded-lg border-2 border-black bg-purple-500 text-white font-bold hover:bg-purple-600"
            >
              Copy
            </button>
          </div>
          <div className="text-xs text-black/70">
            This iframe points at <code>/widget</code> with your settings in the querystring.
            Paste it into any website’s HTML. For <b>sidebar</b> mode, the iframe fills the full
            height on the chosen side; for <b>popup</b> it’s sized to fit the panel when opened.
          </div>
        </div>
      </div>
    </div>
  );
}
