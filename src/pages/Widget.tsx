// src/pages/Widget.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

// Instance meta reader (created by /lib/instances + Builder)
type InstMeta = { baseKey?: string; mode?: "basic" | "custom"; name?: string } | null;
function readInstMeta(instId: string): InstMeta {
  try {
    const raw = localStorage.getItem(`botSettingsInst:${instId}`);
    if (raw) return JSON.parse(raw) as InstMeta;
  } catch {}
  return null;
}

export default function Widget() {
  const [sp] = useSearchParams();

  // URL overrides
  const qInst = sp.get("inst") || ""; // if present, we treat this as the active bot instance
  const qPos = (sp.get("position") as "bottom-right" | "bottom-left" | null) || null;
  const qColor = sp.get("color");
  const qSize = sp.get("size");
  const qImg = sp.get("image");

  // resolve instance and header label (safe: widget still works without it)
  const instMeta = qInst ? readInstMeta(qInst) : null;
  const headerTitle = (instMeta?.name && instMeta.name.trim()) || "Chat";

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

  // visual overrides: URL > branding default
  const bubblePosition = qPos || b.chatBubblePosition || "bottom-right";
  const bubbleColor = (qColor && qColor.trim()) || b.chatBubbleColor || "#7aa8ff";
  const bubbleSize = Math.max(40, Math.min(120, qSize ? Number(qSize) : b.chatBubbleSize || 64));
  const bubbleImage = (qImg && qImg.trim()) || b.chatBubbleImage || "";

  const posStyle =
    bubblePosition === "bottom-left"
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
            width: bubbleSize,
            height: bubbleSize,
            borderRadius: "50%",
            background: bubbleImage
              ? `url(${bubbleImage}) center/cover no-repeat, ${bubbleColor}`
              : bubbleColor,
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
            <div style={{ fontWeight: 900, color: "#000" }}>{headerTitle}</div>
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
                if (e.key === "Enter") {
                  const t = (e.target as HTMLInputElement)?.value || "";
                  if (t.trim()) {
                    setMessages((m) => [
                      ...m,
                      { role: "user", text: t.trim() },
                      { role: "bot", text: "Thanks! I’ll get back to you shortly." },
                    ]);
                    setInput("");
                  }
                }
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
              onClick={() => {
                const t = input.trim();
                if (!t) return;
                setMessages((m) => [
                  ...m,
                  { role: "user", text: t },
                  { role: "bot", text: "Thanks! I’ll get back to you shortly." },
                ]);
                setInput("");
              }}
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
