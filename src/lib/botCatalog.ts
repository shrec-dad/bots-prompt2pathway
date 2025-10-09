// src/lib/botCatalog.ts
import { listTemplateDefs, type TemplateDef } from "@/lib/templates";
import {
  listInstances,
  type InstanceMeta,
  listInstancesSorted,
} from "@/lib/instances";

/** Public types */
export type CatalogTemplate = {
  kind: "template";
  key: string; // template key, e.g., "Receptionist" or custom
  name: string;
  emoji?: string;
  gradient?: string;
  description?: string;
};

export type CatalogInstance = {
  kind: "instance";
  id: string; // inst_*
  name: string;
  bot: string; // base template key
  mode: "basic" | "custom";
  createdAt: number;
  updatedAt: number;
};

export type Catalog =
  | { templates: CatalogTemplate[]; instances: CatalogInstance[] }
  | { templates: CatalogTemplate[]; instances: CatalogInstance[] };

/** Read templates from templates.ts (minus hidden) */
export function getTemplates(): CatalogTemplate[] {
  const defs = listTemplateDefs();
  return defs.map((d: TemplateDef) => ({
    kind: "template" as const,
    key: d.key,
    name: d.name,
    emoji: d.emoji,
    gradient: d.gradient,
    description: d.description,
  }));
}

/** Read instances from instances.ts (sorted newest first) */
export function getInstances(): CatalogInstance[] {
  const list = listInstancesSorted();
  return list.map((m: InstanceMeta) => ({
    kind: "instance" as const,
    id: m.id,
    name: String(m.name || `${m.bot} Instance`),
    bot: m.bot,
    mode: m.mode,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}

/** Get both, with instances sorted desc by updatedAt */
export function getCatalog(): Catalog {
  return {
    templates: getTemplates(),
    instances: getInstances(),
  };
}

/**
 * Subscribe to relevant localStorage changes and invoke callback.
 * Returns an unsubscribe function.
 */
export function subscribeCatalog(listener: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (!e.key) return;

    // Template-related keys
    if (
      e.key === "botTemplates:index" ||
      e.key === "botTemplates:hiddenKeys" ||
      e.key.startsWith("botTemplates:data:")
    ) {
      listener();
      return;
    }

    // Instance-related keys
    if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
      listener();
      return;
    }
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
