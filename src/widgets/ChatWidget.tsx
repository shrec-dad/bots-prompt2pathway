import React, { useEffect, useMemo, useRef, useState } from "react";

/** Public props you can pass from Preview/Embed */
export type ChatWidgetProps = {
  mode?: "popup" | "inline" | "sidebar";
  botId?: string;

  // Bubble controls
  position?: "bottom-right" | "bottom-left";
  size?: number;                 // base size in px (used by circle/square); oval auto-scales
  color?: string;                // bubble background color if no image
  image?: string;                // optional bubble image URL (URL or data:)
  imageFit?: "cover" | "contain" | "center";
  shape?:
    | "circle"
    | "rounded"
    | "oval"
    | "square"
    | "speechCircle"   // NEW: round speech bubble
    | "speechOval";    // NEW: oval/rounded-rect speech bubble
  label?: string;                // text on the bubble (e.g., "Chat")
  labelColor?: string;           // text color for label

  // Message appearance in the chat transcript
  messageStyle?:
    | "outlined-black"
    | "accent-yellow"
    | "modern-soft"
    | "pill"
    | "rounded-rect"
    | "minimal-outline";

  // Optional avatar (real photo or logo) for BOT messages
  botAvatarUrl?: string;

  // Let parent handle bubble click (e.g., open Preview modal)
  onBubbleClick?: () => void;

  // z-index control for embedding on busy pages
  zIndex?: number;
};

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
  const uniqId = useRef(`cw_${Math.random().toString(36).slice(2)}`).current;

  // ─────────────────────────────────────────────────────────────────────────────
  // Bubble geometry (oval changes width/height; others are square by size)
  // ─────────────────────────────────────────────────────────────────────────────
  const bubbleDims = useMemo(() => {
    // Wider/shorter for oval-ish bodies (oval & speechOval)
    if (shape === "oval" || shape === "speechOval") {
      return {
        width: Math.round(size * 1.55),
        height: Math.round(size * 0.9),
        radius: Math.round(size * 0.9),
      };
    }
    const squareish = { width: size, height: size };
    if (shape === "rounded") return { ...squareish, radius: 14 };
    if (shape === "square") return { ...squareish, radius: 6 };
    // default circle & speechCircle use radius = half
    return { ...squareish, radius: size / 2 };
  }, [shape, size]);

  const bubbleSideStyle =
    position === "bottom-left"
      ? { left: 20, right: "auto" as const }
      : { right: 20, left: "auto" as const };

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

  // Keep the panel fully visible on very small screens
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => {};
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Message style maps
  // ─────────────────────────────────────────────────────────────────────────────
  const msgStyles = useMemo(() => {
    const common = {
      botBase: { maxWidth: "80%", padding: "10px 12px", borderWidth: 2 } as React.CSSProperties,
      userBase: { maxWidth: "80%", padding: "10px 12px", borderWidth: 2 } as React.CSSProperties,
    };
    switch (messageStyle) {
      case "outlined-black":
        return {
          bot: { ...common.botBase, background: "#fff", color: "#000", border: "2px solid #000", borderRadius: 12 },
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
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "2px solid #000",
        overflow: "hidden",
        background: "#fff",
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
    return renderPanel({ anchored: true, fullHeightRight: false }); // popup
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
          <div style={{ fontWeight: 900 }}>Waitlist Bot</div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              fontWeight: 800,
              border: "2px solid #000",
              background: "#fff",
              borderRadius: 8,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Transcript */}
        <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
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
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Type a message…"
            style={{ flex: 1, padding: "12px", fontWeight: 600, outline: "none" }}
          />
          <button onClick={send} style={{ padding: "12px 16px", fontWeight: 800, borderLeft: "2px solid #000", background: color, color: "#fff" }}>
            Send
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Bubble renderers
  // ─────────────────────────────────────────────────────────────────────────────

  /** SVG speech bubbles with optional image fill via clipPath */
  const SpeechBubble = ({
    variant, // "circle" | "oval"
  }: {
    variant: "circle" | "oval";
  }) => {
    const w = bubbleDims.width;
    const h = bubbleDims.height;
    const tailW = Math.max(10, Math.round(w * 0.18));
    const tailH = Math.max(10, Math.round(h * 0.26));

    // Tail points toward page interior (so it looks anchored to page edge)
    const tailOnLeft = position === "bottom-right";
    const tailX = tailOnLeft ? 10 : w - 10;
    const tipX = tailOnLeft ? -tailW : w + tailW;

    const clipId = `${uniqId}_clip`;

    const body =
      variant === "circle" ? (
        // circular body
        <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 3} />
      ) : (
        // rounded-rect / oval-like body
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={Math.min(18, bubbleDims.radius)} ry={Math.min(18, bubbleDims.radius)} />
      );

    const tail = (
      <path
        d={`M ${tailX} ${h - 18}
           Q ${tailOnLeft ? tailX - tailW * 0.2 : tailX + tailW * 0.2} ${h - 8},
             ${tailX} ${h - 6}
           L ${tipX} ${h + tailH}
           Z`}
      />
    );

    const preserve =
      imageFit === "cover" ? "xMidYMid slice" : imageFit === "contain" ? "xMidYMid meet" : "none";

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id={clipId}>
            {body}
            {tail}
          </clipPath>
        </defs>

        {/* fill (color or image) */}
        {image ? (
          <>
            <image href={image} width={w} height={h} preserveAspectRatio={preserve} clipPath={`url(#${clipId})`} />
            <g fill="none" stroke="#000" strokeWidth="2">
              {body}
              {tail}
            </g>
          </>
        ) : (
          <>
            <g clipPath={`url(#${clipId})`}>
              <rect x="0" y="0" width={w} height={h} fill={color} />
            </g>
            <g fill="none" stroke="#000" strokeWidth="2">
              {body}
              {tail}
            </g>
          </>
        )}
      </svg>
    );
  };

  const BubbleLabel = () =>
    label ? (
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: labelColor,
          fontWeight: 900,
          padding: "0 8px",
          userSelect: "none",
        }}
      >
        {label}
      </span>
    ) : null;

  const BoxBubble = () => (
    <>
      {/* optional image fill */}
      {image && (
        <img
          src={image}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: imageFit === "center" ? "none" : imageFit,
            objectPosition: "center",
            position: "absolute",
            inset: 0,
            borderRadius: bubbleDims.radius,
          }}
        />
      )}
      {!image && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: bubbleDims.radius,
            background: color,
          }}
        />
      )}
      <BubbleLabel />
    </>
  );

  const SpeechBubbleWrapper = ({ variant }: { variant: "circle" | "oval" }) => (
    <>
      <SpeechBubble variant={variant} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
          paddingInline: 6,
          textAlign: "center",
        }}
      >
        <BubbleLabel />
      </div>
    </>
  );

  // Click handler: allow parent to intercept (Preview opens modal)
  const handleBubbleClick = () => {
    if (onBubbleClick) {
      onBubbleClick();
      return;
    }
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
            borderRadius: shape.startsWith("speech") ? undefined : bubbleDims.radius,
            border: "2px solid #000",
            background: "transparent",
            overflow: "hidden",
            // single shadow (no double bubbles)
            boxShadow: "6px 6px 0 #000",
            zIndex,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {shape === "speechCircle" && <SpeechBubbleWrapper variant="circle" />}
          {shape === "speechOval" && <SpeechBubbleWrapper variant="oval" />}
          {shape !== "speechCircle" && shape !== "speechOval" && <BoxBubble />}
        </button>
      )}

      {/* Panels */}
      {open && <Panel />}
      {mode === "inline" && !open && (
        <div style={{ margin: "12px 0" }}>
          <Panel />
        </div>
      )}
      {mode === "sidebar" && !open && <Panel />}
    </div>
  );
}
