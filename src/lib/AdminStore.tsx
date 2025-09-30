// src/lib/AdminStore.tsx
import { create } from "zustand";
import { getBotSettings } from "@/lib/botSettings";

/**
 * NOTE:
 * - Keeps your existing admin UI state (currentBot/mode + catalog list).
 * - Adds "userBots" (duplicated instances) with localStorage persistence.
 * - Adds actions: duplicateBot, removeUserBot.
 *
 * STORAGE KEYS (existing remain untouched):
 *   admin.currentBot
 *   admin.mode
 *   botSettings:*              (per base bot)
 *   botOverrides:*             (per base bot + mode)  [read-only here]
 *
 * NEW:
 *   userBots                   (array of user-created instances)
 *   botSettingsInst:<id>       (per instance)         [reserved for later]
 *   botOverridesInst:<id>_<m>  (per instance+mode)    [copied now]
 */

export type BotId =
  | "lead-qualifier"
  | "appointment"
  | "customer-support"
  | "waitlist-bot"
  | "social-media";

export type Mode = "basic" | "custom";

// Base catalog for pickers (unchanged)
const CATALOG: { id: BotId; name: string }[] = [
  { id: "lead-qualifier", name: "Lead Qualifier" },
  { id: "appointment", name: "Appointment Booking" },
  { id: "customer-support", name: "Customer Support" },
  { id: "waitlist-bot", name: "Waitlist" },
  { id: "social-media", name: "Social Media" },
];

// Map AdminStore BotId -> botSettings/templates BotKey (TitleCase)
export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

function toBotKey(id: BotId): BotKey {
  switch (id) {
    case "lead-qualifier":
      return "LeadQualifier";
    case "appointment":
      return "AppointmentBooking";
    case "customer-support":
      return "CustomerSupport";
    case "waitlist-bot":
      return "Waitlist";
    case "social-media":
      return "SocialMedia";
    default:
      return "Waitlist";
  }
}

const BOT_KEY = "admin.currentBot";
const MODE_KEY = "admin.mode";
const USER_BOTS_KEY = "userBots";

// Read initial current bot/mode
const initialBot = ((): BotId => {
  const v = (localStorage.getItem(BOT_KEY) || "").trim();
  return (["lead-qualifier", "appointment", "customer-support", "waitlist-bot", "social-media"] as BotId[]).includes(
    v as BotId
  )
    ? (v as BotId)
    : "waitlist-bot";
})();

const initialMode = ((): Mode => {
  const v = (localStorage.getItem(MODE_KEY) || "").trim() as Mode;
  return v === "custom" ? "custom" : "basic";
})();

// User bot instance type
export type UserBot = {
  id: string; // instance id
  name: string; // display name (e.g., "Lead Qualifier (Copy)")
  baseId: BotId; // relates back to the catalog item
  baseKey: BotKey; // TitleCase key for settings/templates
  mode: Mode; // mode at time of duplication
  createdAt: number;
};

// Helpers for instance persistence
function loadUserBots(): UserBot[] {
  try {
    const raw = localStorage.getItem(USER_BOTS_KEY);
    if (raw) return JSON.parse(raw) as UserBot[];
  } catch {}
  return [];
}

function saveUserBots(list: UserBot[]) {
  localStorage.setItem(USER_BOTS_KEY, JSON.stringify(list));
}

// Read base-bot overrides (from Builder’s convention): botOverrides:<BotKey>_<mode>
function readBaseOverrides(baseKey: BotKey, mode: Mode): Record<string, any> {
  const key = `botOverrides:${baseKey}_${mode}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

// Write instance overrides: botOverridesInst:<instanceId>_<mode>
function writeInstanceOverrides(instId: string, mode: Mode, ov: Record<string, any>) {
  const key = `botOverridesInst:${instId}_${mode}`;
  localStorage.setItem(key, JSON.stringify(ov || {}));
}

// (Reserved) Write instance settings: botSettingsInst:<instanceId>
function writeInstanceSettings(instId: string, payload: any) {
  const key = `botSettingsInst:${instId}`;
  localStorage.setItem(key, JSON.stringify(payload || {}));
}

type AdminState = {
  // global admin selections
  currentBot: BotId;
  mode: Mode;

  // catalog
  bots: { id: BotId; name: string }[];

  // user instances
  userBots: UserBot[];

  // actions
  setCurrentBot: (id: BotId) => void;
  setMode: (m: Mode) => void;

  duplicateBot: (source: BotId) => UserBot;
  removeUserBot: (id: string) => void;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  currentBot: initialBot,
  mode: initialMode,
  bots: CATALOG,
  userBots: loadUserBots(),

  setCurrentBot: (id) => {
    localStorage.setItem(BOT_KEY, id);
    set({ currentBot: id });
  },
  setMode: (m) => {
    localStorage.setItem(MODE_KEY, m);
    set({ mode: m });
  },

  // Create a user instance from a catalog bot.
  duplicateBot: (source: BotId) => {
    const baseKey = toBotKey(source);
    const baseMode = getBotSettings(baseKey).mode as Mode;

    const instId = `${baseKey}-${Date.now().toString(36)}`;
    const instName = `${CATALOG.find((b) => b.id === source)?.name || baseKey} (Copy)`;

    // copy overrides for this mode
    const baseOverrides = readBaseOverrides(baseKey, baseMode);
    writeInstanceOverrides(instId, baseMode, baseOverrides);

    // (optional) seed instance-specific settings
    writeInstanceSettings(instId, { baseKey, mode: baseMode });

    const next: UserBot = {
      id: instId,
      name: instName,
      baseId: source,
      baseKey,
      mode: baseMode,
      createdAt: Date.now(),
    };

    const list = [...get().userBots, next];
    saveUserBots(list);
    set({ userBots: list });

    return next;
  },

  // Remove a user instance
  removeUserBot: (id) => {
    const list = get().userBots.filter((b) => b.id !== id);
    saveUserBots(list);
    set({ userBots: list });

    try {
      localStorage.removeItem(`botSettingsInst:${id}`);
      localStorage.removeItem(`botOverridesInst:${id}_basic`);
      localStorage.removeItem(`botOverridesInst:${id}_custom`);
    } catch {}
  },
}));

