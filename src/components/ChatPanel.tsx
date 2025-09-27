import React, { useEffect, useRef } from "react";

type Mode = "popup" | "sidebar" | "modal";

export type ChatMessage = { from: "bot" | "user"; text: string };

interface ChatPanelProps {
  title?: string;
  mode?: Mode;
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  headerGradient?: string; // e.g. "bg-gradient-to-r from-pink-200 to-green-200"
}

export default function ChatPanel({
  title = "Client Intake Bot",
  mode = "popup",
  open,
  onClose,
  messages,
  onSend,
  headerGradient = "bg-gradient-to-r from-pink-200 to-green-200",
}: ChatPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Outside click (popup & modal only)
  useEffect(() => {
    if (!open) return;
    if (mode === "sidebar") return;
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, mode, onClose]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Panel containers by mode
  const baseContainer =
    "z-50 border-2 border-black shadow-xl rounded-2xl overflow-hidden bg-white";
  const popupPos =
    "fixed bottom-24 right-6 w-[380px] max-w-[92vw] animate-[fadeIn_0.18s_ease-out]";
  const sidebarPos =
    "fixed top-0 right-0 h-full w-full sm:w-[420px] animate-[slideIn_0.2s_ease-out]";
  const modalBackdrop =
    "fixed inset-0 z-40 bg-black/35 animate-[fadeIn_0.18s_ease-out]";
  const modalPos =
    "fixed inset-0 z-50 flex items-center justify-center p-4";

  if (!open) return null;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value) return;
    onSend(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  const PanelCard = (
    <div
      ref={wrapperRef}
      role={mode === "modal" || mode === "sidebar" ? "dialog" : "region"}
      aria-modal={mode !== "popup"}
      className={`${baseContainer} ${
        mode === "popup" ? "w-full" : "w-full h-full sm:h-[85vh] sm:max-h-[720px] sm:max-w-[780px]"
      }`}
      style={{ boxShadow: "0 12px 28px rgba(0,0,0,0.18)" }}
    >
      {/* Header */}
      <div
        className={`${headerGradient} px-4 py-3 border-b-2 border-black flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-black bg-white" />
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="px-2 py-1 border-2 border-black rounded-lg bg-white hover:translate-y-[1px] transition"
        >
          ✕
        </button>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="p-3 sm:p-4 space-y-2 overflow-y-auto" style={{ height: "calc(100% - 124px)" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-2 border-2 border-black rounded-2xl ${
              m.from === "bot"
                ? "bg-white text-gray-800"
                : "bg-purple-100 text-gray-900 ml-auto"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="px-3 sm:px-4 py-3 border-t-2 border-black flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your message…"
          className="flex-1 px-3 py-2 border-2 border-black rounded-xl focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 border-2 border-black rounded-xl bg-white hover:translate-y-[1px] transition"
          aria-label="Send"
        >
          ⮞
        </button>
      </form>
    </div>
  );

  if (mode === "sidebar") {
    return (
      <div className="fixed inset-0 z-50">
        <div className={modalBackdrop} onClick={onClose} />
        <div className={sidebarPos}>{PanelCard}</div>
      </div>
    );
  }

  if (mode === "modal") {
    return (
      <>
        <div className={modalBackdrop} />
        <div className={modalPos}>{PanelCard}</div>
      </>
    );
  }

  // popup
  return <div className={popupPos}>{PanelCard}</div>;
}

/* Animations (Tailwind keyframes) – add to your global CSS if not present:
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
*/
