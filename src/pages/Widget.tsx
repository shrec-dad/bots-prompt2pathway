// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";

/** ------------------------------------------------------------------------
 * 1) Query helpers + types
 * ----------------------------------------------------------------------- */
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval";
type Fit = "cover" | "contain" | "fill" | "center" | "none";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number; // px
  chatBubblePosition: Pos;
};

const BRAND_KEY = "brandingSettings";

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
    chatBubbleSize: 64,
    chatBubblePosition: "bottom-right",
  };
}

// tiny utility for query params with fallback
function qp<T = string>(name: string, fallback?: T): T {
  const sp = new URLSearchParams(window.location.search);
  return ((sp.get(name) as any) ?? fallback) as T;
}
function qpNum(name: string, fallback: number) {
  const v = Number(new URLSearchParams(window.location.search).get(name));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}
function qpBool(name: string, fallback = false) {
  const v = new URLSearchParams(window.location.search).get(name);
  if (v === null) return fallback;
  return ["1", "true", "yes", "open"].includes(v.toLowerCase());
}

/** ------------------------------------------------------------------------
 * 2) Widget root
 * ----------------------------------------------------------------------- */
export default function Widget() {
  // a) source of truth (URL + branding defaults)
  const branding = useMemo(readBranding, []);
  const [open, setOpen] = useState<boolean>(() => qpBool("open", false));

  // identify bot/instance (so the preview/embed can pass it through)
  const botId = qp("bot", "waitlist-bot");
  const instId = qp("inst", ""); // optional instance override

  // bubble appearance (all overridable via ?query)
  const bubbleSize = qpNum("size", branding.chatBubbleSize);
  const bubblePos: Pos = qp("position", branding.chatBubblePosition);
  const bubbleColor = qp("color", branding.chatBubbleColor);
  const bubbleImage = qp("image", branding.chatBubbleImage || "");
  const bubbleShape: Shape = qp("shape", "circle");
  const imageFit: Fit = qp("imageFit", "cover");
  const bubbleLabel = qp("label", "Chat");
  const bubbleLabelColor = qp("labelColor", "#ffffff"); // NEW

  // chat header avatar (optional)
  const avatarUrl = qp("avatar", branding.logoDataUrl || "");
  const headerTitle = useMemo(() => {
    const base = instId?.trim() ? instId.trim() : botId;
    return base.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
  }, [botId, instId]);

  // apply brand font
  useEffect(() => {
    document.body.style.fontFamily = branding.fontFamily;
  }, [branding.fontFamily]);

  /** ----------------------------------------------------------------------
   * 3) Simple demo chat state (no backend yet)
   * --------------------------------------------------------------------- */
  const [messages, setMessages] = useState<
    { role: "bot" | "user"; text: string }[]
  >([{ role: "bot", text: `Hi! You’re chatting with ${headerTitle}.` }]);
  const [input, setInput] = useState("");

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "bot", text: "Thanks! I’ll get back to you shortly." },
    ]);
    setInput("");
  };

  /** ----------------------------------------------------------------------
   * 4) Visual helpers
   * --------------------------------------------------------------------- */
  const posStyle =
    bubblePos === "bottom-left"
      ? ({ left: 16, right: "auto" } as const)
      : ({ right: 16, left: "auto" } as const);

  // map shape to border radius (oval uses a very high radius to elongate)
  function shapeStyle(shape: Shape): React.CSSProperties {
    switch (shape) {
      case "square":
        return { borderRadius: 8 };
      case "rounded":
        return { borderRadius: 16 };
      case "oval":
        // keep user’s width/height but make it look oval with very high radius
        return { borderRadius: 9999 / 2 };
      case "circle":
      default:
        return { borderRadius: "50%" };
    }
  }

  // map image fit to CSS
  function bgForFit(img: string, fit: Fit) {
    if (!img) return {};
    const base: React.CSSProperties = {
      backgroundImage: `url(${img})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    };
    switch (fit) {
      case "contain":
        return { ...base, backgroundSize: "contain" };
      case "fill":
        return { ...base, backgroundSize: "100% 100%" };
      case "center":
        return { ...base, backgroundSize: "auto" };
      case "none":
        return { ...base, backgroundSize: "auto", backgroundPosition: "center" };
      case "cover":
      default:
        return { ...base, backgroundSize: "cover" };
    }
  }

  /** ----------------------------------------------------------------------
   * 5) Render
   * --------------------------------------------------------------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* ===== Floating Bubble (opens chat) ===== */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: bubbleSize,
            height: bubbleSize,
            display: "grid",
            placeItems: "center",
            border: "2px solid #000",
            boxShadow: "6px 6px 0 #000",
            background: bubbleImage ? bubbleColor : bubbleColor,
            color: bubbleLabelColor,
            cursor: "pointer",
            zIndex: 2147483647, // always on top
            ...shapeStyle(bubbleShape),
            ...(bubbleImage ? bgForFit(bubbleImage, imageFit) : {}),
          }}
        >
          {/* Only show label if we’re not fully covering with an image */}
          {!bubbleImage && (
            <span
              style={{
                fontWeight: 800,
                textShadow:
                  bubbleLabelColor.toLowerCase() === "#ffffff" ||
                  bubbleLabelColor.toLowerCase() === "white"
                    ? "0 1px 0 rgba(0,0,0,.2)"
                    : "none",
              }}
            >
              {bubbleLabel}
            </span>
          )}
        </button>
      )}

      {/* ===== Chat Window ===== */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: 380,
            height: 560,
            borderRadius: 18,
            border: "3px solid #000",
            boxShadow: "10px 10px 0 #000",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 2147483647,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: branding.primaryColor,
              borderBottom: "3px solid #000",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#fff",
                  border: "2px solid #000",
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#fff",
                  border: "2px solid #000",
                }}
              />
            )}

            <div
              style={{
                fontWeight: 900,
                color: "#000",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
                maxWidth: 220,
              }}
              title={headerTitle}
            >
              {headerTitle}
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                fontWeight: 800,
                border: "2px solid #000",
                borderRadius: 8,
                background: "#fff",
                boxShadow: "2px 2px 0 #000",
                cursor: "pointer",
              }}
              aria-label="Close chat"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: 12,
              gap: 8,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "auto",
              background: "#fff",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? branding.secondaryColor : "#f1f5f9",
                  color: "#000",
                  border: "2px solid #000",
                  borderRadius: 14,
                  padding: "10px 12px",
                  maxWidth: "75%",
                  lineHeight: 1.25,
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", borderTop: "3px solid #000" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                padding: "12px 12px",
                fontWeight: 600,
                outline: "none",
              }}
              aria-label="Message"
            />
            <button
              onClick={send}
              style={{
                padding: "10px 16px",
                fontWeight: 900,
                borderLeft: "3px solid #000",
                background: branding.primaryColor,
                cursor: "pointer",
              }}
              aria-label="Send"
              title="Send"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
