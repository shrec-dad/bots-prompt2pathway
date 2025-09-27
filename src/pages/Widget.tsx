// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";

// Reuse your existing branding storage key/shape
type Branding = {
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  chatBubbleImage?: string;
  chatBubbleColor: string;
  chatBubbleSize: number;   // px
  chatBubblePosition: "bottom-right" | "bottom-left";
};

const BRAND_KEY = "brandingSettings";

function getBranding(): Branding {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // defaults aligned with your Branding page defaults
  return {
    primaryColor: "#7aa8ff",
    secondaryColor: "#76c19a",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    chatBubbleColor: "#7aa8ff",
    chatBubbleSize: 64,
    chatBubblePosition: "bottom-right",
  };
}

export default function Widget() {
  const [open, setOpen] = useState(false);
  const b = useMemo(getBranding, []);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  // Apply typography from branding
  useEffect(() => {
    document.body.style.fontFamily = b.fontFamily;
  }, [b.fontFamily]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: "Thanks! I’ll get back to you shortly." }]);
    setInput("");
  };

  const posStyle =
    b.chatBubblePosition === "bottom-left"
      ? { left: 16, right: "auto" as const }
      : { right: 16, left: "auto" as const };

  return (
    <div
      style={{
        // Full-bleed safe background for iframe
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: b.chatBubbleSize,
            height: b.chatBubbleSize,
            borderRadius: "50%",
            background: b.chatBubbleImage
              ? `url(${b.chatBubbleImage}) center/cover no-repeat, ${b.chatBubbleColor}`
              : b.chatBubbleColor,
            border: "2px solid #000",
            boxShadow: "4px 4px 0 #000",
          }}
        />
      )}

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            ...posStyle,
            width: 360,
            height: 520,
            borderRadius: 16,
            border: "2px solid #000",
            boxShadow: "8px 8px 0 #000",
            background: "#fff",
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
              gap: 12,
              padding: "12px 14px",
              background: b.primaryColor,
              borderBottom: "2px solid #000",
            }}
          >
            {b.logoDataUrl ? (
              <img
                src={b.logoDataUrl}
                alt="Logo"
                style={{ width: 28, height: 28, objectFit: "contain", background: "#fff", borderRadius: 6 }}
              />
            ) : (
              <div style={{ width: 28, height: 28, background: "#fff", borderRadius: 6, border: "1px solid #000" }} />
            )}
            <div style={{ fontWeight: 900, color: "#000" }}>Chat</div>
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
            />
            <button
              onClick={send}
              style={{
                padding: "10px 14px",
                fontWeight: 800,
                borderLeft: "2px solid #000",
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
