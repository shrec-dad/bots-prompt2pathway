// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import { listTemplateDefs } from "@/lib/templates";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval" | "chat" | "badge";
type ImageFit = "cover" | "contain" | "center";

/* ---------- Small helpers ---------- */

const BOT_TITLES: Record<string, string> = {
  LeadQualifier: "Lead Qualifier",
  AppointmentBooking: "Appointment Booking",
  CustomerSupport: "Customer Support",
  Waitlist: "Waitlist",
  SocialMedia: "Social Media",
};

function titleCaseSlug(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- Branding storage ---------- */

const BRAND_KEY = "brandingSettings";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;   // may be a URL or a data: URI
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
  /* ---------- sources (instances + templates) ---------- */
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());
  const [defs] = useState(() => listTemplateDefs());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("botInstances:") || e.key === "botInstances:index") {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- selection state ---------- */
  const [instId, setInstId] = useState<string>("");
  const [botKey, setBotKey] = useState<string>(defs[0]?.key ?? "Waitlist"); // fallback

  const activeInst = useMemo(
    () => instances.find((m) => m.id === instId),
    [instances, instId]
  );

  // The bot that actually drives copy/labels
  const activeBotKey =
    activeInst?.bot || botKey; // instance baseKey wins if instance is chosen

  /* ---------- widget look state ---------- */
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

  /* ---------- modal demo state ---------- */
  const [openModal, setOpenModal] = useState(false);
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Modal header (title bar): instance name if present, otherwise bot name
  const modalHeader = activeInst
    ? activeInst.name
    : (BOT_TITLES[botKey] ?? titleCaseSlug(botKey));

  // Headline “Welcome to …” based on the *active* bot (instance > bot)
  const headline = `Welcome to ${BOT_TITLES[activeBotKey] ?? "Chat"}`;

  // Demo subtext varies slightly at “done”
  const subtext =
    step === 3
      ? "Thanks! You’re on the list — we’ll be in touch."
      : "I’ll ask a few quick questions to help our team help you.";

  // Embed URL preview (uses inst if chosen, else bot)
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (activeInst) qp.set("inst", activeInst.id);
    else qp.set("bot", botKey);

    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    if (label.trim()) qp.set("label", label.trim());
    if (labelColor.trim()) qp.set("labelColor", labelColor.trim());
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());

    return `/widget?${qp.toString()}`;
  }, [activeInst, botKey, pos, size, shape, imageFit, label, labelColor, color, img]);

  const embedIframe = `<iframe
  src="${widgetSrc}"
  style="border:0;width:100%;height:560px"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;

  /* ---------- save/reset ---------- */
  const [savedNote, setSavedNote] = useState<null | string>(null);
  useEffect(() => {
    if (!savedNote) return;
    const t = setTimeout(() => setSavedNote(null), 1200);
    return () => clearTimeout(t);
  }, [savedNote]);

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

  /* ---------- file upload -> data URL for bubble image ---------- */
  async function onPickBubbleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImg(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  /* ---------- UI ---------- */

  const gradientHeader =
    "bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 text-white";

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
                className="rounded-2xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
                onClick={onSave}
              >
                Save
              </button>
              <button
                className="rounded-2xl px-3 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
                onClick={onReset}
              >
                Reset
              </button>
            </div>
          </div>
          {savedNote && <div className="mt-2 text-xs font-bold">{savedNote}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Instance select (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instance (optional)</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
            >
              <option value="">— none —</option>
              {instances
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} • {m.mode}
                  </option>
                ))}
            </select>
            <div className="text-xs text-muted-foreground">
              If an instance is chosen, it overrides the Bot.
            </div>
          </div>

          {/* Bot dropdown (disabled when instance selected) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bot</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={botKey}
              onChange={(e) => setBotKey(e.target.value)}
              disabled={!!activeInst}
              title={activeInst ? "Instance selected — Bot is ignored" : "Pick a base bot"}
            >
              {defs.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name} ({d.key})
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
              <option value="speech">speech (round)</option>
              <option value="speech-rounded">speech (rounded)</option>
            </select>
          </div>

          {/* Image & Fit (with upload) */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Bubble Image (optional)</label>
            <div className="flex items-center gap-3">
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="https://example.com/icon.png  — or use Upload"
                value={img}
                onChange={(e) => setImg(e.target.value)}
              />
              <label className="rounded-lg border px-3 py-2 font-semibold cursor-pointer bg-white">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickBubbleImage}
                />
              </label>
            </div>
            <div className="text-xs text-muted-foreground">
              You can paste a URL or upload an image (stored in this browser as a data URL).
            </div>
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

          {/* Open modal + embed url (copy) */}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              className="rounded-2xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 hover:from-purple-500/20 hover:to-teal-500/20"
              onClick={() => { setStep(0); setOpenModal(true); }}
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
          </div>

          {/* Full iframe code (copyable) */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Embed (iframe)</label>
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

      {/* Live area: bubble + modal */}
      <div className="relative min-h-[70vh] rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 p-6 overflow-visible">
        {mode === "popup" && (
          <ChatWidget
            mode="popup"
            botId={activeInst ? activeInst.bot : botKey}
            position={pos}
            size={size}
            color={color || undefined}
            image={img || undefined}
            shape={shape}
            imageFit={imageFit}
            label={label}
            labelColor={labelColor}
            onBubbleClick={() => { setStep(0); setOpenModal(true); }} // << open same modal
          />
        )}

        {openModal && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ pointerEvents: "none" }}
          >
            <div className="w-[520px] max-w-[92vw] rounded-2xl border bg-white shadow-2xl pointer-events-auto">
              <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
                <div className="text-lg font-extrabold">
                  {modalHeader}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid place-items-center text-5xl">👋</div>

                <div className="text-center">
                  <h2 className="text-2xl font-extrabold">{headline}</h2>
                  <p className="mt-2 text-muted-foreground">
                    {subtext}
                    {step < 3 && (
                      <>
                        <br />
                        Press <span className="font-bold">Continue</span> to proceed.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                    onClick={() => setOpenModal(false)}
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
                        onClick={() => setOpenModal(false)}
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
