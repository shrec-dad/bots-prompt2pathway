// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import { listTemplateDefs, type TemplateDef } from "@/lib/templates";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval" | "chat" | "badge";
type ImageFit = "cover" | "contain" | "center";

// Simple copy button with feedback
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
      className="rounded-xl px-3 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
    >
      {label}
    </button>
  );
}

/* ---------- Branding store (used by look & feel controls) ---------- */
const BRAND_KEY = "brandingSettings";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number;
  chatBubblePosition: Pos;
  chatBubbleShape?: Shape;
  chatBubbleLabel?: string;
  chatBubbleLabelColor?: string;
  chatBubbleImageFit?: ImageFit;
};

function getBranding(): Branding {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    primaryColor: "#7aa8ff",
    secondaryColor: "#76c19a",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    chatBubbleColor: "#7aa8ff",
    chatBubbleSize: 56,
    chatBubblePosition: "bottom-left",
    chatBubbleShape: "circle",
    chatBubbleLabel: "Chat",
    chatBubbleLabelColor: "#ffffff",
    chatBubbleImageFit: "cover",
  };
}
function setBranding(next: Partial<Branding>) {
  const prev = getBranding();
  const merged = { ...prev, ...next };
  localStorage.setItem(BRAND_KEY, JSON.stringify(merged));
  return merged as Branding;
}

/* ---------- Helpers ---------- */
// Pretty “Bot ID” (slug) from a template key (e.g., LeadQualifier -> lead-qualifier)
const keyToId = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

// Friendly instance title
const instanceTitle = (m: InstanceMeta, defs: TemplateDef[]) => {
  const def = defs.find((d) => d.key === m.bot);
  const base = def?.name || m.bot;
  return (m.name || `${base} Instance`).toString();
};

