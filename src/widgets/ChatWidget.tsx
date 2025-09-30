// src/widgets/ChatWidget.tsx
import React, { useMemo, useState } from "react";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval" | "chat";
type Fit = "cover" | "contain";

export type ChatWidgetProps = {
  mode: Mode;
  botId: string;

  // popup options
  position?: Pos;
  size?: number;              // bubble size (px); for oval we widen automatically
  color?: string;             // bubble color (fallback when no image)
  image?: string;             // optional bubble image
  imageFit?: Fit;             // "cover" | "contain"
  shape?: Shape;              // "circle" | "rounded" | "square" | "oval" | "chat"

  // label options (new)
  label?: string;             // default "Chat"
  labelColor?: string;        // default "#fff"
};

export default function ChatWidget(props: ChatWidgetProps) {
  const {
    mode,
    botId,
    position = "bottom-right",
    size = 64,
    color = "#7aa8ff",
    image,
    imageFit = "cover",
    shape = "circle",
    label = "Chat",
    labelColor = "#ffffff",
  } = props;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: `Hi! You’re chatting with ${botId.replace(/-/g, " ")}.` },
  ]);
  const [input, setInput] = useState("");

  const bubbleSidePos = position === "bottom-left"
    ? { left: 16 as const, right: "auto" as const }
    : { right: 16 as const, left: "auto" as const };

  // ==== bubble geometry & visuals ===========================================
  // for "oval" we widen the bubble; everything else is square at `size`
  const bubbleDims = useMemo(() => {
    if (shape === "oval") return { w: Math.round(size * 1.5), h: size };
    return { w: size, h: size };
  }, [size, shape]);

  const borderRadius = useMemo(() => {
    switch (shape) {
      case "circle":  return "50%";
      case "rounded": return 16;
      case "square":  return 0;
      case "oval":    return bubbleDims.h / 2; // pill/oval
      case "chat":    return "50%";            // circular base; tail added below
      default:        return "50%";
    }
  }, [shape, bubbleDims.h]);

  const bubbleBackground = image
    ? `${color} url(${image}) center/${imageFit} no-repeat`
    : color;

  // Send helper
  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "bot", text: "Thanks! We’ll be in touch shortly." },
    ]);
    setInput("");
  };

  // ==== RENDER ===============================================================
  if (mode === "inline") {
    // Inline mode: show the full chat panel wherever placed
    return (
      <ChatPanel
        color={color}
        botId={botId}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        onSend={send}
        variant="inline"
      />
    );
  }

  if (mode === "sidebar") {
    // Sidebar: right-side drawer (for now always visible in preview context)
    return (
      <ChatPanel
        color={color}
        botId={botId}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        onSend={send}
        variant="sidebar"
      />
    );
  }

  // Popup: bubble + anchored panel
  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 16,
            ...bubbleSidePos,
            width: bubbleDims.w,
            height: bubbleDims.h,
            borderRadius,
            background: bubbleBackground,
            border: "2px solid #000",
            boxShadow: "4px 4px 0 #000",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          {/* optional tail for "chat" shape */}
          {shape === "chat" && (
            <span
              aria-hidden
              style={{
                content: "''",
                position: "absolute",
                bottom: -2,
                // Tail goes toward the side opposite our border positioning so it points inward.
                [position === "bottom-right" ? "right" : "left"]: bubbleDims.w / 4,
                width: 14,
                height: 14,
                background: color,
                border: "2px solid #000",
                transform: "rotate(45deg)",
                boxShadow: "2px 2px 0 #000",
              } as React.CSSProperties}
            />
          )}
          {/* Label always visible (sits on top of image if provided) */}
          <span
            style={{
              color: labelColor,
              textShadow: "0 1px 0 rgba(0,0,0,0.35)",
              fontSize: 14,
              lineHeight: 1,
              padding: "0 6px",
              userSelect: "none",
            }}
          >
            {label}
          </span>
        </button>
      )}

      {/* Chat window when open */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: bubbleDims.h + 24, // lift panel above bubble
            ...bubbleSidePos,
            width: 360,
            height: 520,
            borderRadius: 16,
            border: "2px solid #000",
            boxShadow: "8px 8px 0 #000",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999999,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: color,
              borderBottom: "2px solid #000",
            }}
          >
            <div style={{ fontWeight: 900, color: "#000" }}>
              {botId.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                padding: "4px 8px",
                fontWeight: 700,
                border: "2px solid #000",
                borderRadius: 8,
                background: "#fff",
                cursor: "pointer",
              }}
              aria-label="Close chat"
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
                  background: m.role === "user" ? "#e2f7f0" : "#f1f5f9",
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
              onKeyDown={(e) => e.key === "Enter" && send()}
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
                background: color,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Internal panel used by inline & sidebar modes */
function ChatPanel(props: {
  color: string;
  botId: string;
  variant: "inline" | "sidebar";
  messages: { role: "bot" | "user"; text: string }[];
  setMessages: React.Dispatch<React.SetStateAction<{ role: "bot" | "user"; text: string }[]>>;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}) {
  const { color, botId, variant, messages, setMessages, input, setInput, onSend } = props;

  const containerStyle: React.CSSProperties =
    variant === "sidebar"
      ? {
          position: "fixed",
          top: 0,
          right: 0,
          width: 360,
          height: "100vh",
          borderLeft: "2px solid #000",
          background: "#fff",
          boxShadow: "-8px 0 0 #000",
          display: "flex",
          flexDirection: "column",
          zIndex: 999998,
        }
      : {
          width: "100%",
          maxWidth: 420,
          height: 520,
          borderRadius: 16,
          border: "2px solid #000",
          background: "#fff",
          boxShadow: "8px 8px 0 #000",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        };

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: color,
          borderBottom: "2px solid #000",
        }}
      >
        <div style={{ fontWeight: 900, color: "#000" }}>
          {botId.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
        </div>
      </div>

      <div style={{ padding: 12, gap: 8, display: "flex", flexDirection: "column", flex: 1, overflow: "auto" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#e2f7f0" : "#f1f5f9",
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

      <div style={{ display: "flex", borderTop: "2px solid #000" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "10px 12px",
            fontWeight: 600,
            outline: "none",
          }}
        />
        <button
          onClick={onSend}
          style={{
            padding: "10px 14px",
            fontWeight: 800,
            borderLeft: "2px solid #000",
            background: color,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
