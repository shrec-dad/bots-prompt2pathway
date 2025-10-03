// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

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

// Branding store (used by /widget)
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

export default function Preview() {
  // ---- Demo bot/instance controls ----
  const [botId, setBotId] = useState("waitlist-bot");
  const [instId, setInstId] = useState<string>("");

  // ---- Bubble/Widget visual controls (persisted) ----
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

  const [open, setOpen] = useState(true);
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

  const title = useMemo(() => {
    switch (step) {
      case 0:
        return "Welcome to the Waitlist";
      case 1:
        return "Your email";
      case 2:
        return "Interest level";
      default:
        return "All set!";
    }
  }, [step]);

  // Instance-aware /widget URL preview
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    if (label.trim()) qp.set("label", label.trim());
    if (labelColor.trim()) qp.set("labelColor", labelColor.trim());
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());

    return `/widget?${qp.toString()}`;
  }, [instId, botId, pos, size, color, img, label, labelColor, shape, imageFit]);

  const embedIframe = `<iframe
  src="${widgetSrc}"
  style="border:0;width:100%;height:560px"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;

  // ---- Save / Reset ----
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

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
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
          {/* Instance (optional) & Bot ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instance ID (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="inst_abc123…"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              If provided, the instance overrides the Bot ID.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bot ID</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot ID ignored" : "Enter a bot id"}
            />
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

          {/* Accent Color now with picker */}
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

          {/* Open modal + embed url (now with Copy) */}
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

          {/* Full iframe code (copyable) */}
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

      {/* Live UI area */}
      <div className="relative min-h-[70vh] rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 p-6 overflow-visible">
        {mode === "popup" && (
          <ChatWidget
            mode="popup"
            botId={botId}
            position={pos}
            size={size}
            color={color || undefined}
            image={img || undefined}
            shape={shape}
            imageFit={imageFit}
            label={label}
            labelColor={labelColor}
          />
        )}

        {open && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ pointerEvents: "none" }}
          >
            <div className="w-[420px] max-w-[92vw] rounded-2xl border bg-white shadow-2xl pointer-events-auto">
              <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
                <div className="text-lg font-extrabold">
                  {botId.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid place-items-center text-5xl">👋</div>

                <div className="text-center">
                  <h2 className="text-2xl font-extrabold">{title}</h2>

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
