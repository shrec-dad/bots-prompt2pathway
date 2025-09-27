// src/lib/AdminStore.ts
import { create } from "zustand";

export type BotId =
  | "lead-qualifier"
  | "appointment"
  | "customer-support"
  | "waitlist-bot"
  | "social-media";

type Mode = "basic" | "custom";

type AdminState = {
  // which bot is selected across the admin UI
  currentBot: BotId;
  mode: Mode;

  // available bots to show in pickers
  bots: { id: BotId; name: string }[];

  setCurrentBot: (id: BotId) => void;
  setMode: (m: Mode) => void;
};

const BOT_KEY = "admin.currentBot";
const MODE_KEY = "admin.mode";

const initialBot = ((): BotId => {
  const v = (localStorage.getItem(BOT_KEY) || "").trim();
  return ([
    "lead-qualifier",
    "appointment",
    "customer-support",
    "waitlist-bot",
    "social-media",
  ] as BotId[]).includes(v as BotId)
    ? (v as BotId)
    : "waitlist-bot";
})();

const initialMode = ((): Mode => {
  const v = (localStorage.getItem(MODE_KEY) || "").trim() as Mode;
  return v === "custom" ? "custom" : "basic";
})();

export const useAdminStore = create<AdminState>((set) => ({
  currentBot: initialBot,
  mode: initialMode,
  bots: [
    { id: "lead-qualifier", name: "Lead Qualifier" },
    { id: "appointment", name: "Appointment Booking" },
    { id: "customer-support", name: "Customer Support" },
    { id: "waitlist-bot", name: "Waitlist" },
    { id: "social-media", name: "Social Media" },
  ],
  setCurrentBot: (id) => {
    localStorage.setItem(BOT_KEY, id);
    set({ currentBot: id });
  },
  setMode: (m) => {
    localStorage.setItem(MODE_KEY, m);
    set({ mode: m });
  },
}));
