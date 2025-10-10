import React, { useEffect, useMemo, useState } from "react";
import { getBotSettings, setBotSettings } from "@/lib/botSettings";
import {
  listInstances,
  removeInstance,
  duplicateInstanceFromTemplate,
  renameInstance,
  type InstanceMeta,
} from "@/lib/instances";
import { getJSON, setJSON } from "@/lib/storage";
import {
  listTemplateDefs,
  createTemplate,
  deleteTemplate,
  isBuiltInKey,
  unhideTemplate,
} from "@/lib/templates";

/* ---------- shared analytics store ---------- */
type Metrics = {
  conversations: number;
  leads: number;
  avgResponseSecs?: number;
  csatPct?: number;
};
const METRICS_KEY = "analytics:metrics";

/* ---------- Hidden templates storage key ---------- */
const HIDDEN_TEMPLATES_KEY = "botTemplates:hiddenKeys";

/* ---------- Emoji overrides (works for built-ins & customs) ---------- */
const EMOJI_OVERRIDES_KEY = "botTemplates:emojiOverrides"; // Record<botKey, emoji>

/* ---------- display helpers ---------- */
type BotKey = string;

function botKeyToLabel(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.name || (key as string);
}
function botKeyToGradient(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.gradient || "from-gray-200 to-gray-100";
}
function rawEmojiFor(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.emoji || "🤖";
}

/* Built-in metadata (for nice cards when they’re hidden)
   NOTE: These are only used to render “Hidden Templates”.
   The actual visible template list comes from listTemplateDefs() so
   Receptionist will appear here automatically once added to templates.ts. */
const BUILTIN_META: Record<
  string,
  { name: string; emoji: string; gradient: string; description: string }
> = {
  LeadQualifier: {
    name: "Lead Qualifier",
    emoji: "🎯",
    gradient: "from-purple-500/20 via-fuchsia-400/20 to-pink-500/20",
    description:
      "Qualify leads with scoring, validation and routing. Best for sales intake.",
  },
  AppointmentBooking: {
    name: "Appointment Booking",
    emoji: "📅",
    gradient: "from-emerald-500/20 via-teal-400/20 to-cyan-500/20",
    description:
      "Offer services, show availability, confirm and remind automatically.",
  },
  CustomerSupport: {
    name: "Customer Support",
    emoji: "🛟",
    gradient: "from-indigo-500/20 via-blue-400/20 to-sky-500/20",
    description:
      "Answer FAQs, create tickets, route priority issues and hand off to humans.",
  },
  Waitlist: {
    name: "Waitlist",
    emoji: "⏳",
    gradient: "from-amber-500/25 via-orange-400/20 to-rose-500/20",
    description: "Collect interest, show queue status and notify customers.",
  },
  SocialMedia: {
    name: "Social Media",
    emoji: "📣",
    gradient: "from-pink-500/20 via-rose-400/20 to-red-500/20",
    description:
      "Auto-DM replies, comment handling, and engagement prompts across platforms.",
  },
  // Receptionist appears here when hidden (for the Hidden Templates section)
  Receptionist: {
    name: "Receptionist",
    emoji: "☎️",
    gradient: "from-sky-500/20 via-cyan-400/20 to-emerald-500/20",
    description:
      "Greets callers/chats, answers questions, routes, books, and takes messages.",
  },
};

