// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Public embed widget. Reads query params and renders:
 *  - floating chat bubble (popup) OR right sidebar (sidebar mode)
 *  - customizable bubble (shape, image, label, labelColor, imageFit)
 *  - simple conversation panel with optional header avatar
 */

type Pos = "bottom-right" | "bottom-left";
type Shape = "circle" | "rounded" | "square" | "oval";
type Fit = "cover" | "contain" | "fill" | "center" | "none";
type Mode = "popup" | "sidebar" | "inline";

type QueryConfig = {
  inst?: string;
  bot?: string;

  mode: Mode;
  position: Pos;
  size: number;

  color?: string;
  image?: string;
  imageFit?: Fit;
  label?: string;
  labelColor?: string;
  shape: Shape;
  avatar?: string;
};

function parseQuery(): QueryConfig {
  const q = new URLSearchParams(window.location.search);
  const asNumber = (s: string | null, fallback: number) =>
    s && !Number.isNaN(Number(s)) ? Number(s) : fallback;

  const cfg: QueryConfig = {
    inst: q.get("inst") || undefined,
    bot: q.get("bot") || undefined,

    mode: (q.get("mode") as Mode) || "popup",
    position: ((q.get("position") as Pos) || "bottom-right"),
    size: asNumber(q.get("size"), 64),

    color: q.get("color") || undefined,
    image: q.get("image") || undefined,
    imageFit: ((q.get("imageFit") as Fit) || "cover"),
    label: q.get("label") ?? "Chat",
    labelColor: q.get("labelColor") ?? "#ffffff",
    shape: (q.get("shape") as Shape) || "circle",
    avatar: q.get("avatar") || undefined,
  };

  if (cfg.size < 40) cfg.size = 40;
  if (cfg.size > 160 && cfg.mode !== "sidebar") cfg.size = 160;
  return cfg;
}

function borderRadiusForShape(shape: Shape): string {
  switch (shape) {
    case "circle":
      return "50%";
    case "rounded":
      return "16px";
    case "square":
      return "8px";
    case "oval":
      return "9999px"; // capsule
    default:
      return "50%";
  }
}

export default function Widget() {
  const cfg = useMemo(parseQuery, []);
  const [open, setOpen] = useState(false);

  // responsive viewport height inside the iframe (prevents clipping)
  const [vh, setVh] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // panel height: keep a 16px margin top & bottom (32 total), cap at 540
  const panelHeight = Math.max(360, Math.min(540, vh - 32));

  // demo messages (until wired)
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    document.body.style.fontFamily = "Inter, system-ui, Arial, sans-serif";
    document.body.style.background =
      "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)";
    document.body.style.minHeight = "100vh";
  }, []);

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

  const posStyle: React.CSSProperties =
    cfg.position === "bottom-left"
      ? { left: 16, right: "auto" }
      : { right: 16, left: "auto" };

  // Make oval visibly wider than tall
  const bubbleWidth = cfg.shape === "oval" ? Math.round(cfg.size * 1.6) : cfg.size;
  const bubbleHeight = cfg.size;

  const backgroundForImage: React.CSSProperties =
    cfg.image
      ? {
          backgroundImage: `url("${cfg.image}")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition:
            cfg.imageFit === "center" ? "center" : cfg.imageFit === "none" ? "left top" : "center",
          backgroundSize:
            cfg.imageFit === "cover"
              ? "cover"
              : cfg.imageFit === "contain"
              ? "contain"
              : cfg.imageFit === "fill"
              ? "100% 100%"
              : cfg.imageFit === "center"
              ? "auto"
              : "auto",
        }
      : {};

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: cfg.color || "#7aa8ff",
    borderBottom: "2px solid #000",
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* POPUP MODE */}
      {cfg.mode !== "sidebar" && (
        <>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              aria-label="Open chat"
              style={{
                position: "fixed",
                bottom: 16,
                ...posStyle,
                width: bubbleWidth,
                height: bubbleHeight,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: borderRadiusForShape(cfg.shape),
                background: cfg.image ? (cfg.color || "#7aa8ff") : (cfg.color || "#7aa8ff"),
                border: "2px solid #000",
                boxShadow: "4px 4px 0 #000",
                padding: "0 12px",
                overflow: "hidden",
                zIndex: 2147483000,
                ...backgroundForImage,
              }}
            >
              <span
                style={{
                  color: cfg.labelColor || "#fff",
                  fontWeight: 900,
                  textShadow: "0 1px 0 rgba(0,0,0,0.15)",
                  background: cfg.image ? "rgba(0,0,0,0.18)" : "transparent",
                  padding: cfg.image ? "2px 6px" : 0,
                  borderRadius: cfg.image ? "8px" : 0,
                  maxWidth: "85%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {cfg.label ?? "Chat"}
              </span>
            </button>
          )}

          {open && (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: "fixed",
                bottom: 16,
                ...posStyle,
                width: 380,
                height: panelHeight,                 // <- responsive height
                maxHeight: "calc(100vh - 32px)",     // <- never clip
                borderRadius: 16,
                border: "2px solid #000",
                boxShadow: "8px 8px 0 #000",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 2147483000,
              }}
            >
              <div style={headerStyle}>
                {cfg.avatar ? (
                  <img
                    src={cfg.avatar}
                    alt="Avatar"
                    style={{
                      width: 28,
                      height: 28,
                      objectFit: "cover",
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
                <div style={{ fontWeight: 900, color: "#000" }}>
                  {(cfg.inst || cfg.bot || "Bot").toString().replace(/-/g, " ")}
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
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  padding: 12,
                  gap: 8,
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  overflow: "auto",
                }}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      background: m.role === "user" ? "#e9d5ff" : "#f1f5f9",
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="Type a message…"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontWeight: 600,
                    outline: "none",
                    border: 0,
                  }}
                />
                <button
                  onClick={send}
                  style={{
                    padding: "10px 14px",
                    fontWeight: 800,
                    borderLeft: "2px solid #000",
                    background: cfg.color || "#7aa8ff",
                    cursor: "pointer",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* SIDEBAR MODE */}
      {cfg.mode === "sidebar" && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 380,
            borderLeft: "2px solid #000",
            boxShadow: "-8px 0 0 #000",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 2147483000,
          }}
        >
          <div style={headerStyle}>
            {cfg.avatar ? (
              <img
                src={cfg.avatar}
                alt="Avatar"
                style={{
                  width: 28,
                  height: 28,
                  objectFit: "cover",
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
            <div style={{ fontWeight: 900, color: "#000" }}>
              {(cfg.inst || cfg.bot || "Bot").toString().replace(/-/g, " ")}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              gap: 8,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "auto",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "#e9d5ff" : "#f1f5f9",
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
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                padding: "10px 12px",
                fontWeight: 600,
                outline: "none",
                border: 0,
              }}
            />
            <button
              onClick={send}
              style={{
                padding: "10px 14px",
                fontWeight: 800,
                borderLeft: "2px solid #000",
                background: cfg.color || "#7aa8ff",
                cursor: "pointer",
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