export default function Preview() {
  /* ---------- Data sources for dropdowns ---------- */
  const [defs, setDefs] = useState<TemplateDef[]>(() => listTemplateDefs());
  const [instances, setInstances] = useState<InstanceMeta[]>(() =>
    listInstances()
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "botTemplates:index") setDefs(listTemplateDefs());
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- Selection state ---------- */
  const [selectedInst, setSelectedInst] = useState<string>("");
  const [selectedBotKey, setSelectedBotKey] = useState<string>(
    defs[0]?.key || "Waitlist"
  );

  // Resolved bot id & friendly name used in UI
  const resolvedBotId = useMemo(() => keyToId(selectedBotKey), [selectedBotKey]);
  const friendlyBotName = useMemo(
    () => defs.find((d) => d.key === selectedBotKey)?.name || selectedBotKey,
    [defs, selectedBotKey]
  );
  const selectedInstance = useMemo(
    () => instances.find((i) => i.id === selectedInst),
    [instances, selectedInst]
  );

  /* ---------- Bubble/Widget visual controls (persisted) ---------- */
  const b = useMemo(getBranding, []);
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>(b.chatBubblePosition ?? "bottom-left");
  const [size, setSize] = useState<number>(b.chatBubbleSize ?? 56);
  const [color, setColor] = useState<string>(b.chatBubbleColor ?? "#7aa8ff");
  const [img, setImg] = useState<string>(b.chatBubbleImage ?? "");
  const [shape, setShape] = useState<Shape>(b.chatBubbleShape ?? "circle");
  const [imageFit, setImageFit] = useState<ImageFit>(b.chatBubbleImageFit ?? "cover");
  const [label, setLabel] = useState<string>(b.chatBubbleLabel ?? "Chat");
  const [labelColor, setLabelColor] = useState<string>(b.chatBubbleLabelColor ?? "#ffffff");

  const [open, setOpen] = useState(true); // show modal by default
  const [step, setStep] = useState(0);
  const [savedNote, setSavedNote] = useState<null | string>(null);

  useEffect(() => {
    if (!savedNote) return;
    const t = setTimeout(() => setSavedNote(null), 1200);
    return () => clearTimeout(t);
  }, [savedNote]);

  const gradientHeader =
    "bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 text-white";

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Welcome line now based on selected bot (no more “Waitlist” hard-code)
  const welcomeLine = useMemo(
    () => `Welcome to ${friendlyBotName}`,
    [friendlyBotName]
  );

  /* ---------- Instance-aware /widget URL preview ---------- */
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (selectedInstance) qp.set("inst", selectedInstance.id);
    else qp.set("bot", resolvedBotId);

    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    if (label.trim()) qp.set("label", label.trim());
    if (labelColor.trim()) qp.set("labelColor", labelColor.trim());
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());

    return `/widget?${qp.toString()}`;
  }, [selectedInstance, resolvedBotId, pos, size, color, img, label, labelColor, shape, imageFit]);

  const embedIframe = `<iframe
  src="${widgetSrc}"
  style="border:0;width:100%;height:560px"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;

  /* ---------- Save / Reset ---------- */
  const onSave = () => {
    setBranding({
      chatBubblePosition: pos,
      chatBubbleSize: size,
      chatBubbleColor: color,
      chatBubbleImage: img || undefined,
      chatBubbleShape: shape,
      chatBubbleImageFit: imageFit,
      chatBubbleLabel: label,
      chatBubbleLabelColor: labelColor,
    });
    setSavedNote("Saved!");
  };

  const onReset = () => {
    const d = {
      primaryColor: "#7aa8ff",
      secondaryColor: "#76c19a",
      fontFamily: "Inter, system-ui, Arial, sans-serif",
      chatBubbleColor: "#7aa8ff",
      chatBubbleSize: 56,
      chatBubblePosition: "bottom-left" as Pos,
      chatBubbleShape: "circle" as Shape,
      chatBubbleLabel: "Chat",
      chatBubbleLabelColor: "#ffffff",
      chatBubbleImageFit: "cover" as ImageFit,
      chatBubbleImage: "",
    };
    setBranding(d);
    setPos(d.chatBubblePosition);
    setSize(d.chatBubbleSize);
    setColor(d.chatBubbleColor);
    setImg(d.chatBubbleImage || "");
    setShape(d.chatBubbleShape);
    setImageFit(d.chatBubbleImageFit);
    setLabel(d.chatBubbleLabel);
    setLabelColor(d.chatBubbleLabelColor);
    setSavedNote("Reset");
  };

  /* ---------- Floating “bubble” button that opens the modal ---------- */
  const bubbleStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 40,
    [pos === "bottom-left" ? "left" : "right"]: 20,
    bottom: 20,
    width: size,
    height: size,
    borderRadius:
      shape === "circle"
        ? "9999px"
        : shape === "rounded"
        ? "14px"
        : shape === "square"
        ? "4px"
        : shape === "oval"
        ? `${Math.max(24, Math.round(size / 2))}px / ${Math.max(
            24,
            Math.round(size / 2.5)
          )}px`
        : shape === "badge"
        ? "9999px"
        : "16px",
    background: color || "#7aa8ff",
    border: "2px solid #000",
    boxShadow: "0 10px 18px rgba(0,0,0,0.15)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  } as any;

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className={`rounded-t-2xl p-4 bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold">Widget Preview</div>
              <div className="text-sm opacity-90">
                Tune the customer-facing widget style.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
                onClick={onSave}
                aria-label="Save widget look"
              >
                Save
              </button>
              <button
                className="rounded-xl px-3 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
                onClick={onReset}
                aria-label="Reset to defaults"
              >
                Reset
              </button>
            </div>
          </div>
          {savedNote && (
            <div className="mt-2 text-xs font-bold">{savedNote}</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Instance selector (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instance (optional)</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={selectedInst}
              onChange={(e) => setSelectedInst(e.target.value)}
            >
              <option value="">— None —</option>
              {[...instances]
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {instanceTitle(m, defs)} • {m.mode}
                  </option>
                ))}
            </select>
            <div className="text-xs text-muted-foreground">
              If an instance is chosen, it overrides the Bot.
            </div>
          </div>

          {/* Bot selector (templates + custom) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bot</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={selectedBotKey}
              onChange={(e) => setSelectedBotKey(e.target.value)}
              disabled={!!selectedInst}
              title={
                selectedInst
                  ? "Instance is set; Bot selection is ignored"
                  : "Choose a bot"
              }
            >
              {defs.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name} ({keyToId(d.key)})
                </option>
              ))}
            </select>
          </div>

          {/* Mode & Position */}
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          {/* Size & Shape */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Size (px)</label>
            <input
              type="number"
              min={40}
              max={120}
              className="w-full rounded-lg border px-3 py-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bubble Shape</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={shape}
              onChange={(e) => setShape(e.target.value as Shape)}
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="oval">oval</option>
              <option value="chat">chat (speech)</option>
              <option value="badge">badge</option>
            </select>
          </div>

          {/* Image & Fit */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Bubble Image URL (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://example.com/icon.png"
              value={img}
              onChange={(e) => setImg(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Image Fit</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={imageFit}
              onChange={(e) => setImageFit(e.target.value as ImageFit)}
            >
              <option value="cover">cover (fill bubble)</option>
              <option value="contain">contain (fit inside)</option>
              <option value="center">center (no scale)</option>
            </select>
          </div>

          {/* Label & Colors */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bubble Label</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Chat"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Accent Color</label>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Label Color</label>
            <input
              type="color"
              className="h-10 w-full rounded-lg border"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
            />
          </div>

          {/* Embed utilities */}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 hover:from-purple-500/20 hover:to-teal-500/20"
              onClick={() => setOpen(true)}
            >
              Open Preview Modal
            </button>

            <div className="ml-auto text-sm font-semibold">Embed URL:</div>
            <input
              readOnly
              value={widgetSrc}
              className="w-[420px] max-w-full rounded-lg border px-3 py-2 text-xs font-mono"
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Embed URL"
            />
            <CopyButton getText={() => widgetSrc} />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Embed (iframe)</label>
              <CopyButton getText={() => embedIframe} />
            </div>
            <textarea
              readOnly
              className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
              rows={4}
              value={embedIframe}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>

      {/* Live area + the only bubble we render (opens the same modal) */}
      <div className="relative min-h-[70vh] rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 p-6 overflow-visible">
        {/* Floating bubble button */}
        {mode === "popup" && (
          <div
            role="button"
            aria-label="Open chat"
            onClick={() => setOpen(true)}
            style={bubbleStyle}
            title="Open chat"
          >
            {img ? (
              <img
                src={img}
                alt=""
                style={{
                  width: "70%",
                  height: "70%",
                  objectFit: imageFit,
                  borderRadius: "50%",
                }}
              />
            ) : (
              <span
                style={{
                  color: labelColor || "#fff",
                  fontWeight: 800,
                  fontSize: Math.max(11, Math.round(size / 5.2)),
                  whiteSpace: "nowrap",
                }}
              >
                {label || "Chat"}
              </span>
            )}
          </div>
        )}

        {/* Unified modal chat */}
        {open && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ pointerEvents: "none" }}
          >
            <div className="w-[420px] max-w-[92vw] rounded-2xl border bg-white shadow-2xl pointer-events-auto">
              <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
                <div className="text-lg font-extrabold">
                  {selectedInstance
                    ? instanceTitle(selectedInstance, defs)
                    : friendlyBotName}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid place-items-center text-5xl">👋</div>

                <div className="text-center">
                  <h2 className="text-2xl font-extrabold">{welcomeLine}</h2>

                  {step === 0 && (
                    <p className="mt-2 text-muted-foreground">
                      I’ll ask a few quick questions to help our team help you.
                      <br />
                      Press <span className="font-bold">Continue</span> to proceed.
                    </p>
                  )}

                  {step === 1 && (
                    <div className="mt-4">
                      <input
                        className="w-full rounded-lg border px-3 py-2"
                        placeholder="you@domain.com"
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="mt-4 grid gap-2">
                      {["Curious", "Very interested", "VIP"].map((o) => (
                        <button
                          key={o}
                          className="rounded-lg border px-3 py-2 hover:bg-muted/50"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 3 && (
                    <p className="mt-2 text-muted-foreground">
                      Thanks! You’re on the list — we’ll be in touch.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                  <div className="flex gap-2">
                    {step > 0 && step < 3 && (
                      <button
                        className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                        onClick={back}
                      >
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                        onClick={next}
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                        onClick={() => setOpen(false)}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
