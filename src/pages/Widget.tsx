// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";

// Reuse your existing branding storage key/shape, now with bubble shape added
type BubbleShape = "circle" | "rounded" | "square" | "oval";

type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;

  // Bubble customization
  chatBubbleImage?: string; // URL/DataURL of logo/selfie (optional)
  chatBubbleColor: string;
  chatBubbleSize: number;   // height in px
  chatBubblePosition: "bottom-right" | "bottom-left";
  chatBubbleShape?: BubbleShape; // NEW
};

const BRAND_KEY = "brandingSettings";

function getBranding(): Branding {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // defaults aligned with your prior Branding page
  return {
    primaryColor: "#7aa8ff",
    secondaryColor: "#76c19a",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    chatBubbleColor: "#7aa8ff",
    chatBubbleSize: 64,
    chatBubblePosition: "bottom-right",
    chatBubbleShape: "circle",
  };
}

export default function Widget() {
  const [open, setOpen] = useState(false);
  const b = useMemo(getBranding, []);

  // Messages
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "I will ask a few quick questions to help our team help you." },
  ]);
  const [input, setInput] = useState("");

  // Apply typography from branding
  useEffect(() => {
    document.body.style.fontFamily = b.fontFamily;
  }, [b.fontFamily]);

  // Send handler (stub)
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

  // Bubble position
  const posStyle =
    b.chatBubblePosition === "bottom-left"
      ? { left: 16, right: "auto" as const }
      : { right: 16, left: "auto" as const };

  // Bubble dimensions + shape rules
  const height = Math.max(48, Math.min(120, b.chatBubbleSize || 64));
  const width =
    (b.chatBubbleShape || "circle") === "oval" ? Math.round(height * 1.6) : height;

  const borderRadius =
    (b.chatBubbleShape || "circle") === "square"
      ? "0px"
      : (b.chatBubbleShape || "circle") === "rounded"
      ? "16px"
      : "50%"; // circle or visually oval

  // Panel visual style to match your screenshot (clean, rounded, bold outline)
  const panelWidth = 420;
  const panelHeight = 560;

  return (
    <div
      style={{
        // Full-bleed safe background for iframe
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* Floating Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width,
            height,
            borderRadius,
            background: b.chatBubbleImage
              ? `url(${b.chatBubbleImage}) center/cover no-repeat, ${b.chatBubbleColor}`
              : b.chatBubbleColor,
            border: "2px solid #000",
            boxShadow: "6px 6px 0 #000",
            cursor: "pointer",
            overflow: "hidden",
          }}
          title="Open chat"
        />
      )}

      {/* Chat Panel (Popup) */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: panelWidth,
            height: panelHeight,
            maxWidth: "92vw",
            borderRadius: 16,
            border: "2px solid #000",
            boxShadow: "10px 10px 0 #000",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            // subtle fade/scale on open
            animation: "widgetFadeIn 180ms ease-out",
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Header (pastel gradient bar, bold, close) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background:
                "linear-gradient(135deg, rgba(255,192,203,0.45), rgba(118,193,154,0.45))",
              borderBottom: "2px solid #000",
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
            <div style={{ fontWeight: 900, color: "#000" }}>
              Welcome to Our Client Intake Bot
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                fontWeight: 800,
                border: "2px solid #000",
                borderRadius: 10,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* Body (welcome text like your screenshot + Next button) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              borderBottom: "2px solid #000",
              minHeight: 180,
            }}
          >
            <div style={{ fontSize: 36, lineHeight: 1 }}>👋</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#264640" }}>
              Welcome to Our Client Intake Bot
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#5b7a73",
                textAlign: "center",
                maxWidth: 460,
              }}
            >
              I will ask a few quick questions to help our team help you.
            </div>
            <button
              onClick={() =>
                setMessages((m) => [
                  ...m,
                  {
                    role: "bot",
                    text: "Great—what’s your email so we can follow up?",
                  },
                ])
              }
              style={{
                marginTop: 6,
                padding: "10px 16px",
                fontWeight: 800,
                borderRadius: 14,
                border: "2px solid #000",
                background: b.secondaryColor,
                color: "#000",
                cursor: "pointer",
                boxShadow: "4px 4px 0 #000",
              }}
            >
              Next
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
              aria-label="Type your message"
            />
            <button
              onClick={send}
              style={{
                padding: "10px 14px",
                fontWeight: 800,
                borderLeft: "2px solid #000",
                background: b.primaryColor,
                cursor: "pointer",
              }}
              aria-label="Send"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* tiny keyframes for fade-in */}
      <style>{`
        @keyframes widgetFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
