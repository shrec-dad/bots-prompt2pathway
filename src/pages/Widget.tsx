// src/pages/Widget.tsx
import React, { useMemo } from "react";
import ChatWidget from "@/widgets/ChatWidget";

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

function readQP(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export default function Widget() {
  const qp = useMemo(readQP, []);
  const bot = qp.inst ? undefined : (qp.bot || "waitlist-bot");

  // Defaults + coercion
  const mode: Mode = (qp.mode as Mode) || "popup";
  const position: Pos = (qp.position as Pos) || "bottom-right";
  const size = Math.max(40, Math.min(200, Number(qp.size || 64))) || 64;

  const shape: Shape = (qp.shape as Shape) || "circle";
  const color = qp.color || "#7aa8ff";
  const image = qp.image || "";
  const imageFit: Fit = (qp.imageFit as Fit) || "cover";
  const label = qp.label ?? "Chat";
  const labelColor = qp.labelColor || "#ffffff";

  const messageStyle: MsgStyle =
    (qp.messageStyle as MsgStyle) || "outlined-black";
  const botAvatarUrl = qp.botAvatar || "";

  const zIndex = 2147483000;

  // Important: /widget should show something immediately even in inline/sidebar
  const autoOpen = mode !== "popup";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffeef8 0%, #f3e7fc 25%, #e7f0ff 50%, #e7fcf7 75%, #fff9e7 100%)",
      }}
    >
      <ChatWidget
        mode={mode}
        botId={bot}
        position={position}
        size={size}
        shape={shape}
        color={color}
        image={image || undefined}
        imageFit={imageFit}
        label={label}
        labelColor={labelColor}
        messageStyle={messageStyle}
        botAvatarUrl={botAvatarUrl || undefined}
        zIndex={zIndex}
      />

      {/* Auto-open hint: for popup mode we rely on the user click; inline/sidebar render immediately via ChatWidget */}
      {autoOpen ? null : null}
    </div>
  );
}
