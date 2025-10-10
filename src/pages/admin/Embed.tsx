// src/pages/admin/Embed.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listInstances, type InstanceMeta } from "@/lib/instances";
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

const BRAND_KEY = "brandingSettings";

type Branding = {
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number;
  chatBubblePosition: Pos;
  chatBubbleShape?: Shape;
  chatBubbleLabel?: string;
  chatBubbleLabelColor?: string;
  chatBubbleImageFit?: Fit | "cover" | "contain" | "center";
  hideLabelWhenImage?: boolean;
};

/** Normalize BotSelector values (string | object) -> string id/key */
function normalizeSelectionToString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const anyV = v as any;
    if (typeof anyV.id === "string") return anyV.id;
    if (typeof anyV.value === "string") return anyV.value;
    if (typeof anyV.key === "string") return anyV.key;
  }
  return "";
}

function readBranding(): Branding {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    chatBubbleColor: "#7aa8ff",
    chatBubbleSize: 56,
    chatBubblePosition: "bottom-right",
    chatBubbleShape: "circle",
    chatBubbleLabel: "Chat",
    chatBubbleLabelColor: "#ffffff",
    chatBubbleImageFit: "cover",
    hideLabelWhenImage: false,
  };
}

export default function Embed() {
  /* Data sources */
  const [instances, setInstances] = useState<SavedInstance[]>([]);

  useEffect(() => {
    try {
      const list = listInstances?.() ?? [];
      setInstances(
        list.map((i: InstanceMeta) => ({
          id: String(i.id),
          name: i.name ?? (i as any).title ?? i.id,
          bot: i.bot,
          mode: i.mode,
          createdAt: i.createdAt,
          position: (i as any).position,
          size: (i as any).size,
          color: (i as any).color,
          image: (i as any).image,
          shape: (i as any).shape,
          imageFit: (i as any).imageFit,
          label: (i as any).label,
          labelColor: (i as any).labelColor,
          avatar: (i as any).avatar,
        }))
      );
    } catch {
      setInstances([]);
    }
  }, []);

  /* Selection */
  const [instId, setInstId] = useState<string>(""); // always store a string
  const [botKey, setBotKey] = useState<string>("Waitlist");

  /* Sync with Preview (brandingSettings) */
  const [syncWithPreview, setSyncWithPreview] = useState(true);
  const [branding, setBranding] = useState<Branding>(() => readBranding());

  // keep in sync if Preview saves
  useEffect(() => {
    if (!syncWithPreview) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === BRAND_KEY) setBranding(readBranding());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncWithPreview]);

  /* Local overrides (used when syncWithPreview = false) */
  const [mode, setMode] = useState<Mode>("popup");
  const [position, setPosition] = useState<Pos>("bottom-right");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#8b5cf6");
  const [image, setImage] = useState("");
  const [shape, setShape] = useState<Shape>("circle");
  const [imageFit, setImageFit] = useState<Fit>("cover");
  const [label, setLabel] = useState("Chat");
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [avatar, setAvatar] = useState("");
  const [hideLabelWhenImage, setHideLabelWhenImage] = useState(false);

  // Load instance visuals as a convenience (does not persist)
  useEffect(() => {
    if (!instId) return;
    const found = instances.find((i) => i.id === instId);
    if (!found) return;
    if (found.position) setPosition(found.position);
    if (typeof found.size === "number") setSize(found.size!);
    if (found.color) setColor(found.color);
    if (found.image) setImage(found.image);
    if (found.shape) setShape(found.shape as Shape);
    if (found.imageFit) setImageFit(found.imageFit);
    if (found.label) setLabel(found.label);
    if (found.labelColor) setLabelColor(found.labelColor);
    if (found.avatar) setAvatar(found.avatar);
  }, [instId, instances]);

  /* Helpers to read the “active” visual state */
  const active = useMemo(() => {
    if (syncWithPreview) {
      const b = branding;
      return {
        position: b.chatBubblePosition ?? "bottom-right",
        size: b.chatBubbleSize ?? 56,
        color: b.chatBubbleColor ?? "#7aa8ff",
        image: b.chatBubbleImage ?? "",
        shape: (b.chatBubbleShape as Shape) ?? "circle",
        imageFit: (b.chatBubbleImageFit as Fit) ?? "cover",
        label: b.chatBubbleLabel ?? "Chat",
        labelColor: b.chatBubbleLabelColor ?? "#ffffff",
        avatar: "", // optional; Preview doesn’t manage this today
        hideLabelWhenImage: !!b.hideLabelWhenImage,
      };
    }
    return {
      position,
      size,
      color,
      image,
      shape,
      imageFit,
      label,
      labelColor,
      avatar,
      hideLabelWhenImage,
    };
  }, [
    syncWithPreview,
    branding,
    position,
    size,
    color,
    image,
    shape,
    imageFit,
    label,
    labelColor,
    avatar,
    hideLabelWhenImage,
  ]);

  /* Upload/Clear handlers (local only; Preview already persists uploads) */
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => !syncWithPreview && setImage(String(reader.result || ""));
    reader.readAsDataURL(f);
  }
  function onClearImage() {
    if (!syncWithPreview) setImage("");
  }

  /* URL for iframe/src */
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const widgetPath = useMemo(() => {
    const qp = new URLSearchParams();
    const inst = typeof instId === "string" ? instId.trim() : "";
    if (inst) qp.set("inst", inst);
    else qp.set("bot", botKey);

    qp.set("position", active.position);
    qp.set("size", String(active.size));
    if (active.color) qp.set("color", active.color);
    if (active.image) qp.set("image", active.image);
    if (active.shape) qp.set("shape", active.shape);
    if (active.imageFit) qp.set("imageFit", active.imageFit);
    if (!(active.image && active.hideLabelWhenImage)) {
      if (active.label) qp.set("label", active.label);
      if (active.labelColor) qp.set("labelColor", active.labelColor);
    }
    if (active.avatar) qp.set("avatar", active.avatar);

    qp.set("mode", mode);
    return `/widget?${qp.toString()}`;
  }, [instId, botKey, active, mode]);

  const embedUrl = `${origin}${widgetPath}`;

  /* Snippets */
  const iframeSnippet = useMemo(
    () =>
      `<!-- Paste near the end of <body> -->
<iframe
  src="${embedUrl}"
  title="Bot Widget"
  style="position: fixed; bottom: 24px; ${active.position === "bottom-right" ? "right" : "left"}: 24px;
         width: ${mode === "sidebar" ? "360px" : `${active.size}px`};
         height: ${mode === "sidebar" ? "100vh" : `${active.size}px`};
         border: 0; border-radius: ${mode === "sidebar" ? "0" : active.shape === "circle" ? "50%" : active.shape === "rounded" ? "16px" : active.shape === "square" ? "8px" : "9999px"};
         z-index: 999999; overflow: hidden;"
  loading="lazy"
  allow="clipboard-read; clipboard-write"
></iframe>`,
    [embedUrl, active.position, active.size, active.shape, mode]
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
  iframe.style.${active.position === "bottom-right" ? "right" : "left"} = '24px';
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
    [embedUrl, active.position, active.size, active.shape, mode]
  );

  /* UI helpers */
  const headerCard =
    "rounded-2xl border bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 p-6";
  const sectionCard = "rounded-2xl border bg-white/90 p-4 md:p-5 shadow-sm";
  const labelCls = "text-sm font-bold uppercase text-purple-700";
  const inputCls =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";
  const codeBox =
    "mt-3 rounded-lg border bg-neutral-900 text-neutral-50 text-sm p-3 overflow-auto";

  const controlsDisabled = syncWithPreview;

  return (
    <div className="p-6 space-y-6">
      <div className={headerCard}>
        <h1 className="text-3xl font-extrabold">Embed Code</h1>
        <p className="mt-2 text-muted-foreground">
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
          <div className="text-xs text-muted-foreground">
            {syncWithPreview
              ? "Reading from brandingSettings (Preview)."
              : "Overrides are local to this page and not saved."}
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
                  value={instId}
                  onChange={(v) => setInstId(normalizeSelectionToString(v))}
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
              value={botKey}
              onChange={(v) => setBotKey(normalizeSelectionToString(v))}
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
              value={active.position}
              onChange={(e) => setPosition(e.target.value as Pos)}
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
              title={controlsDisabled ? "Controlled by Preview" : mode === "sidebar" ? "Not used for sidebar" : ""}
            />
          </div>

          {/* Color */}
          <div>
            <div className={labelCls}>Accent Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={active.color}
              onChange={(e) => setColor(e.target.value)}
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
                value={active.image}
                onChange={(e) => setImage(e.target.value)}
                disabled={controlsDisabled}
              />
              <label
                className={
                  "rounded-lg border px-3 py-2 font-semibold cursor-pointer bg-white " +
                  (controlsDisabled ? "opacity-50 cursor-not-allowed" : "")
                }
              >
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={controlsDisabled} />
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
              onChange={(e) => setImageFit(e.target.value as Fit)}
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
              disabled={controlsDisabled || (!!active.image && active.hideLabelWhenImage)}
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
              disabled={controlsDisabled || (!!active.image && active.hideLabelWhenImage)}
              title={controlsDisabled ? "Controlled by Preview" : ""}
            />
          </div>

          <div className="md:col-span-2">
            <div className={labelCls}>Header Avatar (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/avatar.jpg"
              value={active.avatar}
              onChange={(e) => setAvatar(e.target.value)}
              disabled={syncWithPreview}
            />
          </div>

          {/* Preview URL */}
          <div className="md:col-span-3">
            <div className={labelCls}>Preview URL</div>
            <input className={inputCls} value={embedUrl} readOnly onFocus={(e) => e.currentTarget.select()} />
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
          Use this when your platform doesn’t let you add raw iframes in a good spot. It injects the
          iframe programmatically at the end of <code>&lt;body&gt;</code>.
        </p>
      </div>
    </div>
  );
}
