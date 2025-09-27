import React, { useMemo, useState } from "react";
import ChatPanel, { ChatMessage } from "../components/ChatPanel";

type Mode = "popup" | "sidebar" | "modal";
type BubbleShape = "circle" | "rounded" | "square" | "oval";

export interface BrandConfig {
  color?: string;        // bubble bg
  imageUrl?: string;     // optional logo/selfie for the bubble
}

interface ChatWidgetProps {
  botId?: string;
  mode?: Mode;
  position?: "right" | "left";
  bubbleSize?: number; // px
  bubbleShape?: BubbleShape;
  brand?: BrandConfig;
  title?: string; // panel title
}

export default function ChatWidget({
  botId = "waitlist",
  mode = "popup",
  position = "right",
  bubbleSize = 64,
  bubbleShape = "circle",
  brand = { color: "#4aa39a", imageUrl: undefined },
  title = "Client Intake Bot",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);

  // Minimal local flow stub (replace later with real data)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text:
        botId === "lead-qualifier"
          ? "Welcome! What are you looking for today?"
          : "Hi! I’ll ask a few quick questions to match you with the right plan.",
    },
  ]);

  // Simple scoring skeleton for lead-qualifier (replace later with real logic)
  const scoreRef = React.useRef(0);

  const onSend = (text: string) => {
    setMessages((m) => [...m, { from: "user", text }]);

    // naive branch
    if (botId === "lead-qualifier") {
      if (/budget|price/i.test(text)) scoreRef.current += 1;
      if (/timeline|urgent/i.test(text)) scoreRef.current += 1;
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text:
            scoreRef.current >= 2
              ? "Got it. You seem like a high-priority lead. We’ll follow up shortly."
              : "Thanks! We’ll review and reach out soon.",
        },
      ]);
    } else {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Thanks! We’ll be in touch." },
      ]);
    }
  };

  const size = Math.max(48, Math.min(96, bubbleSize));
  const bubbleBase =
    "fixed bottom-6 border-2 border-black shadow-lg hover:translate-y-[1px] transition cursor-pointer overflow-hidden";
  const bubblePos = position === "left" ? "left-6" : "right-6";

  const bubbleRadius = useMemo(() => {
    switch (bubbleShape) {
      case "square":
        return "rounded-none";
      case "rounded":
        return "rounded-2xl";
      case "oval":
        // wide + high → use extra rounding
        return "rounded-full"; // visually oval due to width/height difference
      default:
        return "rounded-full"; // circle
    }
  }, [bubbleShape]);

  const bubbleStyle: React.CSSProperties = {
    width: bubbleShape === "oval" ? size * 1.5 : size,
    height: size,
    background: brand?.color || "#4aa39a",
  };

  return (
    <>
      {/* Bubble */}
      <button
        aria-label="Open chat"
        className={`${bubbleBase} ${bubblePos} ${bubbleRadius}`}
        style={bubbleStyle}
        onClick={() => setOpen((o) => !o)}
      >
        {brand?.imageUrl ? (
          <img
            src={brand.imageUrl}
            alt="Chat bubble"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl">
            👋
          </div>
        )}
      </button>

      {/* Panel */}
      <ChatPanel
        title={title}
        mode={mode}
        open={open}
        onClose={() => setOpen(false)}
        messages={messages}
        onSend={onSend}
      />
    </>
  );
}
