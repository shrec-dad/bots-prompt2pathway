// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";

/** ---------------------------------------------------------------
 * Branding pulled from localStorage (kept from your original file)
 * --------------------------------------------------------------- */
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

const BRAND_KEY = "brandingSettings";

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
  };
}

/** ---------------------------------------------------------------
 * URL params used by Preview/Embed
 *  - bot / inst  (not used for logic yet, but preserved)
 *  - position: "bottom-right" | "bottom-left"
 *  - size: number
 *  - color: hex/rgb for bubble bg when no image
 *  - image: url to fill/contain inside bubble
 *  - imageFit: "cover" | "contain"
 *  - shape: "circle" | "rounded" | "square" | "oval"
 *  - label: text inside the bubble (optional)
 *  - labelColor: bubble label color
 * --------------------------------------------------------------- */
type BubbleShape = "circle" | "rounded" | "square" | "oval";
type ImageFit = "cover" | "contain";
type Position = "bottom-right" | "bottom-left";

function useQueryParams() {
  return useMemo(() => {
    const qp = new URLSearchParams(window.location.search);
    const params = {
      bot: qp.get("bot") || "",
      inst: qp.get("inst") || "",
      position: (qp.get("position") as Position) || undefined,
      size: qp.get("size") ? Math.max(40, Number(qp.get("size"))) : undefined,
      color: qp.get("color") || undefined,
      image: qp.get("image") || undefined,
      imageFit: (qp.get("imageFit") as ImageFit) || undefined,
      shape: (qp.get("shape") as BubbleShape) || undefined,
      label: qp.get("label") || undefined,
      labelColor: qp.get("labelColor") || undefined,
    };
    return params;
  }, []);
}

/** ---------------------------------------------------------------
 * Helpers for bubble rendering
 * --------------------------------------------------------------- */
function bubbleBorderRadius(shape: BubbleShape, size: number) {
  switch (shape) {
    case "circle":
      return "50%";
    case "rounded":
      // A nice rounded-rect for square-ish sizes, scales with size
      return Math.round(size * 0.25);
    case "square":
      return 10; // still a hint of radius so outline looks crisp
    case "oval":
      // Horizontal oval look (prevents “square” issue you saw)
      return `${Math.round(size * 0.6)}px / ${Math.round(size * 0.42)}px`;
    default:
      return "50%";
  }
}

export default function Widget() {
  /** ------------------ Setup + Options ------------------ */
  const b = useMemo(getBranding, []);
  const qp = useQueryParams();

  // Open/close
  const [open, setOpen] = useState(false);

  // Bubble settings (preview can override via query params)
  const position: Position = qp.position || b.chatBubblePosition || "bottom-right";
  const bubbleSize = qp.size ?? b.chatBubbleSize ?? 64;
  const bubbleColor = qp.color ?? b.chatBubbleColor ?? "#7aa8ff";
  const bubbleImage = qp.image ?? b.chatBubbleImage;
  const imageFit: ImageFit = qp.imageFit || "cover";
  const shape: BubbleShape = qp.shape || "circle";
  const bubbleLabel = qp.label; // optional text inside bubble
  const bubbleLabelColor = qp.labelColor || "#fff";

  // Font family from branding
  useEffect(() => {
    document.body.style.fontFamily = b.fontFamily;
  }, [b.fontFamily]);

  // Positions for bubble & window
  const posStyle =
    position === "bottom-left"
      ? { left: 16, right: "auto" as const }
      : { right: 16, left: "auto" as const };

  /** ------------------ Simple fake chat state ------------------ */
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! You’re chatting with Waitlist Bot." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "bot", text: "Thanks! We’ll get back to you shortly." },
    ]);
    setInput("");
  };

  /** ------------------ Styles that fix clipping ------------------ */
  const SAFE_HEADER = 52; // fixed header height in the window
  const CONTENT_PADDING = 16; // inner padding for scroll area
  const TOP_SCROLL_PAD = 12;  // extra padding so first bubble never clips

  // very high layer to stay above anything
  const Z = 2147483000;

  /** ------------------ Render ------------------ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
        // do NOT hide overflow here; the widget lives on top with fixed
        overflow: "visible",
      }}
    >
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 22,
            ...posStyle,
            width: bubbleSize,
            height: bubbleSize,
            borderRadius: bubbleBorderRadius(shape, bubbleSize),
            background: bubbleImage
              ? `url(${bubbleImage}) center/${imageFit} no-repeat, ${bubbleColor}`
              : bubbleColor,
            color: bubbleLabelColor,
            border: "3px solid #000",
            boxShadow: "6px 6px 0 #000",
            zIndex: Z,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            padding: 0,
          }}
        >
          {bubbleLabel ? (
            <span
              style={{
                lineHeight: 1,
                fontSize: Math.max(11, Math.round(bubbleSize * 0.28)),
                textShadow: "0 1px 0 rgba(0,0,0,0.15)",
                userSelect: "none",
              }}
            >
              {bubbleLabel}
            </span>
          ) : null}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat window"
          style={{
            position: "fixed",
            bottom: 22,
            ...posStyle,
            width: 380,
            height: 540,
            borderRadius: 18,
            border: "3px solid #000",
            boxShadow: "10px 10px 0 #000",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: Z,
          }}
        >
          {/* Header (fixed height) */}
          <div
            style={{
              height: SAFE_HEADER,
              minHeight: SAFE_HEADER,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: b.primaryColor,
              borderBottom: "3px solid #000",
            }}
          >
            {b.logoDataUrl ? (
              <img
                src={b.logoDataUrl}
                alt="Logo"
                style={{
                  width: 28,
                  height: 28,
                  objectFit: "contain",
                  background: "#fff",
                  borderRadius: 6,
                  border: "1px solid #000",
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "#fff",
                  borderRadius: 6,
                  border: "1px solid #000",
                }}
              />
            )}

            <div style={{ fontWeight: 900, color: "#000" }}>Waitlist Bot</div>

            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                marginLeft: "auto",
                padding: "2px 8px",
                fontWeight: 800,
                border: "3px solid #000",
                borderRadius: 10,
                background: "#fff",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Messages (scrollable).  IMPORTANT: extra top padding fixes clipping */}
          <div
            style={{
              // leave room for header and add generous top padding
              padding: `${CONTENT_PADDING + TOP_SCROLL_PAD}px ${CONTENT_PADDING}px ${CONTENT_PADDING}px`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              overflowY: "auto",
              // scroll padding ensures when you jump to top the first chip still shows fully
              scrollPaddingTop: TOP_SCROLL_PAD + 4,
              overscrollBehavior: "contain",
              background: "#fff",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? b.secondaryColor : "#f1f5f9",
                  color: "#000",
                  border: "2px solid #000",
                  borderRadius: 14,
                  padding: "8px 12px",
                  maxWidth: "78%",
                  // ensure first bubble can’t clip if it lands at the very top edge
                  marginTop: i === 0 ? 2 : 0,
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              borderTop: "3px solid #000",
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                padding: "12px 14px",
                fontWeight: 600,
                outline: "none",
                border: 0,
              }}
            />
            <button
              onClick={send}
              style={{
                padding: "12px 16px",
                fontWeight: 900,
                borderLeft: "3px solid #000",
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
