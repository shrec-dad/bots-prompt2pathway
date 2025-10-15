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

  /**
   * Primary change handler (kept for backward-compat). Emits an OBJECT:
   *  - { kind: "template", key } or { kind: "instance", id } or null
   *
   * NOTE: We also added `onChangeString` below if you prefer a raw string id/key.
   */
  onChange: (next: BotSelectorValue) => void;

  /** Optional secondary handler that emits a raw string (template key OR instance id), or null. */
  onChangeString?: (next: string | null) => void;

  className?: string;
  disabled?: boolean;

  /** Template-only label shown as the disabled first option (fallback if `placeholderOption` not provided) */
  placeholderTemplate?: string; // default: "Select a bot template"

  /** Instance-only label shown as the disabled first option (fallback if `placeholderOption` not provided) */
  placeholderInstance?: string; // default: "Select a client bot"

  /** Unified placeholder label (applies automatically per-scope if provided) */
  placeholderOption?: string;

  /** If true, shows a top-level empty option */
  allowEmpty?: boolean; // default: false

  /** Label for the empty option */
  emptyLabel?: string; // default: "— None —"

  /** In "both" scope, control whether templates/instances are grouped under optgroups. */
  showGroups?: boolean; // default: true

  ariaLabel?: string;
};

export default function BotSelector({
  scope,
  value,
  onChange,
  onChangeString,
  className,
  disabled,
  placeholderTemplate = "Select a bot template",
  placeholderInstance = "Select a client bot",
  placeholderOption, // unified
  allowEmpty = false,
  emptyLabel = "— None —",
  showGroups = true,
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
    // Emit both the object shape (primary) and string (optional) for maximum compatibility.
    if (!raw) {
      onChange(null);
      onChangeString?.(null);
      return;
    }
    if (raw.startsWith("inst_")) {
      const obj: BotSelectorValue = { kind: "instance", id: raw };
      onChange(obj);
      onChangeString?.(raw);
    } else {
      const obj: BotSelectorValue = { kind: "template", key: raw };
      onChange(obj);
      onChangeString?.(raw);
    }
  }

  const baseCls =
    className || "w-full rounded-lg border px-3 py-2 font-semibold bg-white";

  // ----- TEMPLATE SCOPE -----
  if (scope === "template") {
    const placeholder = placeholderOption || placeholderTemplate;
    return (
      <select
        className={baseCls}
        value={resolvedValue}
        onChange={(e) => emit(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel || "Select bot template"}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {!hasTemplates && <option value="">No templates found</option>}
        {hasTemplates && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {templates.map((t) => (
          <option key={t.key} value={t.key}>
            {t.name} ({t.key})
          </option>
        ))}
      </select>
    );
  }

  // ----- INSTANCE SCOPE -----
  if (scope === "instance") {
    const placeholder = placeholderOption || placeholderInstance;
    return (
      <select
        className={baseCls}
        value={resolvedValue}
        onChange={(e) => emit(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel || "Select client bot instance"}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {!hasInstances && <option value="">No instances yet</option>}
        {hasInstances && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {instances.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} • {m.mode}
          </option>
        ))}
      </select>
    );
  }

  // ----- BOTH SCOPE -----
  const unifiedPlaceholder =
    placeholderOption || "Select a template or instance";

  return (
    <select
      className={baseCls}
      value={resolvedValue}
      onChange={(e) => emit(e.target.value)}
      disabled={disabled}
      aria-label={ariaLabel || "Select bot or instance"}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}

      {/* Unified placeholder (disabled) */}
      <option value="" disabled>
        {unifiedPlaceholder}
      </option>

      {showGroups ? (
        <>
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
        </>
      ) : (
        <>
          {!hasTemplates && !hasInstances && (
            <option value="">No templates or instances</option>
          )}
          {templates.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name} ({t.key})
            </option>
          ))}
          {instances.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} • {m.mode}
            </option>
          ))}
        </>
      )}
    </select>
  );
}
