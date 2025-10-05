// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import { listTemplateDefs, type BotKey } from "@/lib/templates";

/* -------------------------------- Types -------------------------------- */

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval" | "chat" | "badge";
type ImageFit = "cover" | "contain" | "center";

/* ----------------------- Branding (persisted locally) ------------------- */

const BRAND_KEY = "brandingSettings";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;

  chatBubbleImage?: string;      // URL or data: URI
  chatBubbleColor: string;
  chatBubbleSize: number;
  chatBubblePosition: Pos;
  chatBubbleShape?: Shape;
  chatBubbleLabel?: string;
  chatBubbleLabelColor?: string;
  chatBubbleImageFit?: ImageFit;
};

function readBranding(): Branding {
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

function writeBranding(next: Partial<Branding>) {
  const prev = readBranding();
  const merged = { ...prev, ...next };
  localStorage.setItem(BRAND_KEY, JSON.stringify(merged));
  return merged as Branding;
}

/* --------------------------- Helper dictionaries ------------------------ */

// Friendly headings per base bot
const BOT_HEADING: Record<string, string> = {
  LeadQualifier: "Lead Qualifier",
  AppointmentBooking: "Appointment Booking",
  CustomerSupport: "Customer Support",
  Waitlist: "Waitlist",
  SocialMedia: "Social Media",
};

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =======================================================================
   Component
   ======================================================================= */

export default function Preview() {
  // live data
  const [templates] = useState(() => listTemplateDefs());       // for labels
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
      if (e.key === BRAND_KEY) {
        const b = readBranding();
        setPos(b.chatBubblePosition);
        setSize(b.chatBubbleSize);
        setColor(b.chatBubbleColor);
        setImg(b.chatBubbleImage || "");
        setShape(b.chatBubbleShape || "circle");
        setImageFit(b.chatBubbleImageFit || "cover");
        setLabel(b.chatBubbleLabel || "Chat");
        setLabelColor(b.chatBubbleLabelColor || "#ffffff");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---- selection state ----
  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedBotKey, setSelectedBotKey] = useState<BotKey>("Waitlist"); // fallback

  // determine the *effective* base bot (instance wins)
  const effectiveBaseKey: string = useMemo(() => {
    if (selectedInstId) {
      try {
        const raw = localStorage.getItem(`botSettingsInst:${selectedInstId}`);
        if (raw) {
          const meta = JSON.parse(raw) as { baseKey?: string } | null;
          if (meta?.baseKey) return meta.baseKey;
        }
      } catch {}
    }
    return selectedBotKey;
  }, [selectedInstId, selectedBotKey]);

  // ---- widget visual controls (persisted) ----
  const b = useMemo(readBranding, []);
  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>(b.chatBubblePosition ?? "bottom-left");
  const [size, setSize] = useState<number>(b.chatBubbleSize ?? 56);
  const [color, setColor] = useState<string>(b.chatBubbleColor ?? "#7aa8ff");
  const [img, setImg] = useState<string>(b.chatBubbleImage ?? "");
  const [shape, setShape] = useState<Shape>(b.chatBubbleShape ?? "circle");
  const [imageFit, setImageFit] = useState<ImageFit>(b.chatBubbleImageFit ?? "cover");
  const [label, setLabel] = useState<string>(b.chatBubbleLabel ?? "Chat");
  const [labelColor, setLabelColor] = useState<string>(b.chatBubbleLabelColor ?? "#ffffff");

  // ---- modal control (and “bubble opens modal” behavior) ----
  const [modalOpen, setModalOpen] = useState(false);

  // headline (uses effective base bot)
  const headline = `Welcome to ${BOT_HEADING[effectiveBaseKey] ?? toTitle(effectiveBaseKey)}`;

  // Instance-aware /widget URL preview
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (selectedInstId) qp.set("inst", selectedInstId);
    else qp.set("bot", effectiveBaseKey);

    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    if (label.trim()) qp.set("label", label.trim());
    if (labelColor.trim()) qp.set("labelColor", labelColor.trim());
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());

    return `/widget?${qp.toString()}`;
  }, [selectedInstId, effectiveBaseKey, pos, size, color, img, label, labelColor, shape, imageFit]);

  // Save / Reset
  const [savedNote, setSavedNote] = useState<null | string>(null);
  useEffect(() => {
    if (!savedNote) return;
    const t = setTimeout(() => setSavedNote(null), 1200);
    return () => clearTimeout(t);
  }, [savedNote]);

  const onSave = () => {
    writeBranding({
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
    const d: Branding = {
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
      chatBubbleImage: "",
    };
    writeBranding(d);
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

  // file upload → data: URI
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImg((reader.result as string) || "");
    };
    reader.readAsDataURL(file);
  };

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
          {savedNote && <div className="mt-2 text-xs font-bold">{savedNote}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Instance (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instance (optional)</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              title="If an instance is chosen, it overrides the Bot."
            >
              <option value="">— none —</option>
              {instances
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {(m.name || `${m.bot} Instance`).toString()} • {m.mode}
                  </option>
                ))}
            </select>
            <div className="text-xs text-muted-foreground">
              If an instance is chosen, it overrides the Bot.
            </div>
          </div>

          {/* Base bot (only used when no instance is selected) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bot</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={selectedBotKey}
              onChange={(e) => {
                setSelectedBotKey(e.target.value as BotKey);
                // In case the user previously picked an instance, clear it to avoid “lingering”
                setSelectedInstId("");
              }}
              disabled={!!selectedInstId}
              title={selectedInstId ? "Instance selected — Bot is ignored." : "Base bot"}
            >
              {templates.map((d) => (
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
              <option value="chat">chat (speech)</option>
              <option value="badge">badge</option>
            </select>
          </div>

          {/* Image & Fit (URL OR upload) */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Bubble Image (optional)</label>
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 rounded-lg border px-3 py-2"
                placeholder="https://example.com/icon.png or data:image/png;base64,…"
                value={img}
                onChange={(e) => setImg(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="rounded-lg border px-3 py-2"
                title="Upload image instead of URL"
              />
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

          {/* Open modal + embed url */}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 hover:from-purple-500/20 hover:to-teal-500/20"
              onClick={() => setModalOpen(true)}
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
        </div>
      </div>

      {/* Live area: the floating bubble opens our modal */}
      <div className="relative min-h-[70vh] rounded-2xl border bg-gradient-to-br from-purple-50 via-indigo-50 to-teal-50 p-6 overflow-visible">
        {mode === "popup" && (
          <ChatWidget
            mode="popup"
            // if instance selected, ChatWidget receives inst via query in /widget demo,
            // but here we only need its bubble — when clicked, open the big modal:
            onBubbleClick={() => setModalOpen(true)}
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

        {modalOpen && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ pointerEvents: "none" }}
          >
            <div className="w-[520px] max-w-[92vw] rounded-2xl border bg-white shadow-2xl pointer-events-auto">
              <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
                <div className="text-lg font-extrabold">
                  {/* header = instance name or bot name */}
                  {selectedInstId
                    ? (instances.find((i) => i.id === selectedInstId)?.name || "Client Bot")
                    : (BOT_HEADING[effectiveBaseKey] ?? toTitle(effectiveBaseKey))}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid place-items-center text-5xl">👋</div>
                <div className="text-center">
                  <h2 className="text-2xl font-extrabold">{headline}</h2>
                  <p className="mt-2 text-muted-foreground">
                    Thanks! You’re on the list — we’ll be in touch.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    className="rounded-xl px-5 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                    onClick={() => setModalOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
