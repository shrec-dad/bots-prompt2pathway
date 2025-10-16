// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import BotSelector from "@/components/BotSelector";
import { trackEvent } from "@/lib/analytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape =
  | "circle"
  | "rounded"
  | "square"
  | "oval"
  | "chat"
  | "badge"
  | "speech"
  | "speech-rounded";
type ImageFit = "cover" | "contain" | "center";

/* ---------- Small helpers ---------- */

const BOT_TITLES: Record<string, string> = {
  LeadQualifier: "Lead Qualifier",
  AppointmentBooking: "Appointment Booking",
  CustomerSupport: "Customer Support",
  Waitlist: "Waitlist",
  SocialMedia: "Social Media",
  Receptionist: "Receptionist",
};

function titleCaseSlug(s: unknown) {
  if (typeof s === "string") {
    return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "";
}

function toId(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const anyVal = val as any;
    if (typeof anyVal.id === "string") return anyVal.id;
    if (typeof anyVal.key === "string") return anyVal.key;
    if (typeof anyVal.value === "string") return anyVal.value;
  }
  return "";
}

/* ---------- Branding storage ---------- */

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
  chatHideLabelWhenImage?: boolean;
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
    chatHideLabelWhenImage: false,
  };
}

function setBranding(next: Partial<Branding>) {
  const prev = getBranding();
  const merged = { ...prev, ...next };
  localStorage.setItem(BRAND_KEY, JSON.stringify(merged));
  return merged as Branding;
}

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const Grad =
  "bg-gradient-to-br from-indigo-200/60 via-blue-200/55 to-emerald-200/55";
const strongCard =
  "rounded-2xl border-[3px] border-black/80 shadow-[0_6px_0_rgba(0,0,0,0.8)] transition hover:shadow-[0_8px_0_rgba(0,0,0,0.9)]";

