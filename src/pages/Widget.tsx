// src/pages/Widget.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Types for query param options */
type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "oval" | "square";
type Fit = "cover" | "contain";
type MsgStyle =
  | "outlined-black"
  | "accent-yellow"
  | "modern-soft"
  | "pill"
  | "rounded-rect"
  | "minimal-outline";

/** Read query params once */
function readQP(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

/** Safe number parser with clamp */
function clampNum(val: any, min: number, max: number, fallback: number) {
  const n = Number(val);
  if (Number.isFinite(n)) return Math.max(min, Math.min(max, n));
  return fallback;
}

export default function Widget() {
  const qp = useMemo(readQP, []);
  const [open, setOpen] = useState<boolean>(false);

  // Core identity (either instance or bot)
  const instId = qp.inst?.trim();
  const botId = instId ? undefined : (qp.bot || "waitlist-bot");

  // Presentation / behavior
  const mode: Mode = (qp.mode as Mode) || "popup";
  const position: Pos = (qp.position as Pos) || "bottom-right";

  // Bubble geometry
  // "size" is the bubble height for all shapes; for "oval" we compute width ~1.55x
  const size = clampNum(qp.size, 40, 200, 64);
  const shape: Shape = (qp.shape as Shape) || "circle";
  const color = qp.color || "#7aa8ff";
  const label = qp.label ?? "Chat";
  const labelColor = qp.labelColor || "#ffffff";
  const image = qp.image || "";          // bubble image
  const imageFit: Fit = (qp.imageFit as Fit) || "cover";

  // Panel aesthetics
  const messageStyle: MsgStyle =
    (qp.messageStyle as MsgStyle) || "outlined-black";
  const botAvatarUrl = qp.botAvatar || "";

  const zIndex = clampNum(qp.zIndex, 1, 2147483647, 2147483000);

  // Auto-open for inline/sidebar so the user sees something immediately
  useEffect(() => {
    if (mode === "inline" || mode === "sidebar") {
      setOpen(true);
    }
  }, [mode]);

  /** ===== Bubble sizing & border radius for each shape ===== */
  const bubbleDims = useMemo(() => {
    if (shape === "oval") {
      // pill: width wider than height; keep clickable but elegant
      const w = Math.round(size * 1.55);
      const h = Math.round(size * 0.9);
      return { w, h, radius: h / 2 }; // full pill
    }
    if (shape === "circle") return { w: size, h: size, radius: size / 2 };
    if (shape === "rounded") return { w: size, h: size, radius: 16 };
    // square
    return { w: size, h: size, radius: 8 };
  }, [shape, size]);

  /** ===== Positioning style for popup bubble/panel ===== */
  const posStyle: React.CSSProperties =
    position === "bottom-left"
      ? { left: 16, right: "auto" }
      : { right: 16, left: "auto" };

  /** ===== Message bubble class generator (basic variants) ===== */
  function msgStyleClass(role: "bot" | "user") {
    switch (messageStyle) {
      case "accent-yellow":
        return role === "bot"
          ? "bg-yellow-200 border-2 border-black"
          : "bg-white border-2 border-black";
      case "modern-soft":
        return role === "bot"
          ? "bg-[#F8FAFC] border border-black/20"
          : "bg-[#EEF2FF] border border-black/20";
      case "pill":
        return role === "bot"
          ? "bg-white border-2 border-black rounded-full"
          : "bg-[#E9D5FF] border-2 border-black rounded-full";
      case "rounded-rect":
        return role === "bot"
          ? "bg-white border-2 border-black rounded-xl"
          : "bg-[#E2F7F2] border-2 border-black rounded-xl";
      case "minimal-outline":
        return role === "bot"
          ? "bg-white border border-black/40"
          : "bg-white border border-black/40";
      case "outlined-black":
      default:
        return role === "user"
          ? "bg-[#C7F9CC] border-2 border-black rounded-xl"
          : "bg-white border-2 border-black rounded-xl";
    }
  }

  /** ===== Simple demo conversation (placeholder) ===== */
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "bot", text: "Thanks! We’ll be in touch." },
    ]);
    setInput("");
  }

  /** ====== Panel container sizes ====== */
  const panelW = mode === "sidebar" ? 380 : 360;
  const panelH = mode === "sidebar" ? "100vh" : 520;

  /** ====== Sidebar position (fixed right) ====== */
  const sidebarStyle: React.CSSProperties =
    mode === "sidebar"
      ? {
          position: "fixed",
          top: 0,
          right: 0,
          width: panelW,
          height: panelH as any,
          zIndex,
        }
      : {};

  /** ====== Inline container ====== */
  const inlineWrapStyle: React.CSSProperties =
    mode === "inline"
      ? {
          width: "100%",
          maxWidth: 480,
          margin: "24px auto",
        }
      : {};

  /** ====== Bubble content (image + label overlay) ====== */
  const BubbleInner = () => {
    const hasLabel = (label || "").trim().length > 0;

    return (
      <div
        style={{
          width: bubbleDims.w,
          height: bubbleDims.h,
          borderRadius: bubbleDims.radius,
          position: "relative",
          background: image ? "transparent" : color,
          overflow: "hidden",
          border: "2px solid #000",
          boxShadow: "4px 4px 0 #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: shape === "oval" ? "0 12px" : 0,
        }}
      >
        {image ? (
          <img
            src={image}
            alt="Chat bubble"
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageFit,
              display: "block",
            }}
          />
        ) : null}

        {hasLabel && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: labelColor,
              fontWeight: 900,
              fontSize: Math.max(11, Math.round(bubbleDims.h * 0.32)),
              textShadow: "0 1px 0 rgba(0,0,0,0.2)",
              paddingInline: 8,
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  };

  /** ====== Chat panel (shared for popup/inline/sidebar) ====== */
  const Panel = () => {
    return (
      <div
        style={{
          width: panelW,
          height: mode === "sidebar" ? (panelH as any) : panelH,
          borderRadius: mode === "sidebar" ? 0 : 16,
          border: "2px solid #000",
          boxShadow: "8px 8px 0 #000",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        role={mode === "sidebar" ? "dialog" : undefined}
        aria-modal={mode === "sidebar" ? true : undefined}
      >
        {/* Header (pastel gradient) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background:
              "linear-gradient(90deg, #a78bfa, #60a5fa, #14b8a6)",
            color: "#000",
            borderBottom: "2px solid #000",
          }}
        >
          {botAvatarUrl ? (
            <img
              src={botAvatarUrl}
              alt="Bot avatar"
              style={{
                width: 28,
                height: 28,
                objectFit: "cover",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #000",
              }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#fff",
                border: "1px solid #000",
              }}
            />
          )}
          <div style={{ fontWeight: 900 }}>Chat</div>
          {mode === "popup" && (
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
              aria-label="Close chat"
            >
              ×
            </button>
          )}
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
            background:
              "linear-gradient(135deg, #f8fafc 0%, #f3e8ff 35%, #ecfeff 100%)",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={msgStyleClass(m.role)}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                padding: "10px 12px",
                maxWidth: "80%",
                color: "#000",
              }}
            >
              {m.text}
            </div>
          ))}
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
            }}
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  /** ====== Render by mode ====== */
  const containerBg =
    "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)";

  return (
    <div style={{ minHeight: "100vh", background: containerBg }}>
      {/* POPUP MODE */}
      {mode === "popup" && (
        <>
          {/* Bubble */}
          {!open && (
            <button
              onClick={() => setOpen(true)}
              aria-label="Open chat"
              style={{
                position: "fixed",
                bottom: 16,
                ...posStyle,
                zIndex,
                // Remove default button style bleed
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <BubbleInner />
            </button>
          )}

          {/* Panel */}
          {open && (
            <div
              style={{
                position: "fixed",
                bottom: 16 + bubbleDims.h + 12, // lift panel above bubble
                ...posStyle,
                zIndex,
              }}
            >
              <Panel />
            </div>
          )}
        </>
      )}

      {/* INLINE MODE */}
      {mode === "inline" && (
        <div style={{ ...inlineWrapStyle, zIndex, position: "relative" }}>
          <Panel />
        </div>
      )}

      {/* SIDEBAR MODE */}
      {mode === "sidebar" && (
        <div style={sidebarStyle}>
          <Panel />
        </div>
      )}
    </div>
  );
}
