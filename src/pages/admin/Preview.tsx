// src/pages/admin/Preview.tsx
import React, { useMemo, useState } from "react";
import ChatWidget from "@/widgets/ChatWidget";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";

export default function Preview() {
  const [botId, setBotId] = useState("waitlist-bot");
  const [instId, setInstId] = useState<string>("");

  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-right");
  const [size, setSize] = useState(64);

  // Bubble visuals
  const [shape, setShape] = useState<"circle" | "rounded" | "oval" | "square">("circle");
  const [color, setColor] = useState("#7aa8ff");
  const [img, setImg] = useState("");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [label, setLabel] = useState("Chat");
  const [labelColor, setLabelColor] = useState("#ffffff");

  // Transcript / panel visuals
  const [messageStyle, setMessageStyle] = useState<
    "outlined-black" | "accent-yellow" | "modern-soft" | "pill" | "rounded-rect" | "minimal-outline"
  >("outlined-black");
  const [botAvatarUrl, setBotAvatarUrl] = useState("");

  // Demo modal (unchanged)
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const gradientHeader = "bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400 text-white";
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

  // Instance-aware widget URL for embedding
  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId.trim()) qp.set("inst", instId.trim());
    else qp.set("bot", botId);

    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    qp.set("messageStyle", messageStyle);
    if (label) qp.set("label", label);
    if (labelColor) qp.set("labelColor", labelColor);
    if (color) qp.set("color", color);
    if (img.trim()) qp.set("image", img.trim());
    if (botAvatarUrl.trim()) qp.set("botAvatar", botAvatarUrl.trim());

    return `/widget?${qp.toString()}`;
  }, [
    instId,
    botId,
    pos,
    size,
    shape,
    imageFit,
    messageStyle,
    label,
    labelColor,
    color,
    img,
    botAvatarUrl,
  ]);

  const embedIframe = `<iframe
  src="${widgetSrc}"
  style="border:0;width:100%;height:560px"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;

  const labelCls = "text-sm font-bold uppercase text-purple-700";
  const inputCls =
    "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className={`rounded-t-2xl p-4 ${gradientHeader}`}>
          <div className="text-xl font-extrabold">Widget Preview</div>
          <div className="text-sm opacity-90">Tune the customer-facing widget style.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div>
            <div className={labelCls}>Instance ID (optional)</div>
            <input
              className={inputCls}
              placeholder="inst_abc123…"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Bot ID</div>
            <input
              className={inputCls}
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              disabled={!!instId.trim()}
              title={instId.trim() ? "Instance is set; Bot ID ignored" : "Enter a bot id"}
            />
          </div>

          <div>
            <div className={labelCls}>Mode</div>
            <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="popup">popup (floating bubble)</option>
              <option value="inline">inline</option>
              <option value="sidebar">sidebar</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Position</div>
            <select className={inputCls} value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
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
            />
          </div>

          <div>
            <div className={labelCls}>Bubble Shape</div>
            <select
              className={inputCls}
              value={shape}
              onChange={(e) =>
                setShape(e.target.value as "circle" | "rounded" | "oval" | "square")
              }
            >
              <option value="circle">circle</option>
              <option value="rounded">rounded</option>
              <option value="oval">oval (pill)</option>
              <option value="square">square</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Bubble Image URL (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/icon.png"
              value={img}
              onChange={(e) => setImg(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Image Fit</div>
            <select
              className={inputCls}
              value={imageFit}
              onChange={(e) => setImageFit(e.target.value as "cover" | "contain")}
            >
              <option value="cover">cover (fill bubble)</option>
              <option value="contain">contain (keep full image)</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Accent Color (bubble)</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Bubble Label</div>
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div>
            <div className={labelCls}>Bubble Label Color</div>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-purple-200"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
            />
          </div>

          <div>
            <div className={labelCls}>Message Style</div>
            <select
              className={inputCls}
              value={messageStyle}
              onChange={(e) =>
                setMessageStyle(
                  e.target.value as
                    | "outlined-black"
                    | "accent-yellow"
                    | "modern-soft"
                    | "pill"
                    | "rounded-rect"
                    | "minimal-outline"
                )
              }
            >
              <option value="outlined-black">outlined-black (your screenshot #1)</option>
              <option value="accent-yellow">accent-yellow (your screenshot #3)</option>
              <option value="modern-soft">modern-soft (your screenshot #4)</option>
              <option value="pill">pill (fully rounded)</option>
              <option value="rounded-rect">rounded rectangle</option>
              <option value="minimal-outline">minimal outline</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className={labelCls}>Bot Avatar URL (optional)</div>
            <input
              className={inputCls}
              placeholder="https://example.com/photo.jpg"
              value={botAvatarUrl}
              onChange={(e) => setBotAvatarUrl(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Use a real photo or logo; appears next to bot messages.
            </div>
          </div>

          <div className="md:col-span-3 flex items-center gap-3">
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
          </div>

          <div className="md:col-span-3">
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
            color={color}
            image={img || undefined}
            imageFit={imageFit}
            shape={shape}
            label={label}
            labelColor={labelColor}
            messageStyle={messageStyle}
            botAvatarUrl={botAvatarUrl || undefined}
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
