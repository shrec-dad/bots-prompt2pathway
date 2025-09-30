// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";

/** Bubble appearance options */
type BubbleShape = "circle" | "rounded" | "square" | "oval" | "chat";
type BubblePos = "bottom-right" | "bottom-left";
type ImageFit = "cover" | "contain";

/** Branding saved locally (fallbacks) */
type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string; // data URL or URL
  chatBubbleColor: string;
  chatBubbleSize: number; // px (base size)
  chatBubblePosition: BubblePos;
  // optional future fields:
  chatBubbleShape?: BubbleShape;
  chatBubbleImageFit?: ImageFit;
};

const BRAND_KEY = "brandingSettings";

/** Local branding fallback */
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
    chatBubbleSize: 64,
    chatBubblePosition: "bottom-right",
    chatBubbleShape: "circle",
    chatBubbleImageFit: "cover",
  };
}

/** Read query params from /widget?... */
function getQueryParams() {
  const sp = new URLSearchParams(window.location.search);
  const num = (v: string | null, d: number) => {
    const n = Number(v ?? "");
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  const pick = <T extends string>(v: string | null, allowed: readonly T[], d: T): T =>
    allowed.includes((v as T) || ("" as T)) ? (v as T) : d;

  return {
    inst: sp.get("inst") || undefined,
    bot: sp.get("bot") || undefined,
    position: pick<BubblePos>(sp.get("position"), ["bottom-left", "bottom-right"] as const, "bottom-right"),
    size: num(sp.get("size"), 64),
    color: sp.get("color") || undefined,
    image: sp.get("image") || undefined,
    shape: pick<BubbleShape>(
      sp.get("shape"),
      ["circle", "rounded", "square", "oval", "chat"] as const,
      "circle"
    ),
    imageFit: pick<ImageFit>(sp.get("imageFit"), ["cover", "contain"] as const, "cover"),
  };
}

export default function Widget() {
  const b = useMemo(getBranding, []);
  const qp = useMemo(getQueryParams, []);

  // Merge: query params override branding (so Embed/Preview controls work everywhere)
  const bubblePos: BubblePos = qp.position || b.chatBubblePosition || "bottom-right";
  const bubbleSize = qp.size || b.chatBubbleSize || 64;
  const bubbleColor = qp.color || b.chatBubbleColor || "#7aa8ff";
  const bubbleImage = qp.image || b.chatBubbleImage || b.logoDataUrl || undefined;
  const bubbleShape: BubbleShape = (qp.shape || b.chatBubbleShape || "circle") as BubbleShape;
  const imageFit: ImageFit = (qp.imageFit || b.chatBubbleImageFit || "cover") as ImageFit;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  // Apply typography
  useEffect(() => {
    document.body.style.fontFamily = b.fontFamily;
  }, [b.fontFamily]);

  // Compose sizes by shape
  const dims = useMemo(() => {
    switch (bubbleShape) {
      case "oval":
        return { w: Math.round(bubbleSize * 1.5), h: Math.round(bubbleSize * 0.9), br: 9999 };
      case "square":
        return { w: bubbleSize, h: bubbleSize, br: 0 };
      case "rounded":
        return { w: bubbleSize, h: bubbleSize, br: 16 };
      case "chat":
        // base is circle with tail; looks nice for avatars or solid color
        return { w: bubbleSize, h: bubbleSize, br: "50%" as const };
      case "circle":
      default:
        return { w: bubbleSize, h: bubbleSize, br: "50%" as const };
    }
  }, [bubbleSize, bubbleShape]);

  const posStyle =
    bubblePos === "bottom-left"
      ? { left: 16, right: "auto" as const }
      : { right: 16, left: "auto" as const };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: "Thanks! I’ll get back to you shortly." }]);
    setInput("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* Bubble (closed state) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: dims.w,
            height: dims.h,
            borderRadius: dims.br,
            background: bubbleColor,
            border: "2px solid #000",
            boxShadow: "4px 4px 0 #000",
            overflow: "hidden",
            positionAnchor: "bottom",
          } as React.CSSProperties}
        >
          {/* Optional image fills the bubble */}
          {bubbleImage && (
            <img
              src={bubbleImage}
              alt="Chat bubble"
              style={{
                width: "100%",
                height: "100%",
                objectFit: imageFit,
                borderRadius: dims.br,
                display: "block",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Chat-tail for `shape="chat"` when no image (keeps the speech look) */}
          {bubbleShape === "chat" && !bubbleImage && (
            <>
              {/* outline square */}
              <span
                style={{
                  position: "absolute",
                  bottom: -6,
                  ...(bubblePos === "bottom-right" ? { right: 10 } : { left: 10 }),
                  width: 14,
                  height: 14,
                  background: "#000",
                  transform: "rotate(45deg)",
                  borderRadius: 2,
                }}
              />
              {/* fill square (slightly smaller) */}
              <span
                style={{
                  position: "absolute",
                  bottom: -4,
                  ...(bubblePos === "bottom-right" ? { right: 12 } : { left: 12 }),
                  width: 10,
                  height: 10,
                  background: bubbleColor,
                  transform: "rotate(45deg)",
                  borderRadius: 2,
                }}
              />
            </>
          )}
        </button>
      )}

      {/* Chat window (open state) */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: 360,
            height: 520,
            borderRadius: 16,
            border: "2px solid #000",
            boxShadow: "8px 8px 0 #000",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: b.primaryColor,
              borderBottom: "2px solid #000",
            }}
          >
            {b.logoDataUrl ? (
              <img
                src={b.logoDataUrl}
                alt="Logo"
                style={{ width: 28, height: 28, objectFit: "contain", background: "#fff", borderRadius: 6 }}
              />
            ) : (
              <div style={{ width: 28, height: 28, background: "#fff", borderRadius: 6, border: "1px solid #000" }} />
            )}
            <div style={{ fontWeight: 900, color: "#000" }}>Chat</div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                padding: "4px 8px",
                fontWeight: 700,
                border: "2px solid #000",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{ padding: 12, gap: 8, display: "flex", flexDirection: "column", flex: 1, overflow: "auto" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? b.secondaryColor : "#f1f5f9",
                  color: "#000",
                  border: "2px solid #000",
                  borderRadius: 12,
                  padding: "8px 10px",
                  maxWidth: "75%",
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", borderTop: "2px solid #000" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                padding: "10px 12px",
                fontWeight: 600,
                outline: "none",
              }}
            />
            <button
              onClick={send}
              style={{
                padding: "10px 14px",
                fontWeight: 800,
                borderLeft: "2px solid #000",
                background: b.primaryColor,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