export default function Preview() {
  /* ---------- sources (instances) ---------- */
  const [instances, setInstances] = useState<InstanceMeta[]>(() =>
    listInstances()
  );

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
  const [botKey, setBotKey] = useState<string>("Waitlist");

  const onInstanceChange = (val: unknown) => {
    const id = toId(val);
    setInstId(id);
    trackEvent(
      "preview_select_instance",
      id ? { kind: "inst", id } : { kind: "bot", key: botKey }
    );
  };
  const onBotChange = (val: unknown) => {
    const key = toId(val) || "Waitlist";
    setBotKey(key);
    trackEvent("preview_select_bot", { kind: "bot", key });
  };
  const clearInstance = () => {
    if (!instId) return;
    trackEvent("preview_clear_instance", { kind: "inst", id: instId });
    setInstId("");
  };

  const activeInst = useMemo(
    () =>
      typeof instId === "string" && instId
        ? instances.find((m) => m.id === instId)
        : undefined,
    [instances, instId]
  );

  const activeBotKey = activeInst?.bot || botKey;

  /* ---------- widget look state ---------- */
  const b = useMemo(getBranding, []);
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>(b.chatBubblePosition ?? "bottom-left");
  const [size, setSize] = useState<number>(b.chatBubbleSize ?? 56);
  const [color, setColor] = useState<string>(b.chatBubbleColor ?? "#7aa8ff");
  const [img, setImg] = useState<string>(b.chatBubbleImage ?? "");
  const [shape, setShape] = useState<Shape>(b.chatBubbleShape ?? "circle");
  const [imageFit, setImageFit] = useState<ImageFit>(
    b.chatBubbleImageFit ?? "cover"
  );
  const [label, setLabel] = useState<string>(b.chatBubbleLabel ?? "Chat");
  const [labelColor, setLabelColor] = useState<string>(
    b.chatBubbleLabelColor ?? "#ffffff"
  );
  const [hideLabelWhenImage, setHideLabelWhenImage] = useState<boolean>(
    !!b.chatHideLabelWhenImage
  );

  /* ---------- modal demo state ---------- */
  const [openModal, setOpenModal] = useState(false);
  const [step, setStep] = useState(0);

  const next = () => {
    const scope = activeInst
      ? ({ kind: "inst", id: activeInst.id } as const)
      : ({ kind: "bot", key: activeBotKey } as const);
    trackEvent("step_next", scope, { step });
    setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => {
    const scope = activeInst
      ? ({ kind: "inst", id: activeInst.id } as const)
      : ({ kind: "bot", key: activeBotKey } as const);
    trackEvent("step_back", scope, { step });
    setStep((s) => Math.max(s - 1, 0));
  };

  const headline = activeInst
    ? `Welcome to ${activeInst.name}`
    : `Welcome to ${BOT_TITLES[activeBotKey] ?? titleCaseSlug(activeBotKey)}`;

  const subtext = (() => {
    if (step === 0)
      return "I'll ask a few quick questions to help our team help you.";
    if (step === 1) return "What's the best email to reach you?";
    if (step === 2) return "Choose your interest level.";
    return "Thanks! You're on the list — we'll be in touch.";
  })();

  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (activeInst) qp.set("inst", activeInst.id);
    else qp.set("bot", activeBotKey);

    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    if (label.trim()) qp.set("label", label.trim());
    if (labelColor.trim()) qp.set("labelColor", labelColor.trim());
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());

    return `/widget?${qp.toString()}`;
  }, [
    activeInst,
    activeBotKey,
    pos,
    size,
    shape,
    imageFit,
    label,
    labelColor,
    color,
    img,
  ]);

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
      chatHideLabelWhenImage: hideLabelWhenImage,
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
      chatHideLabelWhenImage: false,
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
    setHideLabelWhenImage(!!d.chatHideLabelWhenImage);
    setSavedNote("Reset");
  };

  async function onPickBubbleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImg(String(reader.result || ""));
    reader.readAsDataURL(f);
    e.currentTarget.value = "";
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className={classNames("p-5", strongCard)}>
          <div className="h-2 rounded-md bg-black mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Widget Preview</h1>
              <p className="text-foreground/80">
                Tune the customer-facing widget style and see it live.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-2xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={onSave}
              >
                Save
              </button>
              <button
                className="rounded-2xl px-3 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={onReset}
              >
                Reset
              </button>
            </div>
          </div>
          {savedNote && (
            <div className="mt-3 text-xs font-bold text-emerald-700">{savedNote}</div>
          )}
        </div>

        {/* Controls Card */}
        <div className={classNames(strongCard, Grad)}>
          <div className="h-2 rounded-md bg-black mb-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {/* Instance via BotSelector (optional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Instance (optional)</label>
                <button
                  type="button"
                  className="text-xs font-semibold rounded-md px-2 py-1 border bg-white hover:bg-muted/40"
                  onClick={clearInstance}
                  disabled={!instId}
                  title={instId ? "Clear selected instance" : "No instance selected"}
                  aria-disabled={!instId}
                >
                  Clear
                </button>
              </div>
              <BotSelector
                scope="instance"
                value={instId}
                onChange={onInstanceChange}
                placeholderOption="— none —"
              />
              <div className="text-xs text-muted-foreground">
                If an instance is chosen, it overrides the Bot.
              </div>
            </div>

            {/* Bot via BotSelector (disabled when instance selected) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Bot</label>
              <BotSelector
                scope="template"
                value={botKey}
                onChange={onBotChange}
                disabled={!!activeInst}
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
                <option value="speech">speech (round)</option>
                <option value="speech-rounded">speech (rounded)</option>
              </select>
            </div>

            {/* Image & Fit (with upload + clear) */}
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
                <button
                  className="rounded-lg border px-3 py-2 font-semibold bg-white"
                  onClick={() => setImg("")}
                  title="Clear bubble image"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  id="hideLabel"
                  type="checkbox"
                  className="h-3 w-3"
                  checked={hideLabelWhenImage}
                  onChange={(e) => setHideLabelWhenImage(e.target.checked)}
                />
                <label htmlFor="hideLabel">Hide label when an image is used</label>
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
                className="rounded-2xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-teal-500/20 hover:from-purple-500/30 hover:to-teal-500/30"
                onClick={() => {
                  const scope = activeInst
                    ? ({ kind: "inst", id: activeInst.id } as const)
                    : ({ kind: "bot", key: activeBotKey } as const);
                  trackEvent("bubble_open", scope, { from: "preview_button" });
                  setStep(0);
                  setOpenModal(true);
                }}
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
        <div className={classNames(
          "relative min-h-[70vh] rounded-2xl p-6 overflow-visible",
          strongCard,
          Grad
        )}>
          <div className="h-2 rounded-md bg-black mb-4" />
          
          {mode === "popup" && (
            <ChatWidget
              mode="popup"
              botId={activeBotKey}
              position={pos}
              size={size}
              color={color || undefined}
              image={img || undefined}
              shape={shape as any}
              imageFit={imageFit}
              label={label}
              labelColor={labelColor}
              hideLabelWhenImage={hideLabelWhenImage}
              onBubbleClick={() => {
                const scope = activeInst
                  ? ({ kind: "inst", id: activeInst.id } as const)
                  : ({ kind: "bot", key: activeBotKey } as const);
                trackEvent("bubble_open", scope, { from: "preview_bubble" });
                setStep(0);
                setOpenModal(true);
              }}
            />
          )}

          {openModal && (
            <div
              className="absolute inset-0 grid place-items-center"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  const scope = activeInst
                    ? ({ kind: "inst", id: activeInst.id } as const)
                    : ({ kind: "bot", key: activeBotKey } as const);
                  trackEvent("close_widget", scope, { step });
                  setOpenModal(false);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Widget Preview"
                className="w-[480px] max-w-[94vw] rounded-2xl border-[3px] border-black/80 bg-white shadow-2xl outline-none"
                tabIndex={-1}
              >
                {/* top strip */}
                <div
                  className="rounded-t-2xl p-4 h-2 bg-black"
                  aria-hidden="true"
                />

                {/* body – vertical layout; scroll-safe on short screens */}
                <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                  {/* Close button (top-right) */}
                  <div className="flex">
                    <button
                      className="ml-auto rounded-xl px-3 py-1.5 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                      onClick={() => {
                        const scope = activeInst
                          ? ({ kind: "inst", id: activeInst.id } as const)
                          : ({ kind: "bot", key: activeBotKey } as const);
                        trackEvent("close_widget", scope, { step });
                        setOpenModal(false);
                      }}
                      autoFocus
                      aria-label="Close preview"
                    >
                      Close
                    </button>
                  </div>

                  {/* emoji + text */}
                  <div className="grid place-items-center text-6xl">👋</div>

                  <div className="text-center space-y-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold">
                      {headline}
                    </h2>
                    <p className="text-muted-foreground">{subtext}</p>

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
                  </div>

                  {/* CTA zone – vertical buttons */}
                  <div className="flex flex-col gap-3">
                    {step > 0 && step < 3 && (
                      <button
                        className="rounded-xl w-full px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                        onClick={() => {
                          const scope = activeInst
                            ? ({ kind: "inst", id: activeInst.id } as const)
                            : ({ kind: "bot", key: activeBotKey } as const);
                          trackEvent("step_back", scope, { step });
                          setStep((s) => Math.max(s - 1, 0));
                        }}
                      >
                        Back
                      </button>
                    )}

                    {step < 3 ? (
                      <button
                        className="rounded-xl w-full px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                        onClick={() => {
                          const scope = activeInst
                            ? ({ kind: "inst", id: activeInst.id } as const)
                            : ({ kind: "bot", key: activeBotKey } as const);
                          trackEvent("step_next", scope, { step });
                          setStep((s) => Math.min(s + 1, 3));
                        }}
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        className="rounded-xl w-full px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                        onClick={() => {
                          const scope = activeInst
                            ? ({ kind: "inst", id: activeInst.id } as const)
                            : ({ kind: "bot", key: activeBotKey } as const);
                          trackEvent("lead_submit", scope, {
                            method: "preview-demo",
                          });
                          setOpenModal(false);
                        }}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
