// src/lib/botSettings.ts
// Widened BotKey so built-in + custom template keys both work.

export type BotKey = string; // e.g., "Waitlist", "LeadQualifier", or any custom key

export type BotSettings = {
  mode: "basic" | "custom";
};

const KEY = (bot: BotKey) => `botSettings:${bot}`;

export function getBotSettings(bot: BotKey): BotSettings {
  try {
    const raw = localStorage.getItem(KEY(bot));
    if (raw) return JSON.parse(raw) as BotSettings;
  } catch {}
  return { mode: "basic" };
}

export function setBotSettings(bot: BotKey, next: Partial<BotSettings>): BotSettings {
  const prev = getBotSettings(bot);
  const merged = { ...prev, ...next };
  localStorage.setItem(KEY(bot), JSON.stringify(merged));
  return merged;
}
