// src/hooks/useTemplateCatalog.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { listTemplateDefs, type TemplateDef } from "@/lib/templates";

/**
 * useTemplateCatalog
 * ------------------
 * Tiny hook that returns the current catalog of templates (built-ins + custom, minus hidden),
 * and automatically refreshes when localStorage changes in this or other tabs.
 *
 * Usage:
 *   const { templates, refresh } = useTemplateCatalog({ sortBy: "name" });
 */
type SortBy = "none" | "name" | "key";

type Options = {
  /** Optional sort. Default: "name" */
  sortBy?: SortBy;
  /** Optional custom comparator (overrides sortBy if provided) */
  compareFn?: (a: TemplateDef, b: TemplateDef) => number;
};

function sortTemplates(list: TemplateDef[], sortBy: SortBy, compareFn?: Options["compareFn"]) {
  if (compareFn) return [...list].sort(compareFn);
  if (sortBy === "none") return list;
  if (sortBy === "key") return [...list].sort((a, b) => a.key.localeCompare(b.key));
  // default: by name (case-insensitive)
  return [...list].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

export function useTemplateCatalog(opts: Options = {}) {
  const { sortBy = "name", compareFn } = opts;

  const read = useCallback(() => {
    try {
      return listTemplateDefs();
    } catch {
      return [] as TemplateDef[];
    }
  }, []);

  const [templates, setTemplates] = useState<TemplateDef[]>(() => read());

  const refresh = useCallback(() => {
    setTemplates(read());
  }, [read]);

  // Auto-refresh when the template index or hidden list changes (even in other tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const k = e.key || "";
      if (
        k === "botTemplates:index" ||
        k === "botTemplates:hiddenKeys" ||
        k.startsWith("botTemplates:data:")
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  // Provide a sorted view (stable memo)
  const sorted = useMemo(() => sortTemplates(templates, sortBy, compareFn), [templates, sortBy, compareFn]);

  return {
    /** Hidden-aware, merged catalog (built-ins + custom). */
    templates: sorted,
    /** Force re-read from storage. */
    refresh,
    /** Unsorted raw list if you need original order. */
    raw: templates,
  };
}

export default useTemplateCatalog;
