// src/components/BotSelector.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getCatalog,
  subscribeCatalog,
  type CatalogTemplate,
  type CatalogInstance,
} from "@/lib/botCatalog";

type Scope = "template" | "instance" | "both";

export type BotSelectorValue =
  | { kind: "template"; key: string }
  | { kind: "instance"; id: string }
  | null;

type Props = {
  scope: Scope;
  /** For template scope: pass template key; for instance: pass instance id; for both: pass template key or instance id */
  value?: string;
  onChange: (next: BotSelectorValue) => void;
  className?: string;
  disabled?: boolean;
  placeholderTemplate?: string; // default: "Select a bot template"
  placeholderInstance?: string; // default: "Select a client bot"
  allowEmpty?: boolean; // if true, shows a "— None —" option
  emptyLabel?: string; // label for empty option
  ariaLabel?: string;
};

export default function BotSelector({
  scope,
  value,
  onChange,
  className,
  disabled,
  placeholderTemplate = "Select a bot template",
  placeholderInstance = "Select a client bot",
  allowEmpty = false,
  emptyLabel = "— None —",
  ariaLabel,
}: Props) {
  const [templates, setTemplates] = useState<CatalogTemplate[]>([]);
  const [instances, setInstances] = useState<CatalogInstance[]>([]);

  useEffect(() => {
    const refresh = () => {
      const cat = getCatalog();
      setTemplates(cat.templates);
      setInstances(cat.instances);
    };
    refresh();
    return subscribeCatalog(refresh);
  }, []);

  const hasTemplates = templates.length > 0;
  const hasInstances = instances.length > 0;

  const resolvedValue = useMemo(() => value || "", [value]);

  function emit(raw: string) {
    if (!raw) {
      onChange(null);
      return;
    }
    if (raw.startsWith("inst_")) {
      onChange({ kind: "instance", id: raw });
    } else {
      onChange({ kind: "template", key: raw });
    }
  }

  // Render cases
  if (scope === "template") {
    return (
      <select
        className={className || "w-full rounded-lg border px-3 py-2 font-semibold bg-white"}
        value={resolvedValue}
        onChange={(e) => emit(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel || "Select bot template"}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {!hasTemplates && <option value="">No templates found</option>}
        {hasTemplates && <option value="" disabled>{placeholderTemplate}</option>}
        {templates.map((t) => (
          <option key={t.key} value={t.key}>
            {t.name} ({t.key})
          </option>
        ))}
      </select>
    );
  }

  if (scope === "instance") {
    return (
      <select
        className={className || "w-full rounded-lg border px-3 py-2 font-semibold bg-white"}
        value={resolvedValue}
        onChange={(e) => emit(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel || "Select client bot instance"}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {!hasInstances && <option value="">No instances yet</option>}
        {hasInstances && <option value="" disabled>{placeholderInstance}</option>}
        {instances.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} • {m.mode}
          </option>
        ))}
      </select>
    );
  }

  // both
  return (
    <select
      className={className || "w-full rounded-lg border px-3 py-2 font-semibold bg-white"}
      value={resolvedValue}
      onChange={(e) => emit(e.target.value)}
      disabled={disabled}
      aria-label={ariaLabel || "Select bot or instance"}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}

      <optgroup label="Base Bot Templates">
        {!hasTemplates && <option value="">No templates found</option>}
        {templates.map((t) => (
          <option key={t.key} value={t.key}>
            {t.name} ({t.key})
          </option>
        ))}
      </optgroup>

      <optgroup label="Client Bots (instances)">
        {!hasInstances && <option value="">No client bots yet</option>}
        {instances.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} • {m.mode}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
