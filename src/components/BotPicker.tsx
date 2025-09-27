// src/components/BotPicker.tsx
import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

export default function BotPicker({ className = "" }: { className?: string }) {
  const { bots, currentBot, setCurrentBot } = useAdminStore();

  return (
    <select
      className={`rounded-lg border-2 border-black px-3 py-2 bg-white ${className}`}
      value={currentBot}
      onChange={(e) => setCurrentBot(e.target.value as any)}
      aria-label="Select bot"
    >
      {bots.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
