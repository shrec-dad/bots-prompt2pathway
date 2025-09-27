// src/components/ModalChat.tsx
import React from "react";

type ModalChatProps = {
  open: boolean;
  onClose: () => void;
  accent?: string; // base color for buttons
  title?: string;  // header title
};

export default function ModalChat({
  open,
  onClose,
  accent = "#3ca58c",
  title = "Quick intake to match you with the right plan",
}: ModalChatProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(720px, 94%)",
          height: "min(78vh, 720px)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(0,0,0,0.8)",
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            background:
              "linear-gradient(90deg, #e9a6d1, #b099f3, #8fe3cf 90%)",
            color: "white",
            fontWeight: 800,
            padding: "12px 56px 12px 24px",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 16, letterSpacing: 0.2 }}>{title}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "rgba(255,255,255,0.25)",
              border: "2px solid #000",
              color: "#111",
              fontWeight: 900,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Body (glass) */}
        <div
          style={{
            flex: 1,
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 560,
              width: "100%",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 18 }}>👋</div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#11423d",
                marginBottom: 12,
              }}
            >
              Welcome to Our Client Intake Bot
            </h2>
            <p
              style={{
                color: "#3f7a72",
                fontSize: 18,
                lineHeight: 1.5,
                marginBottom: 28,
              }}
            >
              I will ask a few quick questions to help our team help you.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.05))",
            borderTop: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: "2px solid #000",
              background: "white",
              color: "#111",
              fontWeight: 800,
              borderRadius: 999,
              padding: "12px 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 6px 0 #000",
              transform: "translateY(-2px)",
            }}
          >
            <span style={{ fontSize: 18 }}>✕</span> Close
          </button>

          <button
            onClick={() => alert("Next screen… (sample)")}
            style={{
              background: accent,
              border: "2px solid #000",
              color: "white",
              fontWeight: 900,
              borderRadius: 12,
              padding: "14px 32px",
              boxShadow: "0 6px 0 #000",
              transform: "translateY(-2px)",
              minWidth: 140,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
