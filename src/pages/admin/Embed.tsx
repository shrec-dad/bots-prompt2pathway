// src/pages/admin/Embed.tsx
import React, { useMemo, useState } from "react";

/** Copy helper */
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

export default function Embed() {
  // Instance-aware
  const [instId, setInstId] = useState("");

  // Core controls
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<Mode>("popup");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#8b5cf6");
  const [image, setImage] = useState<string>("");

  // NEW: shape + imageFit
  const [shape, setShape] = useState<"circle" | "rounded" | "square" | "oval" | "chat">("circle");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (instId.trim()) params.set("inst", instId.trim());
    else params.set("bot", botId);
    params.set("mode", mode);
    params.set("position", position);
    params.set("size", String(size));
    params.set("color", color);
    params.set("shape", shape);
    params.set("imageFit", imageFit);
    if (image.trim()) params.set("image", image.trim());
    return `${origin}/widget?${params.toString()}`;
  }, [origin, instId, botId, mode, position, size, color, shape, imageFit, image]);

  const iframeSnippet = useMemo(
    () =>
`<!-- Paste near </body> -->
<iframe
  src="${embedUrl}"
  title="Bot Widget"
  style="position: fixed; bottom: 24px; ${position === "bottom-right" ? "right" : "left"}: 24px;
         width: ${mode === "sidebar" ? "360px" : `${size}px`};
         height: ${mode === "sidebar" ? "100vh" : `${size}px`};
         border: 0; border-radius: ${mode === "sidebar" ? "0" : (shape === "square" ? "0" : "50%")}; z-index: 999999; overflow: hidden;"
  loading="lazy"
  allow="clipboard-read; clipboard-write"
></iframe>`,
    [embedUrl, size, mode, position, shape]
  );

  const reactSnippet = useMemo(
    () =>
`// Example inside React (local component). For specific instances, prefer the iframe (?inst=…)
import ChatWidget from "@/widgets/ChatWidget";

export default function App() {
  return (
    <div>
      <ChatWidget
        mode="${mode}"
        botId="${botId}"
        color="${color}"
        size={${size}}
        position="${position}"
        shape="${shape}"
        ${image ? `image="${image}"` : ""}
      />
    </div>
  );
}`,
    [mode, botId, color, size, position, shape, image]
  );

  const headerCard = "rounded-2xl border bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 p-6";
  const sectionCard = "rounded-2xl border bg-white/90 p-4 md:p-5 shadow-sm";
  const labelCls = "text-sm font-bold uppercase text-purple-700";
  const inputCls =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const codeBox = "mt-3 rounded-lg border bg-neutral-900 text-neutral-50 text-sm p-3 overflow-auto";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className={headerCard}>
        <h1 className="text-3xl font-extrabold">Embed Code</h1>
        <p className="mt-2 text-muted-foreground">
          Choose bot/instance and style options. Copy a snippet and paste into your site.
          <strong> Iframe</strong> works everywhere; <strong>React</strong> is for your own React apps.
        </p>
      </div>

      {/* Controls */}
      <div className={sectionCard}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className={labelCls}>Instance ID (optional)</div>
            <input
              className={inputCls}
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
              placeholder="inst_abc123…"
            />
            <div className="text-xs text-muted-foreground mt-1">
              If provided, overrides Bot ID.
            </div>
          </div>

          <div>
            <div className={labelCls}>Bot ID</div>
            <input
              className={inputCls}
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              placeholder="waitlist-bot"
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot ID ignored" : ""}
            />
          </div>

          <div>
            <div className={labelCls}>Mode</div>
            <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="popup">popup</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Position</div>
            <select
              className={inputCls}
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
              disabled={mode === "inline"}
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
            <div className={labelCls}>Accent Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Bubble Shape</div>
            <select className={inputCls} value={shape} onChange={(e) => setShape(e.target.value as any)}>
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="oval">oval</option>
              <option value="chat">chat (speech bubble)</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Bubble Image URL (optional)</div>
            <input
              className={inputCls}
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <div className={labelCls}>Image Fit</div>
            <select className={inputCls} value={imageFit} onChange={(e) => setImageFit(e.target.value as any)}>
              <option value="cover">cover</option>
              <option value="contain">contain</option>
            </select>
          </div>

          {/* Preview URL + Open */}
          <div className="md:col-span-2 flex items-center gap-2">
            <div className="flex-1">
              <div className={labelCls}>Preview URL</div>
              <input className={inputCls} value={embedUrl} readOnly />
            </div>
            <button
              onClick={() => window.open(embedUrl, "_blank")}
              className="px-3 py-2 rounded-md border bg-white hover:bg-muted/40 text-sm font-semibold mt-6"
            >
              Open
            </button>
          </div>
        </div>
      </div>

      {/* Iframe snippet */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">Universal Snippet (iframe)</div>
          <CopyButton getText={() => iframeSnippet} />
        </div>
        <pre className={codeBox}><code>{iframeSnippet}</code></pre>
        <p className="text-xs text-muted-foreground mt-2">
          Uses <code>/widget</code> with your options. Supports <code>?shape=</code> and <code>?imageFit=</code>.
        </p>
      </div>

      {/* React snippet */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">React Snippet (local component)</div>
          <CopyButton getText={() => reactSnippet} />
        </div>
        <pre className={codeBox}><code>{reactSnippet}</code></pre>
        <p className="text-xs text-muted-foreground mt-2">
          For a specific <strong>instance</strong>, prefer the iframe with <code>?inst=</code>.
        </p>
      </div>
    </div>
  );
}
