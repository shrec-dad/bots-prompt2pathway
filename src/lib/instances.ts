// src/lib/instances.ts
// Lightweight “instances” persistence in localStorage.
// Each Instance = { meta, data } with an index for quick listing.

export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

export type Mode = "basic" | "custom";

export type InstanceMeta = {
  id: string;             // inst_*
  name: string;           // e.g. "Waitlist (Copy)" or "My Bot"
  bot: BotKey;
  mode: Mode;
  createdAt: number;
  updatedAt: number;
};

export type InstanceData = {
  // A place to store per-node text overrides, etc.
  overrides: Record<string, any>;
  // A place to store UI/settings you want to carry over
  settings: Record<string, any>;
  // Simple placeholder for uploaded knowledge docs
  knowledge: Array<any>;
};

const INDEX_KEY = "botInstances:index";
const DATA_KEY = (id: string) => `botInstances:data:${id}`;

// These keys mirror how your Builder / Settings already store data:
const OV_KEY = (bot: BotKey, mode: Mode) => `botOverrides:${bot}_${mode}`;
const BOT_SETTINGS_KEY = (bot: BotKey) => `botSettings:${bot}`;
const BOT_KNOWLEDGE_KEY = (bot: BotKey) => `botKnowledge:${bot}`;

/* ---------------- helpers ---------------- */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function newId() {
  return `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function botToLabel(bot: BotKey): string {
  switch (bot) {
    case "LeadQualifier":
      return "Lead Qualifier";
    case "AppointmentBooking":
      return "Appointment Booking";
    case "CustomerSupport":
      return "Customer Support";
    case "Waitlist":
      return "Waitlist";
    case "SocialMedia":
      return "Social Media";
    default:
      return bot;
  }
}

/* ---------------- public API ---------------- */

export function listInstances(): InstanceMeta[] {
  return readJSON<InstanceMeta[]>(INDEX_KEY, []);
}

/** Convenience: same as listInstances but newest updated first */
export function listInstancesSorted(): InstanceMeta[] {
  const list = listInstances();
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getInstance(id: string): { meta: InstanceMeta; data: InstanceData } | null {
  const meta = listInstances().find((m) => m.id === id);
  if (!meta) return null;
  const data = readJSON<InstanceData>(DATA_KEY(id), {
    overrides: {},
    settings: {},
    knowledge: [],
  });
  return { meta, data };
}

export function saveInstance(id: string, patch: Partial<InstanceData>) {
  const now = Date.now();
  const index = listInstances();
  const meta = index.find((m) => m.id === id);
  if (!meta) return;

  const current = readJSON<InstanceData>(DATA_KEY(id), {
    overrides: {},
    settings: {},
    knowledge: [],
  });

  writeJSON(DATA_KEY(id), {
    ...current,
    ...patch,
  });

  // bump updatedAt
  const updated: InstanceMeta[] = index.map((m) =>
    m.id === id ? { ...m, updatedAt: now } : m
  );
  writeJSON(INDEX_KEY, updated);
}

export function removeInstance(id: string) {
  const index = listInstances().filter((m) => m.id !== id);
  writeJSON(INDEX_KEY, index);
  localStorage.removeItem(DATA_KEY(id));
}

/**
 * Create a brand-new EMPTY instance.
 * Useful when you want a fresh canvas without copying overrides/settings.
 */
export function createInstance(
  bot: BotKey,
  mode: Mode,
  friendlyName?: string
): InstanceMeta {
  const id = newId();
  const now = Date.now();

  const meta: InstanceMeta = {
    id,
    name: friendlyName || `${botToLabel(bot)} (New)`,
    bot,
    mode,
    createdAt: now,
    updatedAt: now,
  };

  const data: InstanceData = {
    overrides: {},     // blank
    settings: { mode },// minimal seed
    knowledge: [],     // blank
  };

  writeJSON(DATA_KEY(id), data);

  const index = listInstances();
  index.push(meta);
  writeJSON(INDEX_KEY, index);

  return meta;
}

/**
 * Duplicate from current template context:
 * - carries over per-bot+mode overrides (botOverrides:Bot_Mode)
 * - carries over bot settings (botSettings:Bot)
 * - carries over any bot knowledge list (botKnowledge:Bot) if present
 */
export function duplicateInstanceFromTemplate(
  bot: BotKey,
  mode: Mode,
  friendlyName?: string
): InstanceMeta {
  const id = newId();
  const now = Date.now();

  // Pull existing per-bot+mode overrides/settings/knowledge (if any)
  const overrides = readJSON<Record<string, any>>(OV_KEY(bot, mode), {});
  const settings = readJSON<Record<string, any>>(BOT_SETTINGS_KEY(bot), { mode });
  const knowledge = readJSON<any[]>(BOT_KNOWLEDGE_KEY(bot), []);

  const meta: InstanceMeta = {
    id,
    name: friendlyName || `${botToLabel(bot)} (Copy)`,
    bot,
    mode,
    createdAt: now,
    updatedAt: now,
  };

  const data: InstanceData = { overrides, settings, knowledge };
  writeJSON(DATA_KEY(id), data);

  const index = listInstances();
  index.push(meta);
  writeJSON(INDEX_KEY, index);

  return meta;
}

/**
 * NEW: Duplicate from an EXISTING instance ID (clone its meta+data into a new instance).
 * Useful when you want to copy a working bot as-is for a new client.
 */
export function duplicateInstanceFromExisting(
  sourceId: string,
  friendlyName?: string
): InstanceMeta | null {
  const source = getInstance(sourceId);
  if (!source) return null;

  const id = newId();
  const now = Date.now();

  const meta: InstanceMeta = {
    id,
    name: friendlyName || `${source.meta.name} (Copy)`,
    bot: source.meta.bot,
    mode: source.meta.mode,
    createdAt: now,
    updatedAt: now,
  };

  // Deep-ish clone to avoid accidental shared references
  const data: InstanceData = JSON.parse(
    JSON.stringify({
      overrides: source.data.overrides || {},
      settings: source.data.settings || {},
      knowledge: source.data.knowledge || [],
    })
  );

  writeJSON(DATA_KEY(id), data);

  const index = listInstances();
  index.push(meta);
  writeJSON(INDEX_KEY, index);

  return meta;
}

/** Rename instance display name only */
export function renameInstance(id: string, newName: string) {
  const now = Date.now();
  const index = listInstances();
  const updated = index.map((m) =>
    m.id === id ? { ...m, name: newName || m.name, updatedAt: now } : m
  );
  writeJSON(INDEX_KEY, updated);
}

/** Change instance mode (updates meta.mode and data.settings.mode) */
export function setInstanceMode(id: string, mode: Mode) {
  const inst = getInstance(id);
  if (!inst) return;

  // update data
  const newData: InstanceData = {
    ...inst.data,
    settings: { ...(inst.data.settings || {}), mode },
  };
  writeJSON(DATA_KEY(id), newData);

  // update meta
  const now = Date.now();
  const index = listInstances().map((m) =>
    m.id === id ? { ...m, mode, updatedAt: now } : m
  );
  writeJSON(INDEX_KEY, index);
}

/** Change instance bot (meta only; use carefully) */
export function setInstanceBot(id: string, bot: BotKey) {
  const now = Date.now();
  const index = listInstances().map((m) =>
    m.id === id ? { ...m, bot, updatedAt: now } : m
  );
  writeJSON(INDEX_KEY, index);
}
