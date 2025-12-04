// src/pages/admin/Embed.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { listInstances, type InstanceMeta } from "@/lib/instances";
import { fetchBots, updateBot } from '@/store/botsSlice';
import { fetchInstances, updateInstance } from '@/store/botInstancesSlice';
import BotSelector from "@/components/BotSelector";

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
type Shape = "circle" | "rounded" | "square" | "oval" | "speech" | "speech-rounded";
type Fit = "cover" | "contain" | "fill" | "center" | "none";
type Mode = "popup" | "inline" | "sidebar";
type ImageFit = "cover" | "contain" | "center";
type PanelStyle = "step-by-step" | "conversation";

const BRAND_KEY = "brandingSettings";

/**
 * Branding as written by Preview.tsx in localStorage.
 * NOTE: Preview uses `chatHideLabelWhenImage` (not `hideLabelWhenImage`).
 */
type Branding = {
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number;
  chatBubblePosition: Pos;
  chatBubbleShape?: Shape;
  chatBubbleLabel?: string;
  chatBubbleLabelColor?: string;
  chatBubbleImageFit?: Fit | "cover" | "contain" | "center";
  /** matches Preview storage key */
  chatHideLabelWhenImage?: boolean;
};

function readBranding(): Branding {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return JSON.parse(raw) as Branding;
  } catch {}
  // defaults mirror Preview.tsx as closely as possible
  return {
    chatBubbleColor: "#7aa8ff",
    chatBubbleSize: 56,
    chatBubblePosition: "bottom-right",
    chatBubbleShape: "circle",
    chatBubbleLabel: "Chat",
    chatBubbleLabelColor: "#ffffff",
    chatBubbleImageFit: "cover",
    chatHideLabelWhenImage: false,
  };
}

