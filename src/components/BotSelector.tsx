// src/components/BotSelector.tsx
import { useMemo } from "react";
type Scope = "template" | "instance" | "both";

export type BotSelectorValue =
  | { kind: "template"; id: string }
  | { kind: "instance"; id: string }
  | null;

type BotTemplate = {
  _id: string;
  name: string;
};

type BotInstance = {
  _id: string;
  name: string;
  plan?: string;
};

type Props = {
  scope: Scope;
  templates?: BotTemplate[];
  instances?: BotInstance[];
  /** For template scope: pass template key; for instance: pass instance id; for both: pass template key or instance id */
  value?: string;

  /**
   * Primary change handler (kept for backward-compat). Emits an OBJECT:
   *  - { kind: "template", key } or { kind: "instance", id } or null
   *
   * NOTE: We also added `onChangeString` below if you prefer a raw string id/key.
   */
  onChange: (next: BotSelectorValue) => void;

  /** Optional secondary handler that emits a raw string (template id OR instance id), or null. */
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
  templates = [],
  instances = [],
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

    let obj: BotSelectorValue | null = null;

    if (scope === "template") {
      obj = { kind: "template", id: raw };
    } else if (scope === "instance") {
      obj = { kind: "instance", id: raw };
    } else {
      // "both" scope: try to find in templates first, fallback to instances
      const foundTemplate = templates.find((t) => t._id === raw);
      const foundInstance = instances.find((m) => m._id === raw);
      if (foundTemplate) obj = { kind: "template", id: raw };
      else if (foundInstance) obj = { kind: "instance", id: raw };
      else obj = null;
    }

    onChange(obj);
    onChangeString?.(raw);
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
          <option key={t._id} value={t._id}>
            {t.name}
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
          <option key={m._id} value={m._id}>
            {m.name} • {m.plan}
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
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </optgroup>

          <optgroup label="Client Bots (instances)">
            {!hasInstances && <option value="">No client bots yet</option>}
            {instances.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} • {m.plan}
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
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
          {instances.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} • {m.plan}
            </option>
          ))}
        </>
      )}
    </select>
  );
}

