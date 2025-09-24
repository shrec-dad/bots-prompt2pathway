// src/lib/AdminStore.tsx
import { create } from "zustand";

export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

export type Plan = "basic" | "custom";

export type KnowledgeDoc = {
  id: string;
  name: string;
  type: "PDF" | "Word" | "Excel";
  size: string;
  uploadedAt: string;
  // optional raw text content parsed later
  text?: string;
};

export type BrandingState = {
  logoDataUrl: string | null; // uploaded logo / chat bubble image
  bubbleColor: string; // chat bubble bg color
  bubbleSize: number; // px diameter for the launcher bubble (40–88)
  bubblePosition: "bottom-right" | "bottom-left";
  themeTone: "pastelDark"; // reserved for future theming
};

export type IntegrationState = {
  emailTo: string; // where basic plan leads go
  webhookUrl: string; // universal CRM webhook
  calendarUrl: string; // generic calendar url/api hint (no vendor lock)
};

export type AdminState = {
  // Core builder selections
  currentBot: BotKey;
  botPlan: Plan;
  includeNurture: boolean;

  // Branding + appearance
  branding: BrandingState;

  // Knowledge uploads (mock for now)
  knowledge: KnowledgeDoc[];

  // Integrations (placeholders)
  integrations: IntegrationState;

  // Actions
  setCurrentBot: (b: BotKey) => void;
  setPlan: (p: Plan) => void;
  toggleNurture: (v?: boolean) => void;

  setBranding: (updater: Partial<BrandingState>) => void;
  setIntegrations: (updater: Partial<IntegrationState>) => void;

  addKnowledgeDoc: (d: KnowledgeDoc) => void;
  removeKnowledgeDoc: (id: string) => void;

  // Persistence helpers (usually not needed from UI)
  _save: () => void;
};

const STORAGE_KEY = "mb.admin.state";

function loadInitial(): Omit<
  AdminState,
  | "setCurrentBot"
  | "setPlan"
  | "toggleNurture"
  | "setBranding"
  | "setIntegrations"
  | "addKnowledgeDoc"
  | "removeKnowledgeDoc"
  | "_save"
> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // light sanity defaults merge
      return {
        currentBot: parsed.currentBot ?? "LeadQualifier",
        botPlan: parsed.botPlan ?? "basic",
        includeNurture: parsed.includeNurture ?? false,
        branding: {
          logoDataUrl: parsed.branding?.logoDataUrl ?? null,
          bubbleColor: parsed.branding?.bubbleColor ?? "#6D28D9", // violet-700 default
          bubbleSize: parsed.branding?.bubbleSize ?? 56,
          bubblePosition: parsed.branding?.bubblePosition ?? "bottom-right",
          themeTone: "pastelDark",
        },
        knowledge: Array.isArray(parsed.knowledge) ? parsed.knowledge : [],
        integrations: {
          emailTo: parsed.integrations?.emailTo ?? "",
          webhookUrl: parsed.integrations?.webhookUrl ?? "",
          calendarUrl: parsed.integrations?.calendarUrl ?? "",
        },
      };
    }
  } catch {
    // ignore
  }
  // defaults on first load
  return {
    currentBot: "LeadQualifier",
    botPlan: "basic",
    includeNurture: false,
    branding: {
      logoDataUrl: null,
      bubbleColor: "#6D28D9", // violet-700
      bubbleSize: 56,
      bubblePosition: "bottom-right",
      themeTone: "pastelDark",
    },
    knowledge: [],
    integrations: {
      emailTo: "",
      webhookUrl: "",
      calendarUrl: "",
    },
  };
}

export const useAdminStore = create<AdminState>((set, get) => ({
  ...loadInitial(),

  setCurrentBot: (b) => {
    set({ currentBot: b });
    get()._save();
  },

  setPlan: (p) => {
    set({ botPlan: p });
    get()._save();
  },

  toggleNurture: (v) => {
    set(({ includeNurture }) => ({
      includeNurture: typeof v === "boolean" ? v : !includeNurture,
    }));
    get()._save();
  },

  setBranding: (updater) => {
    set((s) => ({ branding: { ...s.branding, ...updater } }));
    get()._save();
  },

  setIntegrations: (updater) => {
    set((s) => ({ integrations: { ...s.integrations, ...updater } }));
    get()._save();
  },

  addKnowledgeDoc: (d) => {
    set((s) => ({ knowledge: [d, ...s.knowledge] }));
    get()._save();
  },

  removeKnowledgeDoc: (id) => {
    set((s) => ({ knowledge: s.knowledge.filter((k) => k.id !== id) }));
    get()._save();
  },

  _save: () => {
    const s = get();
    const toPersist = {
      currentBot: s.currentBot,
      botPlan: s.botPlan,
      includeNurture: s.includeNurture,
      branding: s.branding,
      knowledge: s.knowledge,
      integrations: s.integrations,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch {
      // ignore write errors
    }
  },
}));
