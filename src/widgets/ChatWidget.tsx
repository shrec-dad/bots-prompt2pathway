// src/widgets/ChatWidget.tsx
import React from "react";

type Props = {
  mode: "popup" | "inline" | "sidebar";
  botId: string;
  color?: string;
  size?: number;
  position?: "bottom-right" | "bottom-left";
  image?: string;

  // NEW: allow consumers to react to clicks (e.g., open modal)
  onClick?: () => void;
};

export default function ChatWidget(props: Props) {
  const size = props.size ?? 64;

  const style: React.CSSProperties = {
    position: props.mode === "inline" ? "relative" : "fixed",
    bottom: props.mode === "inline" ? undefined : 24,
    right:
      props.mode === "inline"
        ? undefined
        : props.position === "bottom-right"
        ? 24
        : undefined,
    left:
      props.mode === "inline"
        ? undefined
        : props.position === "bottom-left"
        ? 24
        : undefined,
    width: props.mode === "sidebar" ? 360 : size,
    height: props.mode === "sidebar" ? "100vh" : size,
    border: "2px solid #000",
    borderRadius: props.mode === "sidebar" ? 0 : "50%",
    background: props.color ?? "#7aa8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: props.onClick ? "pointer" : "default",
    zIndex: 9999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    userSelect: "none",
  };

  return (
    <div
      style={style}
      title={`Bot: ${props.botId}`}
      onClick={props.onClick}
      role={props.onClick ? "button" : undefined}
      aria-label="Open chat"
    >
      {props.image ? (
        <img
          src={props.image}
          alt="chat bubble"
          style={{ width: "70%", height: "70%", objectFit: "contain" }}
          draggable={false}
        />
      ) : (
        <span style={{ fontWeight: 900, color: "white" }}>Chat</span>
      )}
    </div>
  );
}