/* ---------- Small inline Emoji Picker Modal ---------- */
function EmojiPickerModal({
  onClose,
  onPick,
  current,
}: {
  onClose: () => void;
  onPick: (emoji: string) => void;
  current?: string;
}) {
  const emojis = [
    "🎯", // Lead Qualifier
    "📅", // Appointment Booking
    "💬", // Customer Support
    "⏳", // Waitlist
    "📣", // Social Media
    "☎️", // Receptionist
    "🤖", // General AI
    "💼", // Business Bot
    "🌟", // Premium Bot
    "🧭", // Guidance Bot
    "🏥",
    "🛍️",
    "🧾",
    "🧰",
    "🛠️",
    "💡",
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl border-2 border-black p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-extrabold">Choose Emoji</h3>
          <button
            className="rounded-lg border px-2 py-1 text-sm font-bold hover:bg-muted/40"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="text-sm text-foreground/70 mb-3">
          Pick an emoji to represent this bot template.
        </div>
        <div className="grid grid-cols-6 gap-3">
          {emojis.map((emj) => (
            <button
              key={emj}
              onClick={() => {
                onPick(emj);
                onClose();
              }}
              className={`text-2xl rounded-xl border-2 p-2 transition ${
                current === emj
                  ? "border-black bg-yellow-100 shadow"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              title={emj}
            >
              {emj}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- persistence helpers (instances) ---------------- */

/** Minimal direct access keys used elsewhere in the app */
const INST_INDEX_KEY = "botInstances:index";
const INST_DATA_KEY = (id: string) => `botInstances:${id}`;

/** Safely touch/persist an instance: keeps index in sync & updates updatedAt */
function saveInstanceRecord(inst: InstanceMeta) {
  try {
    // 1) Persist the instance payload itself (merge if exists)
    const existing = getJSON<any>(INST_DATA_KEY(inst.id), null);
    const merged = { ...(existing || {}), ...inst, updatedAt: Date.now() };
    setJSON(INST_DATA_KEY(inst.id), merged);

    // 2) Ensure the index contains this id exactly once
    const index = getJSON<string[]>(INST_INDEX_KEY, []);
    const nextIndex = Array.from(new Set([...(index || []), inst.id]));
    setJSON(INST_INDEX_KEY, nextIndex);
  } catch {
    // no-op
  }
}

/** After creating/renaming/removing, re-read instances with a short double-pass to avoid races */
function refreshInstancesStable(setter: (arr: InstanceMeta[]) => void) {
  // immediate
  setter(listInstances());
  // next frame
  requestAnimationFrame(() => setter(listInstances()));
  // tiny delay
  setTimeout(() => setter(listInstances()), 60);
}

/* ---------------- main page ---------------- */

export default function Bots() {
  // Dynamic template catalog
  const [defs, setDefs] = useState(() => listTemplateDefs());

  // Plan mode per template key
  const [modes, setModes] = useState<Record<string, "basic" | "custom">>(() =>
    Object.fromEntries(defs.map((b) => [b.key, getBotSettings(b.key).mode || "basic"])) as Record<
      string,
      "basic" | "custom"
    >
  );

  // Instances list (My Bots)
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());

  // Per-instance ephemeral "Saved!" indicator
  const [savedId, setSavedId] = useState<string | null>(null);

  // Analytics metrics used for header stats
  const [metrics, setMetrics] = useState<Metrics>(() =>
    getJSON<Metrics>(METRICS_KEY, {
      conversations: 0,
      leads: 0,
    })
  );

  // Hidden templates UI
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>(
    () => getJSON<string[]>(HIDDEN_TEMPLATES_KEY, [])
  );

  // Create Template Modal + Emoji Picker (for new templates)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotEmoji, setNewBotEmoji] = useState("🤖");

  // Inline Emoji Picker state (for editing existing templates)
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<null | { key: string; emoji: string }>(
    null
  );

  // Emoji overrides map
  const [emojiOverrides, setEmojiOverrides] = useState<Record<string, string>>(
    () => getJSON<Record<string, string>>(EMOJI_OVERRIDES_KEY, {})
  );

  // computed: emoji taking overrides into account
  const emojiFor = (key: string) => emojiOverrides[key] || rawEmojiFor(defs, key);

  // keep in sync if storage changes elsewhere
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("botSettings:")) {
        const key = e.key.split(":")[1] as BotKey;
        setModes((prev) => ({ ...prev, [key]: getBotSettings(key).mode || "basic" }));
      }
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
      if (e.key === METRICS_KEY) {
        setMetrics(getJSON<Metrics>(METRICS_KEY, { conversations: 0, leads: 0 }));
      }
      if (
        e.key === "botTemplates:index" ||
        (e.key && e.key.startsWith("botTemplates:data:")) ||
        e.key === HIDDEN_TEMPLATES_KEY
      ) {
        setDefs(listTemplateDefs());
        setHiddenKeys(getJSON<string[]>(HIDDEN_TEMPLATES_KEY, []));
      }
      if (e.key === EMOJI_OVERRIDES_KEY) {
        setEmojiOverrides(getJSON<Record<string, string>>(EMOJI_OVERRIDES_KEY, {}));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resetTopStats = () => {
    const next = { ...metrics, conversations: 0, leads: 0 };
    setMetrics(next);
    setJSON(METRICS_KEY, next);
  };

  const fmtInt = (n: number) =>
    Number.isFinite(n) ? Math.max(0, Math.round(n)).toLocaleString() : "0";

  // safely format a title
  const safeInstanceName = (m: InstanceMeta) =>
    (m.name && String(m.name)) || `${botKeyToLabel(defs, m.bot)} Instance`;

  // Tidy, sorted list for display
  const sortedInstances = useMemo(
    () => [...instances].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [instances]
  );

  // Utility: simple slug/key from a name
  const toKey = (name: string) =>
    name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

  // Derive pretty cards for hidden built-ins
  const hiddenCards = hiddenKeys
    .filter((k) => BUILTIN_META[k]) // only built-ins are hidable
    .map((k) => ({ key: k, ...BUILTIN_META[k] }));

  // persist emoji override
  const setEmojiForKey = (key: string, emoji: string) => {
    const next = { ...emojiOverrides, [key]: emoji };
    setEmojiOverrides(next);
    setJSON(EMOJI_OVERRIDES_KEY, next);
  };

  return (
    <div className="w-full h-full">
      {/* Header + Create / Reset buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-extrabold">Bots</div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold mr-2">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />
            Show Hidden Templates
          </label>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30"
            title="Reset Conversations and Leads"
            onClick={resetTopStats}
          >
            Reset
          </button>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Bot
          </button>
        </div>
      </div>

      {/* If toggle is on, show Hidden Templates section */}
      {showHidden && (
        <div className="mb-8">
          <div className="text-lg font-extrabold mb-3">Hidden Templates</div>
          {hiddenCards.length === 0 ? (
            <div className="rounded-xl border bg-card p-4 text-sm">No hidden templates right now.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {hiddenCards.map((b) => (
                <div
                  key={b.key}
                  className="rounded-2xl border bg-card p-5 hover:shadow-md transition group flex flex-col"
                >
                  <div className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br ${b.gradient}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                        {b.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold tracking-tight">{b.name}</h3>
                        <p className="text-sm font-semibold text-foreground/80">{b.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-emerald-50"
                      onClick={() => {
                        unhideTemplate(b.key);
                        setDefs(listTemplateDefs());
                        setHiddenKeys(getJSON<string[]>(HIDDEN_TEMPLATES_KEY, []));
                      }}
                      aria-label={`Unhide ${b.name}`}
                    >
                      Unhide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value={String(sortedInstances.length)} />
        <Stat label="Conversations (7d)" value={fmtInt(metrics.conversations)} />
        <Stat label="Leads / Tickets (7d)" value={fmtInt(metrics.leads)} />
      </div>

      {/* Template catalog (dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {defs.map((b) => (
          <div
            key={b.key}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition group flex flex-col"
          >
            <div className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br ${b.gradient}`}>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                  {/* Emoji */}
                  <span>{emojiFor(b.key)}</span>

                  {/* Pencil (appears on hover) */}
                  <button
                    title="Change emoji"
                    onClick={() => setShowEmojiPickerFor({ key: b.key, emoji: emojiFor(b.key) })}
                    className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition
                               rounded-full border bg-white text-xs px-1.5 py-0.5 shadow ring-1 ring-border"
                    aria-label={`Change emoji for ${b.name}`}
                  >
                    ✏️
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">{b.name}</h3>
                  <p className="text-sm font-semibold text-foreground/80">{b.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="text-sm font-semibold text-foreground/80">Plan:</div>

              <select
                className="ml-auto rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm"
                value={modes[b.key] || "basic"}
                onChange={(e) => {
                  const mode = e.target.value as "basic" | "custom";
                  setModes((prev) => ({ ...prev, [b.key]: mode }));
                  setBotSettings(b.key, { mode });
                }}
                aria-label={`${b.name} plan`}
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>

              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => (window.location.href = `/admin/builder?bot=${b.key}`)}
                aria-label={`Open ${b.name} in Builder`}
              >
                Open Builder
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-muted/40"
                onClick={() => {
                  const mode = (modes[b.key] || "basic") as "basic" | "custom";
                  const defaultName = `${b.name} (Copy)`;
                  const desired =
                    prompt("Name this new client bot:", defaultName)?.trim() || defaultName;

                  duplicateInstanceFromTemplate(b.key as any, mode, desired);
                  refreshInstancesStable(setInstances);
                }}
                aria-label={`Duplicate ${b.name}`}
              >
                Duplicate
              </button>

              {/* Delete for ALL templates (built-in = hide; custom = remove) */}
              <button
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-rose-50"
                onClick={() => {
                  const builtin = isBuiltInKey(b.key);
                  const ok = confirm(
                    builtin
                      ? `Hide "${b.name}" (built-in) from your Templates?\n\nThis does NOT delete existing instances and can be restored later.`
                      : `Delete custom template "${b.name}"?\n\nThis removes it from your Templates and deletes its stored graphs.\nExisting instances remain intact.`
                  );
                  if (!ok) return;
                  deleteTemplate(b.key);
                  setDefs(listTemplateDefs());
                  setHiddenKeys(getJSON<string[]>(HIDDEN_TEMPLATES_KEY, []));
                }}
                aria-label={`Delete ${b.name}`}
                title="Delete (built-ins are hidden; customs are removed)"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Bots (instances) */}
      <div className="mt-10">
        <div className="text-lg font-extrabold mb-3">My Bots</div>

        {sortedInstances.length === 0 ? (
          <div className="rounded-xl border bg-card p-4 text-sm">
            You don’t have any instances yet. Click <b>Duplicate</b> on a card above or use{" "}
            <b>Create New Bot</b>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedInstances.map((m) => {
              const title = safeInstanceName(m);
              const sub = `${botKeyToLabel(defs, m.bot)} • ${m.mode}`.trim();
              const grad = botKeyToGradient(defs, m.bot);
              const emoji = emojiFor(m.bot);

              return (
                <div key={m.id} className="rounded-2xl border bg-card overflow-hidden flex flex-col">
                  <div className={`p-4 ring-1 ring-border bg-gradient-to-br ${grad}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 grid place-items-center rounded-xl bg-white/70 ring-1 ring-border text-xl">
                        {emoji}
                      </div>
                      <div>
                        <div className="text-lg font-extrabold leading-tight">{title}</div>
                        <div className="text-sm text-foreground/80">{sub}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => (window.location.href = `/admin/builder?inst=${m.id}`)}
                    >
                      Open
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => (window.location.href = `/admin/nurture?inst=${m.id}`)}
                      title="Open nurture schedule for this client bot"
                    >
                      Nurture
                    </button>

                    {/* Manual Save (persist this instance & bump updatedAt) */}
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-emerald-50"
                      onClick={() => {
                        saveInstanceRecord(m);
                        setSavedId(m.id);
                        refreshInstancesStable(setInstances);
                        setTimeout(() => setSavedId((id) => (id === m.id ? null : id)), 1200);
                      }}
                      title="Save this instance"
                    >
                      Save
                    </button>
                    {savedId === m.id && (
                      <span className="text-xs font-bold text-emerald-700">Saved!</span>
                    )}

                    {/* Rename via helper */}
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => {
                        const next = prompt("Rename this bot instance:", title)?.trim();
                        if (!next) return;
                        renameInstance(m.id, next);
                        refreshInstancesStable(setInstances);
                      }}
                    >
                      Rename
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-rose-50"
                      onClick={() => {
                        if (!confirm(`Remove "${title}" instance? This cannot be undone.`)) return;
                        removeInstance(m.id);
                        refreshInstancesStable(setInstances);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------
         🧠 CREATE NEW BOT MODAL WITH EMOJI PICKER (for NEW templates)
      ---------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border-2 border-black p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-extrabold mb-2">Create New Bot</h2>
            <p className="text-sm text-gray-600 mb-4">
              Name your new bot template and choose an emoji that represents it.
            </p>

            {/* Bot name */}
            <label className="font-semibold block mb-1">Bot Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 font-semibold mb-4"
              placeholder="e.g. Receptionist Bot"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
            />

            {/* Emoji selector */}
            <label className="font-semibold block mb-2">Choose an Emoji</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {[
                "🎯", // Lead Qualifier
                "📅", // Appointment Booking
                "💬", // Customer Support
                "⏳", // Waitlist
                "📣", // Social Media
                "☎️", // Receptionist
                "🤖", // General AI
                "💼", // Business Bot
                "🌟", // Premium Bot
                "🧭", // Guidance Bot
              ].map((emj) => (
                <button
                  key={emj}
                  type="button"
                  onClick={() => setNewBotEmoji(emj)}
                  className={`text-3xl rounded-xl border-2 p-2 transition-all ${
                    newBotEmoji === emj
                      ? "border-black bg-yellow-100 shadow-md scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {emj}
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 font-bold ring-1 ring-border bg-white rounded-xl hover:bg-muted/40"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 rounded-xl shadow-[0_3px_0_#000] active:translate-y-[1px]"
                onClick={() => {
                  const name = newBotName.trim() || "New Template";
                  const key = toKey(name);
                  if (defs.some((d) => d.key === key)) {
                    alert("A template with this name/key already exists. Please choose a different name.");
                    return;
                  }
                  createTemplate({
                    name,
                    key,
                    emoji: newBotEmoji,
                  });
                  setDefs(listTemplateDefs());
                  setNewBotName("");
                  setNewBotEmoji("🤖");
                  setShowCreateModal(false);
                }}
              >
                Create Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------
         ✏️ INLINE EMOJI PICKER MODAL (for EXISTING templates)
      ---------------------------------------------------------- */}
      {showEmojiPickerFor && (
        <EmojiPickerModal
          current={showEmojiPickerFor.emoji}
          onClose={() => setShowEmojiPickerFor(null)}
          onPick={(emj) => setEmojiForKey(showEmojiPickerFor.key, emj)}
        />
      )}
    </div>
  );
}

/* ---------- Small Stat component ---------- */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
        {label}
      </div>
      <div className="text-xl font-extrabold leading-tight">{value}</div>
    </div>
  );
}
