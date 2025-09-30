// src/widgets/ChatWidget.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "chat" | "oval";
type ImgFit = "cover" | "contain" | "fill";

type MessageStyle =
  | "roundedCard"   // clean card (your current)
  | "speechClassic" // classic cartoon bubble with tail (your preferred #1)
  | "speechOval"    // horizontal balloon with tail (your preferred #2)
  | "pill"          // fully rounded pill
  | "glass"         // translucent glass
  | "outlined";     // white with strong black outline

export type ChatWidgetProps = {
  mode?: Mode;
  botId?: string;
  position?: Pos;
  size?: number;
  color?: string;
  image?: string;

  // NEW bubble options
  shape?: Shape;
  imageFit?: ImgFit;
  labelText?: string;    // e.g., "Chat", "Hi", "Help?"
  labelColor?: string;   // color for bubble label

  // NEW chat panel options
  messageStyle?: MessageStyle;
  avatarImage?: string;  // real photo/logo for the bot avatar
};

const defaultProps: Required<Pick<
  ChatWidgetProps,
  "mode" | "position" | "size" | "color" | "shape" | "imageFit" | "labelText" | "labelColor" | "messageStyle"
>> = {
  mode: "popup",
  position: "bottom-right",
  size: 64,
  color: "#7aa8ff",
  shape: "circle",
  imageFit: "cover",
  labelText: "Chat",
  labelColor: "#ffffff",
  messageStyle: "roundedCard",
};

function useOutsideClose(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keyup", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keyup", onEsc);
    };
  }, [onClose, ref]);
}

