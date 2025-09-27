// src/widgets/ChatWidget.tsx
import React, { useMemo, useState } from "react";

type Mode = "popup" | "inline" | "sidebar";
type Position = "bottom-right" | "bottom-left";

type Props = {
  mode: Mode;
  botId: string;
  color?: string;
  size?: number; // bubble size for popup
  position?: Position;
  image?: string;

  /** Enable built-in mock panel & messages (used by Preview page). */
  preview?: boolean;

  /** Start open (useful for sidebar/inline in preview). */
  openDefault?: boolean;
};

type Msg = { from: "bot" | "me"; text: string };

export default function ChatWidget({
  mode,
  botId,
  color,
  size = 64,
  position = "bottom-right",
  image,
  preview = false,
  openDefault,
}: Props) {
  const [open, setOpen] = useState<boolean>(
    openDefault ?? (mode === "sidebar" || mode === "inline")
  );
  const [msgs, setMsgs] = useState<Msg[]>(
    preview
      ? [{ from: "bot", text: `Hi! You are chatting with “${botId}”.` }]
      : []
  );
  const [draft, setDraft] = useState("");

  // ---------- styles ----------
  const isLeft = position === "bottom-left";
  const bubbleStyle: React.CSSProperties = {
    position: mode === "inline" ? "relative" : "fixed",
    bottom: mode === "inline" ? undefined : 24,
    right: mode === "inline" ? undefined : isLeft ? undefined : 24,
    left: mode === "inline" ? undefined : isLeft ? 24 : undefined,
    width: size,
    height: size,
    border: "2px solid #000",
    borderRadius: "50%",
    background: color ?? "#7aa8ff",
    display: mode === "popup" ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 9999,
    boxShadow: "0 6px 0 #000",
  };

  const panelDims = useMemo(() => {
    if (mode === "sidebar") return { w: 360, h: "100vh" as const };
    if (mode === "inline") return { w: 360, h: 520 };
    return { w: 360, h: 520 }; // popup
  }, [mode]);

  const panelStyle: React.CSSProperties = {
    position: mode === "inline" ? "relative" : "fixed",
    ...(mode !== "inline" && { bottom: 24 }),
    ...(mode !== "inline" && (isLeft ? { left: 24 } : { right: 24 })),
    width: panelDims.w,
    height: panelDims.h,
    border: "2px solid #000",
    borderRadius: mode === "sidebar" ? 12 : 12,
    overflow: "hidden",
    background: "#fff",
    display: open ? "flex" : "none",
    flexDirection: "column",
    zIndex: 9999,
    boxShadow: "0 10px 0 #000",
  };

  // ---------- preview chat handlers ----------
  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    setMsgs((m) => [...m, { from: "me", text }]);
    setDraft("");

    // simple echo response for preview
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { from: "bot", text: `Got it: “${text}”. (Preview response)` },
      ]);
    }, 50);
  };

  // ---------- render ----------
  return (
    <>
      {/* Bubble (popup only) */}
      <div
        role="button"
        title={`Bot: ${botId}`}
        style={bubbleStyle}
        onClick={() => setOpen((v) => !v)}
      >
        {image ? (
          <img
            src={image}
            alt="chat bubble"
            style={{ width: "70%", height: "70%", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontWeight: 900, color: "#160f29" }}>Chat</span>
        )}
      </div>

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "2px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg,#e9d5ff 0%,#dbeafe 50%,#d1fae5 100%)",
          }}
        >
          <div style={{ fontWeight: 900 }}>Chat • {botId}</div>
          {mode === "popup" && (
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "2px solid #000",
                borderRadius: 8,
                background: "#fff",
                padding: "4px 10px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: 12,
            background:
              "linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 50%,#eff6ff 100%)",
            overflowY: "auto",
          }}
        >
          {preview ? (
            msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.from === "me" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "8px 10px",
                    border: "2px solid #000",
                    borderRadius: 12,
                    background: m.from === "me" ? "#fde68a" : "#fff",
                    boxShadow: "0 4px 0 #000",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontWeight: 600,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#6b7280", fontWeight: 600 }}>
              (Widget shell only — wire your real chat logic here.)
            </div>
          )}
        </div>

        {/* Input (preview only) */}
        {preview && (
          <form
            onSubmit={send}
            style={{
              borderTop: "2px solid #000",
              padding: 8,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
              background: "#fff",
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              style={{
                border: "2px solid #000",
                borderRadius: 10,
                padding: "10px 12px",
                fontWeight: 700,
              }}
            />
            <button
              type="submit"
              style={{
                border: "2px solid #000",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 900,
                background: "#a78bfa",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </form>
        )}
      </div>
    </>
  );
}
