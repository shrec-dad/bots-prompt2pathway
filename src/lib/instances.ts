// src/lib/instances.ts
// LocalStorage CRUD for user-created bot instances.
// Works with Builder's instance format:
//   - botSettingsInst:<id>  => { baseKey: BotKey, mode: "basic" | "custom", name?: string }
//   - botOverridesInst:<id>_<mode> => { [nodeId]: { data: ... } }
//   - botInstances:index => string[]  // list of instance ids we show under "My Bots"

import type { BotKey } from "@/lib/botSettings";

export type InstMode = "basic" | "custom";

export type BotInstance = {
  id: string;
  name: string;
  baseKey: BotKey;
  mode: InstMode;
  createdAt: number;
};

const INDEX_KEY = "botInstances:index";

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

function writeIndex(ids: string[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function listInstances(): BotInstance[] {
  const ids = readIndex();
  const out: BotInstance[] = [];
  for (const id of ids) {
    try {
      const raw = localStorage.getItem(`botSettingsInst:${id}`);
      if (!raw) continue;
      const meta = JSON.parse(raw) as Partial<BotInstance>;
      out.push({
        id,
        name: meta.name || "Untitled Bot",
        baseKey: meta.baseKey as BotKey,
        mode: (meta.mode as InstMode) || "custom",
        createdAt: (meta.createdAt as number) || 0,
      });
    } catch {}
  }
  // newest first
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

export function createInstance(params: {
  name: string;
  baseKey: BotKey;
  mode: InstMode;
}): BotInstance {
  const id = `inst_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const inst: BotInstance = {
    id,
    name: params.name || "Untitled Bot",
    baseKey: params.baseKey,
    mode: params.mode,
    createdAt: Date.now(),
  };

  // meta
  localStorage.setItem(
    `botSettingsInst:${id}`,
    JSON.stringify({
      baseKey: inst.baseKey,
      mode: inst.mode,
      name: inst.name,
      createdAt: inst.createdAt,
    })
  );

  // add to index
  const ids = readIndex();
  ids.unshift(id);
  writeIndex(ids);

  return inst;
}

export function duplicateInstanceFromTemplate(opts: {
  baseKey: BotKey;
  mode: InstMode;
  name?: string;
}): BotInstance {
  return createInstance({
    baseKey: opts.baseKey,
    mode: opts.mode,
    name: opts.name || "New Bot",
  });
}

export function removeInstance(id: string) {
  // remove meta
  localStorage.removeItem(`botSettingsInst:${id}`);
  // remove overrides for both modes, if present
  localStorage.removeItem(`botOverridesInst:${id}_basic`);
  localStorage.removeItem(`botOverridesInst:${id}_custom`);
  // remove from index
  const ids = readIndex().filter((x) => x !== id);
  writeIndex(ids);
}