export default function Embed() {
  const dispatch = useDispatch();

  const bots = useSelector((state: RootState) => state.bots.list);
  const instances = useSelector((state: RootState) => state.instances.list);

  const [instId, setInstId] = useState<string>("");
  const [botId, setBotId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchInstances());
  }, [dispatch]);

  useEffect(() => {
    let b = null;
    if (instId) {
      b = instances.find((m) => m._id == instId)?.branding
    }
    if (botId) {
      b = bots.find((b) => b._id == botId)?.branding 
    }

    setMode(b?.mode || "popup");
    setPos(b?.pos || "bottom-left");
    setSize(b?.size || 56);
    setBgColor(b?.bgColor || "#7aa8ff");
    setImg(b?.img || "");
    setShape(b?.shape || "circle");
    setImageFit(b?.imageFit || "cover");
    setLabel(b?.label || "Chat");
    setLabelColor(b?.labelColor || "#ffffff");
    setHideLabelWhenImage(b?.hideLabelWhenImage || false);
    setPanelStyle(b?.panelStyle || "step-by-step");
    setBorderColor(b?.borderColor || "#000000");
    setBotAvatar(b?.botAvatar || "");
  }, [instId, botId]);

  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-left");
  const [size, setSize] = useState<number>(56);
  const [bgColor, setBgColor] = useState<string>("#7aa8ff");
  const [img, setImg] = useState<string>("");
  const [shape, setShape] = useState<Shape>("circle");
  const [imageFit, setImageFit] = useState<ImageFit>("cover");
  const [label, setLabel] = useState<string>("Chat");
  const [labelColor, setLabelColor] = useState<string>("#ffffff");
  const [hideLabelWhenImage, setHideLabelWhenImage] = useState<boolean>(false);
  const [panelStyle, setPanelStyle] = useState<PanelStyle>("step-by-step");
  const [borderColor, setBorderColor] = useState<string>("#000000");
  const [botAvatar, setBotAvatar] = useState<string>("");

  const [syncWithPreview, setSyncWithPreview] = useState(true);

  // keep in sync if Preview saves
  useEffect(() => {
    if (!syncWithPreview) return;
    let b = null;
    if (instId) {
      b = instances.find((m) => m._id == instId)?.branding
    }
    if (botId) {
      b = bots.find((b) => b._id == botId)?.branding 
    }
    
    setMode(b?.mode || "popup");
    setPos(b?.pos || "bottom-left");
    setSize(b?.size || 56);
    setBgColor(b?.bgColor || "#7aa8ff");
    setImg(b?.img || "");
    setShape(b?.shape || "circle");
    setImageFit(b?.imageFit || "cover");
    setLabel(b?.label || "Chat");
    setLabelColor(b?.labelColor || "#ffffff");
    setHideLabelWhenImage(b?.hideLabelWhenImage || false);
    setPanelStyle(b?.panelStyle || "step-by-step");
    setBorderColor(b?.borderColor || "#000000");
    setBotAvatar(b?.botAvatar || "");
  }, [syncWithPreview]);


  /* Helpers to read the "active" visual state */
  const active = useMemo(() => {
    if (syncWithPreview) {
      let b = null;
      if (instId) {
        b = instances.find((m) => m._id == instId)?.branding
      }
      if (botId) {
        b = bots.find((b) => b._id == botId)?.branding 
      }

      return {
        pos: (b?.pos as Pos) ?? "bottom-right",
        size: b?.size ?? 56,
        bgColor: b?.bgColor ?? "#7aa8ff",
        img: b?.img ?? "",
        shape: (b?.shape as Shape) ?? "circle",
        imageFit: (b?.imageFit as Fit) ?? "cover",
        label: b?.label ?? "Chat",
        labelColor: b?.labelColor ?? "#ffffff",
        panelStyle: (b?.panelStyle as PanelStyle) || "step-by-step",
        borderColor: b?.borderColor || "#000000",
        botAvatar: b?.botAvatar ?? "",
        hideLabelWhenImage: !!b?.hideLabelWhenImage
      };
    }
    return {
      pos,
      size,
      bgColor,
      img,
      shape,
      imageFit,
      label,
      labelColor,
      panelStyle,
      borderColor,
      botAvatar,
      hideLabelWhenImage,
    };
  }, [
    syncWithPreview,
    mode,
    pos,
    size,
    bgColor,
    img,
    shape,
    imageFit,
    label,
    labelColor,
    panelStyle,
    borderColor,
    botAvatar,
    hideLabelWhenImage,
  ]);

  /* Upload/Clear handlers (local only; Preview already persists uploads) */
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => !syncWithPreview && setImg(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  function onClearImage() {
    if (!syncWithPreview) setImg("");
  }

  /* URL for iframe/src */
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const widgetPath = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId) qp.set("inst", instId);
    else if (botId) qp.set("bot", botId);
    
    qp.set("mode", mode);

    qp.set("pos", active.pos);
    qp.set("size", String(active.size));
    qp.set("shape", active.shape);
    qp.set("imageFit", active.imageFit);
    qp.set("panelStyle", active.panelStyle);

    if (active.bgColor) qp.set("bgColor", active.bgColor);
    if (active.img) qp.set("img", active.img);
    if (active.shape) qp.set("shape", active.shape);
    if (active.imageFit) qp.set("imageFit", active.imageFit);
    if (!(active.img && active.hideLabelWhenImage)) {
      if (active.label) qp.set("label", active.label);
      if (active.labelColor) qp.set("labelColor", active.labelColor);
    }
    if (active.botAvatar.trim()) qp.set("botAvatar", active.botAvatar.trim());

    return `/widget?${qp.toString()}`;
  }, [instId, botId, mode, active]);

  const apiBase = import.meta.env.VITE_API_BASE_URL || origin;
  const embedUrl = `${apiBase}${widgetPath}`;

  /* Snippets */
  const iframeSnippet = useMemo(
    () =>
      `<!-- Paste near the end of <body> -->
<iframe
  src="${embedUrl}"
  title="Bot Widget"
  style="position: fixed; bottom: 24px; ${active.pos === "bottom-right" ? "right" : "left"}: 24px;
         width: ${mode === "sidebar" ? "360px" : `${active.size}px`};
         height: ${mode === "sidebar" ? "100vh" : `${active.size}px`};
         border: 0; border-radius: ${mode === "sidebar" ? "0" : active.shape === "circle" ? "50%" : active.shape === "rounded" ? "16px" : active.shape === "square" ? "8px" : "9999px"};
         z-index: 999999; overflow: hidden;"
  loading="lazy"
  allow="clipboard-read; clipboard-write"
></iframe>`,
    [embedUrl, active.pos, active.size, active.shape, mode]
  );

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
  iframe.style.${active.pos === "bottom-right" ? "right" : "left"} = '24px';
  iframe.style.width = '${mode === "sidebar" ? "360px" : `${active.size}px`}';
  iframe.style.height = '${mode === "sidebar" ? "100vh" : `${active.size}px`}';
  iframe.style.border = '0';
  iframe.style.borderRadius = '${mode === "sidebar" ? "0" : active.shape === "circle" ? "50%" : active.shape === "rounded" ? "16px" : active.shape === "square" ? "8px" : "9999px"}';
  iframe.style.zIndex = '999999';
  iframe.style.overflow = 'hidden';
  iframe.loading = 'lazy';
  document.body.appendChild(iframe);
})();
</script>`,
    [embedUrl, active.pos, active.size, active.shape, mode]
  );

  /* UI helpers - UPDATED WITH BOLD STYLING */
  const headerCard =
    "rounded-2xl border-[3px] border-black/80 shadow-[0_6px_0_rgba(0,0,0,0.8)] bg-white px-5 py-4 mb-6";
  const sectionCard = "rounded-2xl border-[3px] border-black/80 shadow-[0_4px_0_rgba(0,0,0,0.8)] bg-card p-4 md:p-5";
  const labelCls = "text-sm font-bold uppercase text-purple-700";
  const inputCls =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const codeBox =
    "mt-3 rounded-lg border bg-neutral-900 text-neutral-50 text-sm p-3 overflow-auto";

  const controlsDisabled = syncWithPreview;

  return (
    <div className="p-6 space-y-6">
      <div className={headerCard}>
        <div className="h-2 rounded-md bg-black mb-4" />
        <h1 className="text-3xl font-extrabold">Embed Code</h1>
        <p className="mt-2 text-foreground/80">
          Choose your bot or a saved instance, then copy a snippet. By default,
          this page <strong>uses the look you saved on Preview</strong>. Toggle
          off to override visuals just for this snippet.
        </p>
      </div>

      <div className={sectionCard}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold">Sync with Preview look</label>
            <input
              type="checkbox"
              checked={syncWithPreview}
              onChange={(e) => setSyncWithPreview(e.target.checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Instance via BotSelector */}
          <div>
            <div className={labelCls}>Instance (overrides Bot)</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <BotSelector
                  scope="instance"
                  instances={instances}
                  value={instId}
                  onChange={(v) => setInstId(v.id)}
                  placeholderOption="— None (use Bot) —"
                />
              </div>
              {/* Quick clear */}
              <button
                className="px-3 py-2 rounded-lg border bg-white text-sm font-semibold"
                onClick={() => setInstId("")}
                title="Clear instance selection"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Bot via BotSelector */}
          <div>
            <div className={labelCls}>Bot</div>
            <BotSelector
              scope="template"
              templates={bots}
              value={botId}
              onChange={(v) => setBotId(v.id)}
              disabled={!!instId}
            />
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
              value={active.pos}
              onChange={(e) => setPos(e.target.value as Pos)}
              disabled={controlsDisabled}
              title={controlsDisabled ? "Controlled by Preview" : ""}
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
              value={active.size}
              onChange={(e) => setSize(Number(e.target.value || 64))}
              disabled={controlsDisabled || mode === "sidebar"}
              title={
                controlsDisabled
                  ? "Controlled by Preview"
                  : mode === "sidebar"
                  ? "Not used for sidebar"
                  : ""
              }
            />
          </div>

          {/* Color */}
          <div>
            <div className={labelCls}>Accent Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={active.bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              disabled={controlsDisabled}
              title={controlsDisabled ? "Controlled by Preview" : ""}
            />
          </div>

          {/* Image + upload/clear */}
          <div className="md:col-span-3">
            <div className={labelCls}>Bubble Image (optional)</div>
            <div className="flex items-center gap-3">
              <input
                className={inputCls + " flex-1"}
                placeholder="https://example.com/icon.png  — or use Upload"
                value={active.img}
                onChange={(e) => setImg(e.target.value)}
                disabled={controlsDisabled}
              />
              <label
                className={
                  "rounded-lg border px-3 py-2 font-semibold cursor-pointer bg-white " +
                  (controlsDisabled ? "opacity-50 cursor-not-allowed" : "")
                }
              >
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                  disabled={controlsDisabled}
                />
              </label>
              <button
                className="rounded-lg border px-3 py-2 font-semibold bg-white"
                onClick={onClearImage}
                disabled={controlsDisabled}
                title={controlsDisabled ? "Controlled by Preview" : "Clear image"}
              >
                Clear
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={active.hideLabelWhenImage}
                onChange={(e) => setHideLabelWhenImage(e.target.checked)}
                disabled={controlsDisabled}
              />
              Hide label when an image is used
            </label>
          </div>

          {/* Shape / Fit / Label / Label Color / Avatar */}
          <div>
            <div className={labelCls}>Bubble Shape</div>
            <select
              className={inputCls}
              value={active.shape}
              onChange={(e) => setShape(e.target.value as Shape)}
              disabled={controlsDisabled}
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="oval">oval</option>
              <option value="speech">speech (round)</option>
              <option value="speech-rounded">speech (rounded)</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Image Fit</div>
            <select
              className={inputCls}
              value={active.imageFit}
              onChange={(e) => setImageFit(e.target.value as ImageFit)}
              disabled={controlsDisabled}
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
              value={active.label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={controlsDisabled || (!!active.img && active.hideLabelWhenImage)}
              title={controlsDisabled ? "Controlled by Preview" : ""}
            />
          </div>

          <div>
            <div className={labelCls}>Label Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={active.labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
              disabled={controlsDisabled || (!!active.img && active.hideLabelWhenImage)}
              title={controlsDisabled ? "Controlled by Preview" : ""}
            />
          </div>

          <div className="md:col-span-2">
            <div className={labelCls}>Bot Avatar (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/avatar.jpg"
              value={active.botAvatar}
              onChange={(e) => setBotAvatar(e.target.value)}
              disabled={syncWithPreview}
            />
          </div>

          <div>
            <label className={labelCls}>Border Color</label>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={active.borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Panel Style</label>
            <select
              className={inputCls}
              value={active.panelStyle}
              onChange={(e) => setPanelStyle(e.target.value as PanelStyle)}
            >
              <option value="step-by-step">Step by Step</option>
              <option value="conversation">Conversation</option>
            </select>
          </div>

          {/* Preview URL */}
          <div className="md:col-span-3">
            <div className={labelCls}>Preview URL</div>
            <input
              className={inputCls}
              value={embedUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
            />
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
          Paste near the end of <code>&lt;body&gt;</code>. This renders the floating bubble using
          <code> /widget</code> with your selected options.
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
          Use this when your platform doesn't let you add raw iframes in a good spot. It injects the
          iframe programmatically at the end of <code>&lt;body&gt;</code>.
        </p>
      </div>
    </div>
  );
}
