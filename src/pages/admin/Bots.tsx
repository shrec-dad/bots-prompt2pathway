// src/pages/admin/Bots.tsx
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
  updateTemplate, // make sure this exists in lib/templates.ts
} from "@/lib/templates";

/* ---------- shared analytics store ---------- */
type Metrics = {
  conversations: number;
  leads: number;
  avgResponseSecs?: number;
  csatPct?: number;
};
const METRICS_KEY = "analytics:metrics";
const HIDDEN_TEMPLATES_KEY = "botTemplates:hiddenKeys";

/* ---------- display helpers ---------- */
type BotKey = string;
function botKeyToLabel(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.name || (key as string);
}
function botKeyToGradient(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.gradient || "from-gray-200 to-gray-100";
}
function botKeyToEmoji(defs: ReturnType<typeof listTemplateDefs>, key: BotKey) {
  return defs.find((b) => b.key === key)?.emoji || "🤖";
}

/* ---------- built-in templates ---------- */
const BUILTIN_META: Record<
  string,
  { name: string; emoji: string; gradient: string; description: string }
> = {
  LeadQualifier: {
    name: "Lead Qualifier",
    emoji: "🎯",
    gradient: "from-purple-500/20 via-fuchsia-400/20 to-pink-500/20",
    description: "Qualify leads with scoring, validation and routing. Best for sales intake.",
  },
  AppointmentBooking: {
    name: "Appointment Booking",
    emoji: "📅",
    gradient: "from-emerald-500/20 via-teal-400/20 to-cyan-500/20",
    description: "Offer services, show availability, confirm and remind automatically.",
  },
  CustomerSupport: {
    name: "Customer Support",
    emoji: "🛟",
    gradient: "from-indigo-500/20 via-blue-400/20 to-sky-500/20",
    description: "Answer FAQs, create tickets, route priority issues and hand off to humans.",
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
    description: "Auto-DM replies, comment handling, and engagement prompts across platforms.",
  },
};

/* ---------------- main page ---------------- */
export default function Bots() {
  const [defs, setDefs] = useState(() => listTemplateDefs());
  const [modes, setModes] = useState<Record<string, "basic" | "custom">>(() =>
    Object.fromEntries(defs.map((b) => [b.key, getBotSettings(b.key).mode || "basic"])) as Record<
      string,
      "basic" | "custom"
    >
  );
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());
  const [metrics, setMetrics] = useState<Metrics>(() =>
    getJSON<Metrics>(METRICS_KEY, { conversations: 0, leads: 0 })
  );
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>(() =>
    getJSON<string[]>(HIDDEN_TEMPLATES_KEY, [])
  );

  // create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotEmoji, setNewBotEmoji] = useState("🤖");

  // edit emoji modal
  const [showEditEmojiModal, setShowEditEmojiModal] = useState(false);
  const [emojiToEdit, setEmojiToEdit] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("🤖");

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("botSettings:")) {
        const key = e.key.split(":")[1] as BotKey;
        setModes((prev) => ({ ...prev, [key]: getBotSettings(key).mode }));
      }
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:"))
        setInstances(listInstances());
      if (e.key === METRICS_KEY)
        setMetrics(getJSON<Metrics>(METRICS_KEY, { conversations: 0, leads: 0 }));
      if (
        e.key === "botTemplates:index" ||
        (e.key && e.key.startsWith("botTemplates:data:")) ||
        e.key === HIDDEN_TEMPLATES_KEY
      ) {
        setDefs(listTemplateDefs());
        setHiddenKeys(getJSON<string[]>(HIDDEN_TEMPLATES_KEY, []));
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
  const safeInstanceName = (m: InstanceMeta) =>
    (m.name && String(m.name)) || `${botKeyToLabel(defs, m.bot)} Instance`;
  const sortedInstances = useMemo(
    () => [...instances].sort((a, b) => b.updatedAt - a.updatedAt),
    [instances]
  );

  const toKey = (name: string) =>
    name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

  const hiddenCards = hiddenKeys
    .filter((k) => BUILTIN_META[k])
    .map((k) => ({ key: k, ...BUILTIN_META[k] }));

  const emojiOptions = [
    "🎯",
    "📅",
    "💬",
    "⏳",
    "📢",
    "☎️",
    "🤖",
    "💼",
    "🌟",
    "🧭",
  ];

  return (
    <div className="w-full h-full">
      {/* Header */}
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

      {/* Template Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {defs.map((b) => (
          <div
            key={b.key}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition group flex flex-col"
          >
            <div className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br ${b.gradient}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                    {b.emoji}
                  </div>
                  <button
                    onClick={() => {
                      setEmojiToEdit(b.key);
                      setSelectedEmoji(b.emoji || "🤖");
                      setShowEditEmojiModal(true);
                    }}
                    className="absolute -top-2 -right-2 bg-white rounded-full border text-xs p-1 hover:bg-gray-100"
                    title="Edit Emoji"
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
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => (window.location.href = `/admin/builder?bot=${b.key}`)}
              >
                Open Builder
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE NEW BOT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border-2 border-black p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-extrabold mb-2">Create New Bot</h2>
            <label className="font-semibold block mb-1">Bot Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 font-semibold mb-4"
              placeholder="e.g. Receptionist Bot"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
            />
            <label className="font-semibold block mb-2">Choose an Emoji</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {emojiOptions.map((emj) => (
                <button
                  key={emj}
                  onClick={() => setNewBotEmoji(emj)}
                  className={`text-3xl rounded-xl border-2 p-2 ${
                    newBotEmoji === emj
                      ? "border-black bg-yellow-100 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {emj}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 font-bold ring-1 ring-border bg-white rounded-xl hover:bg-muted/40"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 rounded-xl"
                onClick={() => {
                  const name = newBotName.trim() || "New Template";
                  const key = toKey(name);
                  if (defs.some((d) => d.key === key)) {
                    alert("A template with this name/key already exists.");
                    return;
                  }
                  createTemplate({ name, key, emoji: newBotEmoji });
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

      {/* EDIT EMOJI MODAL */}
      {showEditEmojiModal && emojiToEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border-2 border-black p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-extrabold mb-2">Edit Bot Emoji</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose a new emoji for your bot.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {emojiOptions.map((emj) => (
                <button
                  key={emj}
                  onClick={() => setSelectedEmoji(emj)}
                  className={`text-3xl rounded-xl border-2 p-2 ${
                    selectedEmoji === emj
                      ? "border-black bg-yellow-100 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {emj}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 font-bold ring-1 ring-border bg-white rounded-xl hover:bg-muted/40"
                onClick={() => setShowEditEmojiModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500 rounded-xl"
                onClick={() => {
                  updateTemplate(emojiToEdit, { emoji: selectedEmoji });
                  setDefs(listTemplateDefs());
                  setShowEditEmojiModal(false);
                }}
              >
                Save Emoji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Stat Component ---------- */
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
