// src/lib/instances.ts
// Minimal "instances" layer persisted in localStorage.
// Lets you clone what you have locally (like nurture schedules) into a named instance
// and get back an instanceId to use in the Embed page (?inst=...).

import { getJSON, setJSON } from "./storage";

// Keys
const LIST_KEY = "botInstances:list";           // string[] of ids
const ITEM_KEY = (id: string) => `botInstance:${id}`;

// Types that match how you'll use Instance IDs in Embed/Widget
export type InstanceSummary = {
  id: string;
  name: string;
  createdAt: string;
  botId: string;            // e.g. "waitlist-bot"
  mode: "basic" | "custom";
};

export type NurtureStep = {
  enabled: boolean;
  subject: string;
  message: string;
};

export type InstancePayload = InstanceSummary & {
  nurture?: NurtureStep[];  // copied from Nurture page
  // room to grow later: overrides, knowledge, theme, etc.
};

// Utilities
export function listInstanceIds(): string[] {
  return getJSON<string[]>(LIST_KEY, []);
}

export function listInstances(): InstanceSummary[] {
  const ids = listInstanceIds();
  return ids
    .map((id) => getJSON<InstancePayload>(ITEM_KEY(id), null as any))
    .filter(Boolean)
    .map(({ id, name, createdAt, botId, mode }) => ({
      id,
      name,
      createdAt,
      botId,
      mode,
    }));
}

export function getInstance(id: string): InstancePayload | null {
  return getJSON<InstancePayload>(ITEM_KEY(id), null as any);
}

// Core: create a new instance with supplied payload chunks
export function createInstance(input: {
  name: string;
  botId: string;                  // "waitlist-bot", "lead-qualifier", etc.
  mode: "basic" | "custom";
  nurture?: NurtureStep[];
}): InstancePayload {
  const id = `inst_${Date.now()}`;
  const createdAt = new Date().toISOString();

  const payload: InstancePayload = {
    id,
    name: input.name || "My Bot",
    createdAt,
    botId: input.botId,
    mode: input.mode,
    nurture: input.nurture || [],
  };

  // persist
  const ids = listInstanceIds();
  setJSON(LIST_KEY, [...ids, id]);
  setJSON(ITEM_KEY(id), payload);

  return payload;
}
