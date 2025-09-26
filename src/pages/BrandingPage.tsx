// src/pages/BrandingPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/admin-shared.css";
import { getJSON, setJSON } from "../lib/storage";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number;   // px
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

export default function BrandingPage() {
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

  // Live preview: apply to CSS vars so the whole app updates visually
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--pastel-blue-deep", b.primaryColor);
    root.style.setProperty("--pastel-green-deep", b.secondaryColor);
    root.style.setProperty("--text-strong", "#000000");
    root.style.setProperty("--border-strong", "#000000");
    document.body.style.fontFamily = b.fontFamily;
  }, [b.primaryColor, b.secondaryColor, b.fontFamily]);

  return (
    <div className="admin-page bg-grad-blue">
      <div className="h-row">
        <div className="h-title">Branding</div>
        <div className="stack" style={{ gridTemplateColumns: "auto auto" }}>
          <button className="btn primary" onClick={save}>Save Branding</button>
        </div>
      </div>

      <div className="admin-section grid-2">
        {/* Branding controls */}
        <div className="stack">
          <div className="h-title">Brand Colors & Typography</div>
          <div className="stack">
            <label className="label">Primary Color</label>
            <input
              className="input"
              type="color"
              value={b.primaryColor}
              onChange={(e) => setB({ ...b, primaryColor: e.target.value })}
            />
          </div>
          <div className="stack">
            <label className="label">Secondary Color</label>
            <input
              className="input"
              type="color"
              value={b.secondaryColor}
              onChange={(e) => setB({ ...b, secondaryColor: e.target.value })}
            />
          </div>
          <div className="stack">
            <label className="label">Font Family</label>
            <select
              className="select"
              value={b.fontFamily}
              onChange={(e) => setB({ ...b, fontFamily: e.target.value })}
            >
              <option>Inter, system-ui, Arial, sans-serif</option>
              <option>Montserrat, Arial, sans-serif</option>
              <option>Playfair Display, Georgia, serif</option>
              <option>Times New Roman, Times, serif</option>
            </select>
          </div>

          <div className="stack">
            <div className="h-title">Logo Upload</div>
            <input ref={logoRef} type="file" accept="image/*" className="input" onChange={() =>
              onPick(logoRef.current, (dataUrl) => setB({ ...b, logoDataUrl: dataUrl }))
            }/>
            {b.logoDataUrl && (
              <div className="card" style={{ display: "inline-block" }}>
                <img src={b.logoDataUrl} alt="Logo" style={{ maxWidth: 200 }} />
              </div>
            )}
          </div>
        </div>

        {/* Chat bubble area */}
        <div className="stack">
          <div className="h-title">Chat Bubble</div>
          <div className="stack">
            <label className="label">Bubble Color</label>
            <input
              className="input"
              type="color"
              value={b.chatBubbleColor}
              onChange={(e) => setB({ ...b, chatBubbleColor: e.target.value })}
            />
          </div>
          <div className="stack">
            <label className="label">Bubble Size (px)</label>
            <input
              className="input"
              type="range"
              min={48}
              max={120}
              step={2}
              value={b.chatBubbleSize}
              onChange={(e) => setB({ ...b, chatBubbleSize: Number(e.target.value) })}
            />
            <div>{b.chatBubbleSize}px</div>
          </div>
          <div className="stack">
            <label className="label">Bubble Position</label>
            <select
              className="select"
              value={b.chatBubblePosition}
              onChange={(e) => setB({ ...b, chatBubblePosition: e.target.value as Branding["chatBubblePosition"] })}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
          <div className="stack">
            <div className="label">Bubble Image (optional)</div>
            <input ref={bubbleRef} type="file" accept="image/*" className="input" onChange={() =>
              onPick(bubbleRef.current, (dataUrl) => setB({ ...b, chatBubbleImage: dataUrl }))
            }/>
            {b.chatBubbleImage && (
              <div className="card" style={{ display: "inline-block" }}>
                <img src={b.chatBubbleImage} alt="Bubble" style={{ maxWidth: 120 }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live preview card */}
      <div className="admin-section">
        <div className="h-title">Live Preview</div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: 16 }}>
          {b.logoDataUrl && <img src={b.logoDataUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain" }} />}
          <div style={{ fontFamily: b.fontFamily }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Preview Title</div>
            <div>Primary: {b.primaryColor} | Secondary: {b.secondaryColor}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
