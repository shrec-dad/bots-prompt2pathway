// src/pages/admin/Embed.tsx
import React, { useMemo, useState } from "react";

/** Simple helper to copy text to clipboard with quick feedback. */
function CopyButton({ getText }: { getText: () => string }) {
  const [label, setLabel] = useState("Copy");
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setLabel("Copied!");
      setTimeout(() => setLabel("Copy"), 1200);
    } catch {
      setLabel("Failed");
      setTimeout(() => setLabel("Copy"), 1500);
    }
  }
  return (
    <button
      onClick={onCopy}
      className="px-3 py-1 rounded-md border bg-white hover:bg-muted/40 text-sm font-semibold"
    >
      {label}
    </button>
  );
}

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "oval" | "square";
type Fit = "cover" | "contain";
type MsgStyle =
  | "outlined-black"
  | "accent-yellow"
  | "modern-soft"
  | "pill"
  | "rounded-rect"
  | "minimal-outline";

export default function Embed() {
  // Core install fields
  const [botId, setBotId] = useState("waitlist-bot");
  const [instId, setInstId] = useState(""); // optional instance override
  const [mode, setMode] = useState<Mode>("popup");
  const [position, setPosition] = useState<Pos>("bottom-right");
  const [size, setSize] = useState(64);

  // Bubble visuals
  const [shape, setShape] = useState<Shape>("circle");
  const [color, setColor] = useState("#7aa8ff");
  const [image, setImage] = useState("");
  const [imageFit, setImageFit] = useState<Fit>("cover");
  const [label, setLabel] = useState("Chat");
  const [labelColor, setLabelColor] = useState("#ffffff");

  // Transcript visuals
  const [messageStyle, setMessageStyle] = useState<MsgStyle>("outlined-black");
  const [botAvatar, setBotAvatar] = useState("");

  // Build the /widget URL for your current site (works locally + Lovable preview)
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("mode", mode);
    qp.set("position", position);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    qp.set("messageStyle", messageStyle);

    if (color) qp.set("color", color);
    if (label) qp.set("label", label);
    if (labelColor) qp.set("labelColor", labelColor);
    if (image.trim()) qp.set("image", image.trim());
    if (botAvatar.trim()) qp.set("botAvatar", botAvatar.trim());

    return `${origin}/widget?${qp.toString()}`;
  }, [
    origin,
    instId,
    botId,
    mode,
    position,
    size,
    shape,
    imageFit,
    messageStyle,
    color,
    label,
    labelColor,
    image,
    botAvatar,
  ]);

  // ---- Snippets ------------------------------------------------------------
  const iframeSnippet = useMemo(
    () =>
`<!-- Paste near the end of your <body>. The iframe points to /widget and carries your options as query params. -->
<iframe
  src="${embedUrl}"
  title="Bot Widget"
  style="position: ${mode === "inline" ? "static" : "fixed"};
         ${mode === "inline" ? "" : `bottom: 24px; ${position === "bottom-right" ? "right" : "left"}: 24px;`}
         width: ${mode === "sidebar" ? "380px" : mode === "inline" ? "100%" : `${shape === "oval" ? Math.round(size * 1.55) : size}px`};
         height: ${mode === "sidebar" ? "100vh" : mode === "inline" ? "560px" : `${shape === "oval" ? Math.round(size * 0.9) : size}px`};
         border: 0; border-radius: ${mode === "sidebar" ? "0" : "12px"};
         z-index: 999999; overflow: hidden;"
  loading="lazy"
  allow="clipboard-read; clipboard-write"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`,
    [embedUrl, mode, position, size, shape]
  );

  const reactSnippet = useMemo(
    () =>
`// Example usage inside a React app (uses your local ChatWidget component)
import ChatWidget from "@/widgets/ChatWidget";

export default function App() {
  return (
    <>
      {/* ...your app... */}
      <ChatWidget
        mode="${mode}"
        botId="${botId}"
        position="${position}"
        size={${size}}
        shape="${shape}"
        color="${color}"
        image="${image}"
        imageFit="${imageFit}"
        label="${label}"
        labelColor="${labelColor}"
        messageStyle="${messageStyle}"
        botAvatarUrl="${botAvatar}"
      />
    </>
  );
}`,
    [
      mode,
      botId,
      position,
      size,
      shape,
      color,
      image,
      imageFit,
      label,
      labelColor,
      messageStyle,
      botAvatar,
    ]
  );

  // UI classes
  const headerCard =
    "rounded-2xl border bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 p-6";
  const sectionCard = "rounded-2xl border bg-white/90 p-4 md:p-5 shadow-sm";
  const labelCls = "text-sm font-bold uppercase text-purple-700";
  const inputCls =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const codeBox =
    "mt-3 rounded-lg border bg-neutral-900 text-neutral-50 text-sm p-3 overflow-auto";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className={headerCard}>
        <h1 className="text-3xl font-extrabold">Embed Code</h1>
        <p className="mt-2 text-muted-foreground">
          Choose your bot and style options. Copy one of the snippets below and paste it
          into your website. The <strong>iframe</strong> snippet works everywhere.
          The <strong>React</strong> snippet is best for React projects using your local components.
        </p>
      </div>

      {/* Controls */}
      <div className={sectionCard}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className={labelCls}>Instance ID (optional)</div>
            <input
              className={inputCls}
              placeholder="inst_abc123…"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              If provided, Instance overrides Bot ID.
            </div>
          </div>

          <div>
            <div className={labelCls}>Bot ID</div>
            <input
              className={inputCls}
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot ID ignored" : "Enter a bot id"}
            />
          </div>

          <div>
            <div className={labelCls}>Mode</div>
            <select
              className={inputCls}
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline (in-page)</option>
              <option value="sidebar">sidebar (full height right)</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Position</div>
            <select
              className={inputCls}
              value={position}
              onChange={(e) => setPosition(e.target.value as Pos)}
              disabled={mode === "inline"}
              title={mode === "inline" ? "Position is not used for inline mode" : ""}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Size (px)</div>
            <input
              type="number"
              min={40}
              max={160}
              step={2}
              className={inputCls}
              value={size}
              onChange={(e) => setSize(Number(e.target.value || 64))}
              disabled={mode === "sidebar"}
              title={mode === "sidebar" ? "Size is not used for sidebar mode" : ""}
            />
          </div>

          <div>
            <div className={labelCls}>Bubble Shape</div>
            <select
              className={inputCls}
              value={shape}
              onChange={(e) => setShape(e.target.value as Shape)}
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="oval">oval (pill)</option>
              <option value="square">square</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Bubble Image URL (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/icon.png"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Image Fit</div>
            <select
              className={inputCls}
              value={imageFit}
              onChange={(e) => setImageFit(e.target.value as Fit)}
            >
              <option value="cover">cover (fill bubble)</option>
              <option value="contain">contain (show entire image)</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Bubble Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Bubble Label</div>
            <input
              className={inputCls}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Bubble Label Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Message Style</div>
            <select
              className={inputCls}
              value={messageStyle}
              onChange={(e) => setMessageStyle(e.target.value as MsgStyle)}
            >
              <option value="outlined-black">outlined-black</option>
              <option value="accent-yellow">accent-yellow</option>
              <option value="modern-soft">modern-soft</option>
              <option value="pill">pill</option>
              <option value="rounded-rect">rounded-rect</option>
              <option value="minimal-outline">minimal-outline</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className={labelCls}>Bot Avatar URL (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/photo.jpg"
              value={botAvatar}
              onChange={(e) => setBotAvatar(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Real photo or logo — shows next to bot messages.
            </div>
          </div>

          <div>
            <div className={labelCls}>Preview URL</div>
            <input className={inputCls} value={embedUrl} readOnly />
          </div>
        </div>
      </div>

      {/* Iframe snippet */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">Universal Snippet (iframe)</div>
          <CopyButton getText={() => iframeSnippet} />
        </div>
        <pre className={codeBox}>
          <code>{iframeSnippet}</code>
        </pre>
      </div>

      {/* React snippet */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">React Snippet (uses local component)</div>
          <CopyButton getText={() => reactSnippet} />
        </div>
        <pre className={codeBox}>
          <code>{reactSnippet}</code>
        </pre>
      </div>
    </div>
  );
}
