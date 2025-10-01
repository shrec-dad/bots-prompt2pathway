// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [instId, setInstId] = useState("");

  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-right");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#7aa8ff");
  const [img, setImg] = useState("");
  const [shape, setShape] = useState<"circle" | "rounded" | "square" | "oval" | "chat">("circle");
  const [imageFit, setImageFit] = useState<"cover" | "contain" | "fill">("cover");
  const [labelText, setLabelText] = useState("Chat");
  const [labelColor, setLabelColor] = useState("#ffffff");

  const [messageStyle, setMessageStyle] = useState<
    "roundedCard" | "speechClassic" | "speechOval" | "pill" | "glass" | "outlined"
  >("roundedCard");
  const [avatarImage, setAvatarImage] = useState("");

  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("mode", mode);
    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("color", color);
    if (img.trim()) qp.set("image", img.trim());
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    qp.set("label", labelText);
    qp.set("labelColor", labelColor);
    qp.set("messageStyle", messageStyle);
    if (avatarImage.trim()) qp.set("avatar", avatarImage.trim());

    return `/widget?${qp.toString()}`;
  }, [instId, botId, mode, pos, size, color, img, shape, imageFit, labelText, labelColor, messageStyle, avatarImage]);

  const gradientHeader =
    "bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 text-white";

  const iframeSnippet = `<iframe
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
          <div className="text-sm opacity-90">Tune the customer-facing widget style.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <label className="text-sm font-semibold">Instance ID (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="inst_abc123…"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Bot ID</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot ID ignored" : "Enter a bot id"}
            />
          </div>

          <div>
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

          <div>
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

          <div>
            <label className="text-sm font-semibold">Size (px)</label>
            <input
              type="number"
              min={40}
              max={160}
              step={2}
              className="w-full rounded-lg border px-3 py-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value || 64))}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Accent Color</label>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Bubble Image URL (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://example.com/icon.png"
              value={img}
              onChange={(e) => setImg(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Bubble Shape</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={shape}
              onChange={(e) => setShape(e.target.value as any)}
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="oval">oval</option>
              <option value="chat">chat (speech bubble)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Image Fit</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={imageFit}
              onChange={(e) => setImageFit(e.target.value as any)}
            >
              <option value="cover">cover (fill bubble)</option>
              <option value="contain">contain (fit inside)</option>
              <option value="fill">fill (stretch)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Bubble Label</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Bubble Label Color</label>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Message Style</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={messageStyle}
              onChange={(e) => setMessageStyle(e.target.value as any)}
            >
              <option value="roundedCard">roundedCard (clean)</option>
              <option value="speechClassic">speechClassic (cartoon tail)</option>
              <option value="speechOval">speechOval (oval tail)</option>
              <option value="pill">pill (fully rounded)</option>
              <option value="glass">glass (translucent)</option>
              <option value="outlined">outlined (white + black outline)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Avatar Image (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://example.com/photo.jpg"
              value={avatarImage}
              onChange={(e) => setAvatarImage(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-semibold">Embed URL</label>
            <input
              readOnly
              value={widgetSrc}
              className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Embed URL"
            />
            <label className="text-sm font-semibold">Iframe Embed</label>
            <textarea
              readOnly
              className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
              rows={4}
              value={`<iframe src="${widgetSrc}" style="border:0;width:100%;height:560px" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>

      {/* Live area */}
      <div className="relative min-h-[70vh] rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 p-6 overflow-visible">
        <ChatWidget
          mode={mode}
          botId={instId.trim() ? undefined : botId}
          position={pos}
          size={size}
          color={color}
          image={img || undefined}
          shape={shape}
          imageFit={imageFit}
          labelText={labelText}
          labelColor={labelColor}
          messageStyle={messageStyle}
          avatarImage={avatarImage || undefined}
        />
      </div>
    </div>
  );
}
