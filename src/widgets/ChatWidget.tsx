// src/widgets/ChatWidget.tsx
import React, { useMemo, useState } from "react";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval" | "chat";
type Fit = "cover" | "contain";

export type ChatWidgetProps = {
  mode: Mode;
  botId: string;

  position?: Pos;
  size?: number;
  color?: string;
  image?: string;
  imageFit?: Fit;
  shape?: Shape;

  label?: string;
  labelColor?: string;
};

export default function ChatWidget({
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
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: `Hi! You’re chatting with ${toTitle(botId)}.` },
  ]);
  const [input, setInput] = useState("");

  const bubbleSidePos =
    position === "bottom-left"
      ? { left: 16 as const, right: "auto" as const }
      : { right: 16 as const, left: "auto" as const };

  // ---- bubble geometry
  const dims = useMemo(() => {
    if (shape === "oval") return { w: Math.round(size * 1.6), h: size };
    return { w: size, h: size };
  }, [size, shape]);

  const borderRadius = useMemo(() => {
    switch (shape) {
      case "circle":
        return "50%";
      case "rounded":
        return 18;
      case "square":
        return 0;
      case "oval":
        return dims.h / 2;
      case "chat":
        return 18; // classic chat bubble is rounded, not a full circle
      default:
        return "50%";
    }
  }, [shape, dims.h]);

  const background = image
    ? `${color} url(${image}) center/${imageFit} no-repeat`
    : color;

  // ---- actions
  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }, { role: "bot", text: "Thanks! We’ll be in touch shortly." }]);
    setInput("");
  };

  // ======================= RENDER ===========================================
  if (mode === "inline" || mode === "sidebar") {
    return (
      <ChatPanel
        variant={mode}
        color={color}
        botId={botId}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        onSend={send}
      />
    );
  }

  // Popup: bubble + anchored panel
  return (
    <>
      {!open && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            ...bubbleSidePos,
            width: dims.w,
            height: dims.h,
            zIndex: 999999,
          }}
        >
          {/* Bubble body */}
          <button
            aria-label="Open chat"
            onClick={() => setOpen(true)}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius,
              background,
              border: "2px solid #000",
              boxShadow: "4px 4px 0 #000",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {/* Label */}
            <span
              style={{
                color: labelColor,
                textShadow: "0 1px 0 rgba(0,0,0,0.35)",
                fontWeight: 900,
                fontSize: 14,
                lineHeight: 1,
                padding: "0 8px",
                userSelect: "none",
              }}
            >
              {label}
            </span>

            {/* Tail (only for chat shape) */}
            {shape === "chat" && (
              <>
                {/* Outer tail = black outline */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: -2, // sit on the outline
                    ...(position === "bottom-right" ? { right: 12 } : { left: 12 }),
                    width: 20,
                    height: 20,
                    clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)",
                    background: "#000",
                    transform:
                      position === "bottom-right" ? "rotate(135deg)" : "rotate(-135deg)",
                    boxShadow: "0 0 0 0 #000",
                  }}
                />
                {/* Inner tail = filled color, inset so you see the outline */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 0,
                    ...(position === "bottom-right" ? { right: 14 } : { left: 14 }),
                    width: 16,
                    height: 16,
                    clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)",
                    background: color,
                    transform:
                      position === "bottom-right" ? "rotate(135deg)" : "rotate(-135deg)",
                  }}
                />
              </>
            )}
          </button>
        </div>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: dims.h + 24,
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
            <div style={{ fontWeight: 900, color: "#000" }}>{toTitle(botId)}</div>
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

/** Inline/Sidebar shared chat panel */
function ChatPanel(props: {
  variant: "inline" | "sidebar";
  color: string;
  botId: string;
  messages: { role: "bot" | "user"; text: string }[];
  setMessages: React.Dispatch<React.SetStateAction<{ role: "bot" | "user"; text: string }[]>>;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}) {
  const { variant, color, botId, messages, input, setInput, onSend } = props;

  const style: React.CSSProperties =
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
    <div style={style}>
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
        <div style={{ fontWeight: 900, color: "#000" }}>{toTitle(botId)}</div>
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

function toTitle(id: string) {
  return id.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}
