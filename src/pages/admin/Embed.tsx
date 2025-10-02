// src/pages/admin/Embed.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAdminStore } from "@/lib/AdminStore";
import { listInstances } from "@/lib/instances";

/**
 * Small copy button with success/fail feedback
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
      aria-label="Copy to clipboard"
      title="Copy to clipboard"
    >
      {label}
    </button>
  );
}

type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval";
type Fit = "cover" | "contain" | "fill" | "center" | "none";
type Mode = "popup" | "inline" | "sidebar";

type SavedInstance = {
  id: string;
  name?: string;
  bot?: string;
  mode?: string;
  createdAt?: number;
  position?: Pos;
  size?: number;
  color?: string;
  image?: string;
  shape?: Shape;
  imageFit?: Fit;
  label?: string;
  labelColor?: string;
  avatar?: string;
};

export default function Embed() {
  /* ------------------------------------------------------------------ */
  /* Data sources                                                        */
  /* ------------------------------------------------------------------ */
  const { bots } = useAdminStore();
  const [instances, setInstances] = useState<SavedInstance[]>([]);

  useEffect(() => {
    try {
      const list = listInstances?.() ?? [];
      setInstances(
        list.map((i: any) => ({
          id: String(i.id),
          name: i.name ?? i.title ?? i.id,
          bot: i.bot,
          mode: i.mode,
          createdAt: i.createdAt,
          position: i.position,
          size: i.size,
          color: i.color,
          image: i.image,
          shape: i.shape,
          imageFit: i.imageFit,
          label: i.label,
          labelColor: i.labelColor,
          avatar: i.avatar,
        }))
      );
    } catch {
      setInstances([]);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* Controls                                                            */
  /* ------------------------------------------------------------------ */
  const defaultBot = bots?.[0]?.id ?? "waitlist-bot";

  // Selection: Instance overrides Bot when set
  const [instId, setInstId] = useState<string>("");
  const [botId, setBotId] = useState<string>(defaultBot);

  // Placement/visuals (mirrors Widget options)
  const [mode, setMode] = useState<Mode>("popup"); // embed supports any, widget will read query
  const [position, setPosition] = useState<Pos>("bottom-right");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#8b5cf6");
  const [image, setImage] = useState("");

  const [shape, setShape] = useState<Shape>("circle");
  const [imageFit, setImageFit] = useState<Fit>("cover");
  const [label, setLabel] = useState("Chat");
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [avatar, setAvatar] = useState("");

  // If you want to load visual defaults from a selected instance:
  useEffect(() => {
    if (!instId) return;
    const found = instances.find((i) => i.id === instId);
    if (!found) return;
    // Pre-fill visuals if present (non-destructive)
    if (found.position) setPosition(found.position);
    if (typeof found.size === "number") setSize(found.size!);
    if (found.color) setColor(found.color);
    if (found.image) setImage(found.image);
    if (found.shape) setShape(found.shape);
    if (found.imageFit) setImageFit(found.imageFit);
    if (found.label) setLabel(found.label);
    if (found.labelColor) setLabelColor(found.labelColor);
    if (found.avatar) setAvatar(found.avatar);
  }, [instId, instances]);

  /* ------------------------------------------------------------------ */
  /* URL (for iframe/src)                                                */
  /* ------------------------------------------------------------------ */
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const widgetPath = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("position", position);
    qp.set("size", String(size));
    if (color) qp.set("color", color);
    if (image) qp.set("image", image);
    if (shape) qp.set("shape", shape);
    if (imageFit) qp.set("imageFit", imageFit);
    if (label) qp.set("label", label);
    if (labelColor) qp.set("labelColor", labelColor);
    if (avatar) qp.set("avatar", avatar);

    // mode is a rendering hint; /widget currently drives popup UI. Keeping it in case you branch later.
    qp.set("mode", mode);

    return `/widget?${qp.toString()}`;
  }, [instId, botId, position, size, color, image, shape, imageFit, label, labelColor, avatar, mode]);

  const embedUrl = `${origin}${widgetPath}`;

  /* ------------------------------------------------------------------ */
  /* Snippets                                                            */
  /* ------------------------------------------------------------------ */
  const iframeSnippet = useMemo(
    () =>
      `<!-- Paste near the end of <body> -->
<iframe
  src="${embedUrl}"
  title="Bot Widget"
  style="position: fixed; bottom: 24px; ${position === "bottom-right" ? "right" : "left"}: 24px;
         width: ${mode === "sidebar" ? "360px" : `${size}px`};
         height: ${mode === "sidebar" ? "100vh" : `${size}px`};
         border: 0; border-radius: ${mode === "sidebar" ? "0" : shape === "circle" ? "50%" : shape === "rounded" ? "16px" : shape === "square" ? "8px" : "9999px"}; 
         z-index: 999999; overflow: hidden;"
  loading="lazy"
  allow="clipboard-read; clipboard-write"
></iframe>`,
    [embedUrl, position, size, mode, shape]
  );

  // Script embed injects the iframe dynamically (great for CMS, page builders)
  const scriptSnippet = useMemo(
    () =>
      `<!-- Drop anywhere in <body> -->
<script>
(function(){
  var iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.title = 'Bot Widget';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '24px';
  iframe.style.${position === "bottom-right" ? "right" : "left"} = '24px';
  iframe.style.width = '${mode === "sidebar" ? "360px" : `${size}px`}';
  iframe.style.height = '${mode === "sidebar" ? "100vh" : `${size}px`}';
  iframe.style.border = '0';
  iframe.style.borderRadius = '${mode === "sidebar" ? "0" : shape === "circle" ? "50%" : shape === "rounded" ? "16px" : shape === "square" ? "8px" : "9999px"}';
  iframe.style.zIndex = '999999';
  iframe.style.overflow = 'hidden';
  iframe.loading = 'lazy';
  document.body.appendChild(iframe);
})();
</script>`,
    [embedUrl, position, size, mode, shape]
  );

  /* ------------------------------------------------------------------ */
  /* UI styling helpers                                                  */
  /* ------------------------------------------------------------------ */
  const headerCard =
    "rounded-2xl border bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 p-6";
  const sectionCard = "rounded-2xl border bg-white/90 p-4 md:p-5 shadow-sm";
  const labelCls = "text-sm font-bold uppercase text-purple-700";
  const inputCls =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const codeBox =
    "mt-3 rounded-lg border bg-neutral-900 text-neutral-50 text-sm p-3 overflow-auto";

  const activeBotName =
    bots?.find((b) => b.id === botId)?.name ??
    botId.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className={headerCard}>
        <h1 className="text-3xl font-extrabold">Embed Code</h1>
        <p className="mt-2 text-muted-foreground">
          Choose your bot or a saved instance, set visual options, then copy a snippet.
          The <strong>iframe</strong> works everywhere. The <strong>script embed</strong> is great for CMS/landing pages.
        </p>
      </div>

      {/* Selection + Controls */}
      <div className={sectionCard}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Instance */}
          <div>
            <div className={labelCls}>Instance (overrides Bot)</div>
            <select
              className={inputCls}
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
              title="Pick a saved Instance to embed"
            >
              <option value="">— None (use Bot) —</option>
              {instances.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name || i.id} {i.bot ? `• ${i.bot}` : ""} {i.mode ? `• ${i.mode}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Bot */}
          <div>
            <div className={labelCls}>Bot</div>
            <select
              className={inputCls}
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot is ignored" : "Choose a template bot"}
            >
              {bots?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              )) || <option value={botId}>{activeBotName}</option>}
            </select>
          </div>

          {/* Mode */}
          <div>
            <div className={labelCls}>Mode</div>
            <select
              className={inputCls}
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline (place in page)</option>
              <option value="sidebar">sidebar (full height)</option>
            </select>
          </div>

          {/* Position */}
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

          {/* Size */}
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

          {/* Color */}
          <div>
            <div className={labelCls}>Accent Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          {/* Image */}
          <div className="md:col-span-3">
            <div className={labelCls}>Bubble Image URL (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/icon.png"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          {/* Shape / Fit / Label / Label Color / Avatar */}
          <div>
            <div className={labelCls}>Bubble Shape</div>
            <select
              className={inputCls}
              value={shape}
              onChange={(e) => setShape(e.target.value as Shape)}
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="oval">oval</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Image Fit</div>
            <select
              className={inputCls}
              value={imageFit}
              onChange={(e) => setImageFit(e.target.value as Fit)}
            >
              <option value="cover">cover (fill bubble)</option>
              <option value="contain">contain</option>
              <option value="fill">fill (stretch)</option>
              <option value="center">center (no scale)</option>
              <option value="none">none</option>
            </select>
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
            <div className={labelCls}>Label Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <div className={labelCls}>Header Avatar (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>

          {/* Preview URL */}
          <div className="md:col-span-3">
            <div className={labelCls}>Preview URL</div>
            <input className={inputCls} value={embedUrl} readOnly onFocus={(e)=>e.currentTarget.select()} />
          </div>
        </div>
      </div>

      {/* Snippets */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">Universal Snippet (iframe)</div>
          <CopyButton getText={() => iframeSnippet} />
        </div>
        <pre className={codeBox}>
          <code>{iframeSnippet}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Paste near the end of <code>&lt;body&gt;</code>. This renders the floating bubble using{" "}
          <code>/widget</code> with your selected options.
        </p>
      </div>

      <div className={sectionCard}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">Script Embed (auto-injects the iframe)</div>
          <CopyButton getText={() => scriptSnippet} />
        </div>
        <pre className={codeBox}>
          <code>{scriptSnippet}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Use this when your platform doesn’t let you add raw iframes in a good spot. It injects the
          iframe programmatically at the end of <code>&lt;body&gt;</code>.
        </p>
      </div>
    </div>
  );
}
