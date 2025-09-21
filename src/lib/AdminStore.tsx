import { create } from "zustand";

export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

type BotPlan = "basic" | "custom";

type AdminState = {
  currentBot: BotKey;
  botPlan: BotPlan;
  includeNurture: boolean;

  setCurrentBot: (b: BotKey) => void;
  setBotPlan: (p: BotPlan) => void;
  setIncludeNurture: (v: boolean) => void;
};

// localStorage helpers
const LS_KEY = "mb.admin.state";
const readLS = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const writeLS = (data: any) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
};

const initial = (() => {
  const saved = readLS();
  return {
    currentBot: (saved?.currentBot ?? "LeadQualifier") as BotKey,
    botPlan: (saved?.botPlan ?? "basic") as BotPlan,
    includeNurture: !!saved?.includeNurture,
  };
})();

export const useAdminStore = create<AdminState>((set, get) => ({
  ...initial,

  setCurrentBot: (b) => {
    set({ currentBot: b });
    writeLS({ ...get(), currentBot: b });
  },

  setBotPlan: (p) => {
    set({ botPlan: p });
    writeLS({ ...get(), botPlan: p });
  },

  setIncludeNurture: (v) => {
    set({ includeNurture: v });
    writeLS({ ...get(), includeNurture: v });
  },
}));

 

   
