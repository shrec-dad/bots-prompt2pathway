// src/lib/botSettings.ts
export type BotKey =
  | "LeadQualifier"
  | "AppointmentBooking"
  | "CustomerSupport"
  | "Waitlist"
  | "SocialMedia";

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
