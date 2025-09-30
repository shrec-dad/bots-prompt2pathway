// src/pages/admin/Embed.tsx
import React, { useMemo, useState } from "react";

/**
 * Simple helper to copy text to clipboard and give quick feedback.
 */
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

export default function Embed() {
  // NEW: optional Instance ID (when present, embed code uses ?inst=... instead of ?bot=...)
  const [instId, setInstId] = useState("");

  // Basic controls the user can tweak
  const [botId, setBotId] = useState("waitlist-bot");
  const [mode, setMode] = useState<"popup" | "inline" | "sidebar">("popup");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#8b5cf6"); // purple-ish
  const [image, setImage] = useState<string>(""); // optional bubble image URL

  // Make an embed URL to your local widget route.
  // Works in dev and on Lovable preview because it uses the current origin.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();

    // Instance-aware selector
    if (instId.trim()) {
      params.set("inst", instId.trim());
    } else {
      params.set("bot", botId);
    }

    // Common widget display params (Widget supports these via URL overrides)
    params.set("mode", mode);
    params.set("position", position);
    params.set("size", String(size));
    params.set("color", color);
    if (image.trim()) params.set("image", image.trim());

    return `${origin}/widget?${params.toString()}`;
  }, [origin, instId, botId, mode, position, size, color, image]);

  // ---- Snippets ------------------------------------------------------------
  const iframeSnippet = useMemo(
    () =>
`<!-- Paste this where you want the chat to appear (usually right before </body>) -->
<iframe
  src="${embedUrl}"
  title="Bot Widget"
  style="position: fixed; bottom: 24px; ${position === "bottom-right" ? "right" : "left"}: 24px;
         width: ${mode === "sidebar" ? "360px" : `${size}px`};
         height: ${mode === "sidebar" ? "100vh" : `${size}px`};
         border: 0; border-radius: ${mode === "sidebar" ? "0" : "50%"}; z-index: 999999; overflow: hidden;"
  loading="lazy"
  allow="clipboard-read; clipboard-write"
></iframe>`,
    [embedUrl, size, mode, position]
  );

  // React snippet (uses local ChatWidget component; template-based only).
  // NOTE: If you're targeting a specific instance, prefer the iframe snippet above,
  // which already carries ?inst=... in its URL.
  const reactSnippet = useMemo(
    () =>
`// Example usage inside a React app (using your local component)
import ChatWidget from "@/widgets/ChatWidget";

export default function App() {
  return (
    <div>
      {/* ...your app... */}
      <ChatWidget
        mode="${mode}"
        botId="${botId}"
        color="${color}"
        size={${size}}
        position="${position}"
        ${image ? `image="${image}"` : ""}
      />
    </div>
  );
}
// If you need to embed a specific *instance*, use the iframe snippet with ?inst=...`,
    [mode, botId, color, size, position, image]
  );

  // --------------------------------------------------------------------------

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
          Choose your bot or a saved instance and style options. Copy one of the snippets below and paste it
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
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
              placeholder="inst_abc123…"
            />
            <div className="text-xs text-muted-foreground mt-1">
              If provided, this overrides Bot ID and embeds that specific duplicated bot.
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
            <select
              className={inputCls}
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline (place in page)</option>
              <option value="sidebar">sidebar (full height)</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Position</div>
            <select
              className={inputCls}
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
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
            <div className={labelCls}>Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
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

          <div className="md:col-span-2">
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
        <p className="text-xs text-muted-foreground mt-2">
          Paste this near the end of your <code>&lt;body&gt;</code>. The iframe points to{" "}
          <code>/widget</code> and carries your selected options as query params. If an{" "}
          <code>Instance ID</code> is provided, it uses <code>?inst=…</code>; otherwise it uses{" "}
          <code>?bot=…</code>.
        </p>
      </div>

      {/* React snippet */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">React Snippet (uses your local component)</div>
          <CopyButton getText={() => reactSnippet} />
        </div>
        <pre className={codeBox}>
          <code>{reactSnippet}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          This uses your existing <code>src/widgets/ChatWidget.tsx</code> component and a{" "}
          <code>botId</code>. To embed a specific <strong>instance</strong>, prefer the iframe snippet
          above (it already includes <code>?inst=…</code> in the URL).
        </p>
      </div>
    </div>
  );
}