export default function ChatWidget(props: ChatWidgetProps) {
  const p = { ...defaultProps, ...props };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! You’re chatting with Waitlist Bot." },
  ]);
  const [input, setInput] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  useOutsideClose(panelRef, () => setOpen(false));

  const posStyle =
    p.position === "bottom-left"
      ? { left: 20, right: "auto" as const }
      : { right: 20, left: "auto" as const };

  // -------- Bubble shape -----------
  const bubbleBorderRadius = useMemo(() => {
    switch (p.shape) {
      case "circle":
        return "50%";
      case "rounded":
        return "18px";
      case "square":
        return "8px";
      case "oval":
        return "999px / 70%";
      case "chat":
        // base is rounded; tail will be drawn with ::after
        return "18px";
      default:
        return "50%";
    }
  }, [p.shape]);

  const bubbleBackground = useMemo(() => {
    // If user supplies an image, show it and tint underneath with color
    if (p.image) {
      const fit = p.imageFit || "cover";
      return `${p.color}`;
    }
    return p.color;
  }, [p.color, p.image, p.imageFit]);

  // -------- Message styles ----------
  function msgStyle(role: "bot" | "user") {
    const isUser = role === "user";
    const black = "#000";
    const common: React.CSSProperties = {
      maxWidth: "80%",
      padding: "10px 12px",
      border: "2px solid #000",
      wordBreak: "break-word",
    };

    switch (p.messageStyle) {
      case "roundedCard":
        return {
          ...common,
          borderRadius: 12,
          background: isUser ? "#e9d5ff" : "#fff",
        };
      case "pill":
        return {
          ...common,
          borderRadius: 9999,
          background: isUser ? "#d9f99d" : "#fff",
        };
      case "glass":
        return {
          ...common,
          borderRadius: 14,
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(6px)",
        } as React.CSSProperties;
      case "outlined":
        return {
          ...common,
          borderRadius: 10,
          background: "#fff",
        };
      case "speechClassic":
        // Classic cartoon with tail (bottom-left for bot, bottom-right for user)
        return {
          ...common,
          position: "relative",
          borderRadius: 16,
          background: isUser ? "#fde68a" : "#fff",
          // tail via ::after
          // We'll render extra <span> absolutely for tail.
        } as React.CSSProperties;
      case "speechOval":
        // Horizontal balloon with tail
        return {
          ...common,
          position: "relative",
          borderRadius: 9999,
          background: isUser ? "#bfdbfe" : "#fff",
        } as React.CSSProperties;
      default:
        return {
          ...common,
          borderRadius: 12,
          background: isUser ? "#e9d5ff" : "#fff",
        };
    }
  }

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "bot", text: "Thanks! We’ll be in touch." },
    ]);
    setInput("");
  };

  // -------- Bubble label -----------
  const labelStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: "center",
    color: p.labelColor,
    fontWeight: 800,
    fontSize: Math.max(11, Math.round((p.size || 64) / 5)),
    lineHeight: `${p.size}px`,
    pointerEvents: "none",
    userSelect: "none",
  };

  // -------- Panel dimensions --------
  const panelDims =
    p.mode === "sidebar"
      ? { width: 380, height: "100vh" }
      : { width: 380, height: 560 };

  // prevent panel top being cut off & add clean padding
  const panelShell: React.CSSProperties =
    p.mode === "sidebar"
      ? {
          position: "fixed",
          top: 0,
          bottom: 0,
          ...(p.position === "bottom-left" ? { left: 0 } : { right: 0 }),
          zIndex: 2147483000,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "flex-end",
        }
      : {
          position: "fixed",
          bottom: 20,
          ...posStyle,
          zIndex: 2147483000,
        };

  return (
    <>
      {/* Bubble (popup + sidebar modes use the bubble) */}
      {p.mode !== "inline" && (
        <button
          aria-label="Open chat"
          onClick={() => setOpen((o) => !o)}
          style={{
            position: "fixed",
            bottom: 20,
            ...posStyle,
            width: p.size,
            height: p.size,
            background: bubbleBackground,
            borderRadius: bubbleBorderRadius,
            border: "2px solid #000",
            boxShadow: "4px 4px 0 #000",
            backgroundImage: p.image ? `url(${p.image})` : undefined,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: p.image ? (p.imageFit === "contain" ? "contain" : p.imageFit === "fill" ? "100% 100%" : "cover") : undefined,
            overflow: "visible",
          }}
        >
          {/* label text */}
          {p.labelText && <span style={labelStyle}>{p.labelText}</span>}

          {/* chat tail for "chat" shape */}
          {p.shape === "chat" && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: -10,
                ...(p.position === "bottom-left" ? { left: 16 } : { right: 16 }),
                width: 0,
                height: 0,
                borderTop: "12px solid #000",
                borderLeft:
                  p.position === "bottom-left" ? "12px solid transparent" : undefined,
                borderRight:
                  p.position === "bottom-right" ? "12px solid transparent" : undefined,
                transform: "translateY(-2px)",
              }}
            />
          )}
        </button>
      )}

      {/* Panel (popup/inline/sidebar) */}
      {(open || p.mode === "inline") && (
        <div style={panelShell}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal={p.mode !== "inline"}
            style={{
              width: panelDims.width,
              height: panelDims.height as number | string,
              borderRadius: p.mode === "sidebar" ? 0 : 16,
              background: "#fff",
              border: "2px solid #000",
              boxShadow: "10px 10px 0 #000",
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
                gap: 10,
                padding: "12px 14px",
                background: p.color,
                borderBottom: "2px solid #000",
              }}
            >
              {p.avatarImage ? (
                <img
                  src={p.avatarImage}
                  alt="Bot"
                  style={{
                    width: 30,
                    height: 30,
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "2px solid #000",
                    background: "#fff",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    border: "2px solid #000",
                    background: "#fff",
                  }}
                />
              )}
              <div style={{ fontWeight: 900 }}>Waitlist Bot</div>
              {p.mode !== "inline" && (
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    marginLeft: "auto",
                    padding: "4px 10px",
                    fontWeight: 800,
                    border: "2px solid #000",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Messages */}
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
                overflow: "auto",
                background:
                  "linear-gradient(135deg, #ffffff 0%, #f6f7ff 100%)",
              }}
            >
              {messages.map((m, i) => {
                const style = msgStyle(m.role);

                const bubble = (
                  <div style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    display: "inline-flex",
                    position: "relative",
                  }}>
                    <div style={style as React.CSSProperties}>{m.text}</div>

                    {/* draw tails for speech styles */}
                    {(p.messageStyle === "speechClassic" || p.messageStyle === "speechOval") && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          bottom: -4,
                          ...(m.role === "user" ? { right: -6 } : { left: -6 }),
                          width: 0,
                          height: 0,
                          borderTop: "8px solid #000",
                          borderLeft: m.role === "user" ? undefined : "8px solid transparent",
                          borderRight: m.role === "user" ? "8px solid transparent" : undefined,
                        }}
                      />
                    )}
                  </div>
                );

                // avatar only on bot messages (optional)
                return (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    {m.role === "bot" && (
                      <img
                        src={p.avatarImage || ""}
                        onError={(e) => ((e.currentTarget.style.display = "none"))}
                        alt=""
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "2px solid #000",
                          background: "#fff",
                          objectFit: "cover",
                          display: p.avatarImage ? "block" : "none",
                        }}
                      />
                    )}
                    {bubble}
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div style={{ display: "flex", borderTop: "2px solid #000" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
              <button
                onClick={send}
                style={{
                  padding: "12px 18px",
                  fontWeight: 900,
                  borderLeft: "2px solid #000",
                  background: p.color,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
