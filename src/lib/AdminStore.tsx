import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/** -------------------------
 * Types
 * ------------------------- */
export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

export type BotPlan = "basic" | "custom";

type AdminState = {
  /** which bot the admin is currently editing */
  currentBot: BotKey;
  setCurrentBot: (key: BotKey | string) => void;

  /** basic vs custom for the current bot */
  botPlan: BotPlan;
  setBotPlan: (plan: BotPlan | string) => void;

  /** upsell toggle for follow-up / nurture (only used by LeadQualifier, Waitlist) */
  includeNurture: boolean;
  setIncludeNurture: (on: boolean) => void;
};

const AdminStoreCtx = createContext<AdminState | null>(null);

/** -------------------------
 * Local storage helpers
 * ------------------------- */
const LS_KEY = "lv.admin.store.v1";

function loadFromLS(): Partial<AdminState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLS(data: Partial<AdminState>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** -------------------------
 * Provider
 * ------------------------- */
export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const boot = loadFromLS();

  const [currentBot, setCurrentBotState] = useState<BotKey>(
    (boot?.currentBot as BotKey) || "LeadQualifier"
  );
  const [botPlan, setBotPlanState] = useState<BotPlan>(
    (boot?.botPlan as BotPlan) || "basic"
  );
  const [includeNurture, setIncludeNurtureState] = useState<boolean>(
    boot?.includeNurture ?? false
  );

  // Wrap setters to keep LS in sync
  const setCurrentBot = (key: BotKey | string) => {
    const val = (key as string) as BotKey;
    setCurrentBotState(val);
    saveToLS({ currentBot: val, botPlan, includeNurture });
  };

  const setBotPlan = (plan: BotPlan | string) => {
    const val = (plan as string) as BotPlan;
    setBotPlanState(val);
    saveToLS({ currentBot, botPlan: val, includeNurture });
  };

  const setIncludeNurture = (on: boolean) => {
    setIncludeNurtureState(on);
    saveToLS({ currentBot, botPlan, includeNurture: on });
  };

  // Persist on first mount too (covers the case with defaults)
  useEffect(() => {
    saveToLS({ currentBot, botPlan, includeNurture });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AdminState>(
    () => ({
      currentBot,
      setCurrentBot,
      botPlan,
      setBotPlan,
      includeNurture,
      setIncludeNurture,
    }),
    [currentBot, botPlan, includeNurture]
  );

  return <AdminStoreCtx.Provider value={value}>{children}</AdminStoreCtx.Provider>;
}

/** -------------------------
 * Hook
 * ------------------------- */
export function useAdminStore() {
  const ctx = useContext(AdminStoreCtx);
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return ctx;
}


