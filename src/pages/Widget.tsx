// src/pages/Widget.tsx
import React from "react";
import ChatWidget from "@/widgets/ChatWidget";

/**
 * This route is the public/embed view.
 * It reads URL params and forwards them to ChatWidget so customers
 * can fully control look & behavior from an <iframe src="/widget?...">.
 */
export default function Widget() {
  const params = new URLSearchParams(window.location.search);

  // Instance overrides botId if present
  const botId = params.get("inst") || params.get("bot") || "waitlist-bot";

  // Placement & size
  const mode = (params.get("mode") as "popup" | "inline" | "sidebar") || "popup";
  const position = (params.get("position") as "bottom-right" | "bottom-left") || "bottom-right";
  const size = Number(params.get("size") || 64);

  // Colors / media
  const color = params.get("color") || "#7aa8ff";
  const image = params.get("image") || undefined;

  // Bubble + label options
  const shape =
    (params.get("shape") as "circle" | "rounded" | "square" | "oval" | "chat") || "circle";
  const imageFit = (params.get("imageFit") as "cover" | "contain" | "fill") || "cover";
  const labelText = params.get("label") || "Chat";
  const labelColor = params.get("labelColor") || "#ffffff";

  // Message style + avatar
  const messageStyle =
    (params.get("messageStyle") as
      | "roundedCard"
      | "speechClassic"
      | "speechOval"
      | "pill"
      | "glass"
      | "outlined") || "roundedCard";
  const avatarImage = params.get("avatar") || undefined;

  // Transparent page—widget renders over any host site nicely
  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>
      <ChatWidget
        botId={botId}
        mode={mode}
        position={position}
        size={size}
        color={color}
        image={image}
        shape={shape}
        imageFit={imageFit}
        labelText={labelText}
        labelColor={labelColor}
        messageStyle={messageStyle}
        avatarImage={avatarImage}
      />
    </div>
  );
}
