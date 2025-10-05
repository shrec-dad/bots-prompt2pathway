// src/widgets/ChatWidget.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Public props you can pass from Preview/Embed */
export type ChatWidgetProps = {
  mode?: "popup" | "inline" | "sidebar";
  botId?: string;

  // Bubble controls
  position?: "bottom-right" | "bottom-left";
  size?: number;                 // base size in px (used by circle/square); oval/badge auto-scale
  color?: string;                // bubble background color if no image
  image?: string;                // optional bubble image URL or data: URI
  imageFit?: "cover" | "contain" | "center";
  shape?: "circle" | "rounded" | "oval" | "square" | "chat" | "badge";
  label?: string;                // text on/inside the bubble (e.g., "Chat")
  labelColor?: string;           // text color for label

  // Message appearance in the chat transcript
  messageStyle?:
    | "outlined-black"  // white with bold black outline
    | "accent-yellow"   // yellow card style
    | "modern-soft"     // gray soft
    | "pill"            // fully rounded
    | "rounded-rect"    // rounded rectangle
    | "minimal-outline";// subtle gray outline

  // Optional avatar (real photo or logo) for BOT messages
  botAvatarUrl?: string;

  // Let the parent intercept bubble clicks (e.g., open a large modal)
  onBubbleClick?: () => void;

  // z-index control for embedding on busy pages
  zIndex?: number;
};

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ChatWidget({
  mode = "popup",
  botId = "waitlist-bot",

  position = "bottom-right",
  size = 64,
  color = "#7aa8ff",
  image,
  imageFit = "cover",
  shape = "circle",
  label = "Chat",
  labelColor = "#ffffff",

  messageStyle = "outlined-black",
  botAvatarUrl,

  onBubbleClick,

  zIndex = 2147483000,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Bubble geometry (includes OVAL fix & support for BADGE and CHAT)
  // ─────────────────────────────────────────────────────────────────────────────
  const bubbleDims = useMemo(() => {
    if (shape === "oval") {
      return {
        width: Math.round(size * 1.55),  // wider
        height: Math.round(size * 0.9),  // shorter
        radius: Math.round(size * 0.9),  // pill-like
      };
    }
    if (shape === "badge") {
      return {
        width: Math.round(size * 2.2),
        height: size,
        radius: 9999,
      };
    }
    // "chat" uses rounded rectangle dimensions; we draw the tail separately
    if (shape === "chat") {
      return { width: size, height: size, radius: 16 };
    }
    const squareish = { width: size, height: size };
    if (shape === "rounded") return { ...squareish, radius: 14 };
    if (shape === "square") return { ...squareish, radius: 6 };
    // default circle
    return { ...squareish, radius: size / 2 };
  }, [shape, size]);

  const bubbleSideStyle =
    position === "bottom-left"
      ? { left: 20, right: "auto" as const }
      : { right: 20, left: "auto" as const };

  const bubbleBackground = color; // keep your color even when image is present (image overlays)

  // ─────────────────────────────────────────────────────────────────────────────
  // Demo transcript state (until wired to real flow)
  // ─────────────────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! You’re chatting with Waitlist Bot." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    const txt = input.trim();
    if (!txt) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: txt },
      { role: "bot", text: "Thanks! We’ll be in touch shortly." },
    ]);
    setInput("");
  };

  // Keep the panel fully visible on very small screens (placeholder hook)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => {};
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Message style maps (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  const msgStyles = useMemo(() => {
    const common = {
      botBase: { maxWidth: "80%", padding: "10px 12px", borderWidth: 2 } as React.CSSProperties,
      userBase: { maxWidth: "80%", padding: "10px 12px", borderWidth: 2 } as React.CSSProperties,
    };

    switch (messageStyle) {
      case "outlined-black":
        return {
          bot: { ...common.botBase, background: "#ffffff", color: "#000", border: "2px solid #000", borderRadius: 12 },
          user: { ...common.userBase, background: "#E9F5FF", color: "#000", border: "2px solid #000", borderRadius: 12 },
        };
      case "accent-yellow":
        return {
          bot: { ...common.botBase, background: "#FEF08A", color: "#0F172A", border: "2px solid #D97706", borderRadius: 12 },
          user: { ...common.userBase, background: "#FFF7ED", color: "#0F172A", border: "2px solid #D6D3D1", borderRadius: 12 },
        };
      case "modern-soft":
        return {
          bot: { ...common.botBase, background: "#EEF1F7", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 18 },
          user: { ...common.userBase, background: "#E9F5FF", color: "#111827", border: "1px solid #BFDBFE", borderRadius: 18 },
        };
      case "rounded-rect":
        return {
          bot: { ...common.botBase, background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 12 },
          user: { ...common.userBase, background: "#EEF2FF", color: "#111827", border: "1px solid #C7D2FE", borderRadius: 12 },
        };
      case "minimal-outline":
        return {
          bot: { ...common.botBase, background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 10 },
          user: { ...common.userBase, background: "#FFFFFF", color: "#111827", border: "1px solid #D1D5DB", borderRadius: 10 },
        };
      case "pill":
      default:
        return {
          bot: { ...common.botBase, background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 9999 },
          user: { ...common.userBase, background: "#EEF2FF", color: "#111827", border: "1px solid #C7D2FE", borderRadius: 9999 },
        };
    }
  }, [messageStyle]);

  // Avatar for bot
  const BotAvatar = () => (
    <div
      style={{
        width: 32, height: 32, borderRadius: "50%", border: "2px solid #000",
        overflow: "hidden", background: "#fff",
      }}
    >
      {botAvatarUrl ? (
        <img src={botAvatarUrl} alt="bot avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontWeight: 800 }}>🤖</div>
      )}
    </div>
  );

  // Panel container for different modes
  const Panel: React.FC = () => {
    if (mode === "inline") return renderPanel({ anchored: false, fullHeightRight: false });
    if (mode === "sidebar") return renderPanel({ anchored: false, fullHeightRight: true });
    // popup (anchored above the bubble)
    return renderPanel({ anchored: true, fullHeightRight: false });
  };

  function renderPanel(opts: { anchored: boolean; fullHeightRight: boolean }) {
    const baseCard: React.CSSProperties = {
      width: opts.fullHeightRight ? 400 : 380,
      height: opts.fullHeightRight ? "100vh" : 520,
      maxHeight: "min(700px, 90vh)",
      background: "#fff",
      border: "2px solid #000",
      borderRadius: opts.fullHeightRight ? 0 : 18,
      boxShadow: "10px 10px 0 #000",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    };

    const anchoredStyle: React.CSSProperties = opts.anchored
      ? {
          position: "fixed",
          bottom: bubbleDims.height + 32,
          ...(position === "bottom-left" ? { left: 20 } : { right: 20 }),
          zIndex,
        }
      : {};

    const sidebarStyle: React.CSSProperties = opts.fullHeightRight
      ? { position: "fixed", top: 0, bottom: 0, right: 0, zIndex }
      : {};

    return (
      <div style={{ ...baseCard, ...anchoredStyle, ...sidebarStyle }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(90deg, #c4b5fd 0%, #a5b4fc 50%, #86efac 100%)",
            padding: "12px 14px",
            borderBottom: "2px solid #000",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 900 }}>{toTitle(botId || "Chat")}</div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              marginLeft: "auto", padding: "4px 10px", fontWeight: 800,
              border: "2px solid #000", background: "#fff", borderRadius: 8, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Transcript */}
        <div
          style={{
            flex: 1, overflow: "auto", padding: 12,
            display: "flex", flexDirection: "column", gap: 10,
          }}
        >
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  justifyContent: isUser ? "flex-end" : "flex-start",
                }}
              >
                {!isUser && <BotAvatar />}
                <div style={isUser ? msgStyles.user : msgStyles.bot}>{m.text}</div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div style={{ display: "flex", borderTop: "2px solid #000" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Type a message…"
            style={{ flex: 1, padding: "12px", fontWeight: 600, outline: "none" }}
          />
          <button
            onClick={send}
            style={{
              padding: "12px 16px", fontWeight: 800,
              borderLeft: "2px solid #000", background: color, color: "#fff",
            }}
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  const handleBubbleClick = () => {
    if (onBubbleClick) return onBubbleClick(); // delegate to parent (e.g., Preview modal)
    setOpen((v) => !v);
  };

  return (
    <div ref={containerRef}>
      {/* Bubble (always rendered for popup mode; optional for others) */}
      {mode === "popup" && (
        <button
          onClick={handleBubbleClick}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 20,
            ...bubbleSideStyle,
            width: bubbleDims.width,
            height: bubbleDims.height,
            borderRadius: bubbleDims.radius,
            border: "2px solid #000",
            background: bubbleBackground,
            overflow: "hidden",
            boxShadow: "6px 6px 0 #000",
            zIndex,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingInline: shape === "badge" ? 12 : 0,
          }}
        >
          {/* Image (if provided) */}
          {image ? (
            <img
              src={image}
              alt="bubble"
              style={{
                width: "100%",
                height: "100%",
                objectFit: imageFit === "center" ? "none" : imageFit,
                objectPosition: "center",
                position: "absolute",
                inset: 0,
              }}
            />
          ) : null}

          {/* Label */}
          {label && (
            <span
              style={{
                position: "relative",
                zIndex: 1,
                color: labelColor,
                fontWeight: 900,
                fontSize: shape === "badge" ? 14 : 12,
                lineHeight: 1,
                textAlign: "center",
                paddingInline: shape === "badge" ? 4 : 0,
              }}
            >
              {label}
            </span>
          )}

          {/* Chat “tail” */}
          {shape === "chat" && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: -6,
                // tail should point toward the corner
                ...(position === "bottom-left" ? { left: 14 } : { right: 14 }),
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "10px solid #000",
                // inner color (overlay) to match background, slightly offset
                filter: "drop-shadow(0 -2px 0 #000)",
              }}
            />
          )}
        </button>
      )}

      {/* Panels */}
      {open && !onBubbleClick && <Panel />}
      {mode === "inline" && !open && (
        <div style={{ margin: "12px 0" }}>
          <Panel />
        </div>
      )}
      {mode === "sidebar" && !open && <Panel />}
    </div>
  );
}
