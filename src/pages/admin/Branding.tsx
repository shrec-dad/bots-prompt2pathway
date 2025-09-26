// src/pages/admin/Branding.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number; // px
  chatBubblePosition: "bottom-right" | "bottom-left";
};

const KEY = "brandingSettings";
const DEFAULTS: Branding = {
  primaryColor: "#7aa8ff",
  secondaryColor: "#76c19a",
  fontFamily: "Inter, system-ui, Arial, sans-serif",
  chatBubbleColor: "#7aa8ff",
  chatBubbleSize: 64,
  chatBubblePosition: "bottom-right",
};

export default function Branding() {
  const initial = useMemo<Branding>(() => getJSON<Branding>(KEY, DEFAULTS), []);
  const [b, setB] = useState<Branding>(initial);

  const logoRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLInputElement>(null);

  const onPick = (input: HTMLInputElement | null, cb: (dataUrl: string) => void) => {
    if (!input || !input.files?.[0]) return;
    const f = input.files[0];
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result));
    reader.readAsDataURL(f);
  };

  const save = () => {
    setJSON(KEY, b);
    alert("Branding saved!");
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--pastel-blue-deep", b.primaryColor);
    root.style.setProperty("--pastel-green-deep", b.secondaryColor);
    root.style.setProperty("--text-strong", "#000000");
    root.style.setProperty("--border-strong", "#000000");
    document.body.style.fontFamily = b.fontFamily;
  }, [b.primaryColor, b.secondaryColor, b.fontFamily]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border p-6 bg-card">
        <h1 className="text-2xl font-extrabold">Branding</h1>
        <p className="mt-2 text-foreground/80">
          Customize the look and feel of your bot with logos, colors, and themes.
        </p>
        <div className="mt-4">
          <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            onClick={save}>
            Save Branding
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand colors & type */}
        <div className="rounded-xl border p-6 bg-card space-y-4">
          <div className="text-lg font-extrabold">Brand Colors & Typography</div>

          <label className="text-sm font-bold">Primary Color</label>
          <input className="rounded-lg border bg-card px-3 py-2"
                 type="color"
                 value={b.primaryColor}
                 onChange={(e) => setB({ ...b, primaryColor: e.target.value })} />

          <label className="text-sm font-bold">Secondary Color</label>
          <input className="rounded-lg border bg-card px-3 py-2"
                 type="color"
                 value={b.secondaryColor}
                 onChange={(e) => setB({ ...b, secondaryColor: e.target.value })} />

          <label className="text-sm font-bold">Font Family</label>
          <select className="rounded-lg border bg-card px-3 py-2"
                  value={b.fontFamily}
                  onChange={(e) => setB({ ...b, fontFamily: e.target.value })}>
            <option>Inter, system-ui, Arial, sans-serif</option>
            <option>Montserrat, Arial, sans-serif</option>
            <option>Playfair Display, Georgia, serif</option>
            <option>Times New Roman, Times, serif</option>
          </select>

          <div>
            <div className="text-sm font-bold mb-2">Logo Upload</div>
            <input ref={logoRef} type="file" accept="image/*"
                   className="block text-sm"
                   onChange={() =>
                     onPick(logoRef.current, (dataUrl) => setB({ ...b, logoDataUrl: dataUrl }))
                   } />
            {b.logoDataUrl && (
              <div className="mt-3 inline-block rounded-xl border p-2 bg-white">
                <img src={b.logoDataUrl} alt="Logo" style={{ maxWidth: 200 }} />
              </div>
            )}
          </div>
        </div>

        {/* Chat bubble */}
        <div className="rounded-xl border p-6 bg-card space-y-4">
          <div className="text-lg font-extrabold">Chat Bubble</div>

          <label className="text-sm font-bold">Bubble Color</label>
          <input className="rounded-lg border bg-card px-3 py-2"
                 type="color"
                 value={b.chatBubbleColor}
                 onChange={(e) => setB({ ...b, chatBubbleColor: e.target.value })} />

          <label className="text-sm font-bold">Bubble Size (px)</label>
          <input className="w-full"
                 type="range" min={48} max={120} step={2}
                 value={b.chatBubbleSize}
                 onChange={(e) => setB({ ...b, chatBubbleSize: Number(e.target.value) })} />
          <div className="text-xs text-foreground/70">{b.chatBubbleSize}px</div>

          <label className="text-sm font-bold">Bubble Position</label>
          <select className="rounded-lg border bg-card px-3 py-2"
                  value={b.chatBubblePosition}
                  onChange={(e) => setB({ ...b, chatBubblePosition: e.target.value as Branding["chatBubblePosition"] })}>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>

          <div>
            <div className="text-sm font-bold mb-1">Bubble Image (optional)</div>
            <input ref={bubbleRef} type="file" accept="image/*"
                   className="block text-sm"
                   onChange={() =>
                     onPick(bubbleRef.current, (dataUrl) => setB({ ...b, chatBubbleImage: dataUrl }))
                   } />
            {b.chatBubbleImage && (
              <div className="mt-3 inline-block rounded-xl border p-2 bg-white">
                <img src={b.chatBubbleImage} alt="Bubble" style={{ maxWidth: 120 }} />
              </div>
            )}
          </div>

          {/* Bubble Preview */}
          <div className="mt-2 rounded-2xl border ring-1 ring-border p-4 bg-card">
            <div className="text-sm font-extrabold mb-2">Chat Bubble Preview</div>
            <div className="relative h-32 w-full rounded-xl bg-muted/40 ring-1 ring-border overflow-hidden">
              <div
                className="absolute rounded-full ring-1 ring-border grid place-items-center text-xs font-bold"
                style={{
                  width: b.chatBubbleSize,
                  height: b.chatBubbleSize,
                  background: b.chatBubbleColor,
                  bottom: 16,
                  right: b.chatBubblePosition === "bottom-right" ? 16 : "auto",
                  left: b.chatBubblePosition === "bottom-left" ? 16 : "auto",
                  color: "#111",
                }}
                title="Bubble preview"
              >
                Bot
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground/70">
              Uses your saved branding. Update and click “Save Branding”.
            </div>
          </div>
        </div>
      </div>

      {/* Live preview card */}
      <div className="rounded-xl border p-6 bg-card">
        <div className="text-lg font-extrabold mb-3">Live Preview</div>
        <div className="flex items-center gap-4">
          {b.logoDataUrl && (
            <img src={b.logoDataUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
          )}
          <div style={{ fontFamily: b.fontFamily }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Preview Title</div>
            <div>Primary: {b.primaryColor} &nbsp; | &nbsp; Secondary: {b.secondaryColor}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
