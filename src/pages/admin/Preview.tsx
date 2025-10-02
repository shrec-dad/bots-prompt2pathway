// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";
import { useAdminStore } from "@/lib/AdminStore";
import { listInstances, createInstance } from "@/lib/instances"; // <-- uses your instances util

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";

type SavedInstance = {
  id: string;
  name?: string;
  bot?: string;
  mode?: string;
  createdAt?: number;
  // appearance we may persist
  position?: Pos;
  size?: number;
  color?: string;
  image?: string;
  shape?: "circle" | "rounded" | "square" | "oval";
  imageFit?: "cover" | "contain" | "fill" | "center" | "none";
  label?: string;
  labelColor?: string;
  avatar?: string;
};

export default function Preview() {
  /* ------------------------------------------------------------------ */
  /* 1) Data sources                                                     */
  /* ------------------------------------------------------------------ */
  const { bots } = useAdminStore();
  const [instances, setInstances] = useState<SavedInstance[]>([]);

  const refreshInstances = () => {
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
  };

  useEffect(() => {
    refreshInstances();
  }, []);

  /* ------------------------------------------------------------------ */
  /* 2) Preview controls                                                 */
  /* ------------------------------------------------------------------ */
  // If an instance is selected it overrides botId for embed/preview
  const [instId, setInstId] = useState<string>("");

  // default bot (from AdminStore list)
  const defaultBot = bots?.[0]?.id ?? "waitlist-bot";
  const [botId, setBotId] = useState<string>(defaultBot);

  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-left");
  const [size, setSize] = useState(56);
  const [color, setColor] = useState<string>("");
  const [img, setImg] = useState<string>("");

  // bubble visuals
  const [shape, setShape] = useState<"circle" | "rounded" | "square" | "oval">("circle");
  const [label, setLabel] = useState("Chat");
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [imageFit, setImageFit] = useState<"cover" | "contain" | "fill" | "center" | "none">(
    "cover"
  );
  const [avatar, setAvatar] = useState<string>("");

  // demo modal
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
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

  /* ------------------------------------------------------------------ */
  /* 3) Embed URL                                                        */
  /* ------------------------------------------------------------------ */
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();

    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("position", pos);
    qp.set("size", String(size));
    if (color.trim()) qp.set("color", color.trim());
    if (img.trim()) qp.set("image", img.trim());
    if (shape) qp.set("shape", shape);
    if (label) qp.set("label", label);
    if (labelColor) qp.set("labelColor", labelColor);
    if (imageFit) qp.set("imageFit", imageFit);
    if (avatar.trim()) qp.set("avatar", avatar.trim());

    return `/widget?${qp.toString()}`;
  }, [instId, botId, pos, size, color, img, shape, label, labelColor, imageFit, avatar]);

  const embedIframe = `<iframe
  src="${widgetSrc}"
  style="border:0;width:100%;height:560px"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;

  const activeBotName =
    bots?.find((b) => b.id === botId)?.name ??
    botId.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());

  /* ------------------------------------------------------------------ */
  /* 4) Create instance from current preview                            */
  /* ------------------------------------------------------------------ */
  async function onCreateInstanceFromPreview() {
    try {
      const defaultName =
        (bots?.find((b) => b.id === botId)?.name ?? botId).replace(/-/g, " ") + " (Preview)";
      const name = window.prompt("Name this instance:", defaultName);
      if (!name) return;

      const payload = {
        // identity
        name,
        bot: instId ? undefined : botId, // if you had an inst selected, we still capture visuals; bot optional
        mode,
        // visuals / placement
        position: pos,
        size,
        color,
        image: img,
        shape,
        imageFit,
        label,
        labelColor,
        avatar,
      };

      const created = createInstance?.(payload as any);
      if (!created || !created.id) {
        alert("Could not create instance. Please try again.");
        return;
      }

      // refresh list, select it, and clear bot entry (because inst overrides)
      refreshInstances();
      setInstId(created.id);

      alert(`Instance "${name}" created! It is now selected in the preview.`);
    } catch (e) {
      console.error(e);
      alert("Something went wrong while creating the instance.");
    }
  }

  /* ------------------------------------------------------------------ */
  /* 5) Render                                                           */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
          <div className="text-xl font-extrabold">Widget Preview</div>
          <div className="text-sm opacity-90">
            Choose a <b>Bot</b> or a saved <b>Instance</b>, then tweak widget appearance.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Instance Picker */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instance (overrides bot)</label>
            <div className="flex gap-2">
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={instId}
                onChange={(e) => setInstId(e.target.value)}
                title="Pick a saved Instance to preview"
              >
                <option value="">— None (use Bot) —</option>
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name || i.id} {i.bot ? `• ${i.bot}` : ""} {i.mode ? `• ${i.mode}` : ""}
                  </option>
                ))}
              </select>
              {instId && (
                <button
                  className="rounded-lg border px-3 py-2 text-sm font-bold"
                  onClick={() => setInstId("")}
                  title="Clear instance selection"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              If an instance is selected, the Bot dropdown is disabled.
            </div>
          </div>

          {/* Bot Picker */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bot</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
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

          {/* Mode / Position / Size */}
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

          {/* Visuals */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bubble Image URL (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://example.com/icon.png"
              value={img}
              onChange={(e) => setImg(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Accent Color (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="#7aa8ff"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bubble Shape</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={shape}
              onChange={(e) => setShape(e.target.value as any)}
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="oval">oval</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Image Fit</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={imageFit}
              onChange={(e) => setImageFit(e.target.value as any)}
            >
              <option value="cover">cover (fill bubble)</option>
              <option value="contain">contain</option>
              <option value="fill">fill (stretch)</option>
              <option value="center">center (no scale)</option>
              <option value="none">none</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bubble Label</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">Header Avatar (optional)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>

          {/* Actions + quick embed URL */}
          <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 hover:from-purple-500/20 hover:to-teal-500/20"
              onClick={() => setOpen(true)}
            >
              Open Preview Modal
            </button>

            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20"
              onClick={onCreateInstanceFromPreview}
              title="Save everything you set here as a reusable Instance"
            >
              Create Instance from this Preview
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

          {/* Full iframe code */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold">Embed (iframe)</label>
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

      {/* Live area */}
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
            label={label}
            labelColor={labelColor}
            imageFit={imageFit}
            avatar={avatar || undefined}
          />
        )}

        {open && (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="w-[420px] max-w-[92vw] rounded-2xl border bg-white shadow-2xl pointer-events-auto"
              style={{ transform: "translateY(0)" }}
            >
              <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
                <div className="text-lg font-extrabold">
                  {(instId || botId).replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
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
                        <button key={o} className="rounded-lg border px-3 py-2 hover:bg-muted/50">
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
