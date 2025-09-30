// src/pages/admin/Bots.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBotSettings, setBotSettings, BotKey } from "@/lib/botSettings";
import {
  listInstances,
  createInstance,
  duplicateInstanceFromTemplate,
  removeInstance,
  type BotInstance,
} from "@/lib/instances";

/* ---------------- Types & Catalog ---------------- */

type BotDef = {
  key: BotKey;
  name: string;
  gradient: string; // tailwind gradient classes
  emoji: string;
  description: string;
};

const BOTS: BotDef[] = [
  {
    key: "LeadQualifier",
    name: "Lead Qualifier",
    emoji: "🎯",
    gradient: "from-purple-500/20 via-fuchsia-400/20 to-pink-500/20",
    description:
      "Qualify leads with scoring, validation and routing. Best for sales intake.",
  },
  {
    key: "AppointmentBooking",
    name: "Appointment Booking",
    emoji: "📅",
    gradient: "from-emerald-500/20 via-teal-400/20 to-cyan-500/20",
    description:
      "Offer services, show availability, confirm and remind automatically.",
  },
  {
    key: "CustomerSupport",
    name: "Customer Support",
    emoji: "🛟",
    gradient: "from-indigo-500/20 via-blue-400/20 to-sky-500/20",
    description:
      "Answer FAQs, create tickets, route priority issues and hand off to humans.",
  },
  {
    key: "Waitlist",
    name: "Waitlist",
    emoji: "⏳",
    gradient: "from-amber-500/25 via-orange-400/20 to-rose-500/20",
    description:
      "Collect interest, show queue status and notify customers automatically.",
  },
  {
    key: "SocialMedia",
    name: "Social Media",
    emoji: "📣",
    gradient: "from-pink-500/20 via-rose-400/20 to-red-500/20",
    description:
      "Auto-DM replies, comment handling, and engagement prompts across platforms.",
  },
];

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

/* ---------------- Modal for Create ---------------- */

function CreateModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (p: { name: string; baseKey: BotKey; mode: "basic" | "custom" }) => void;
}) {
  const [name, setName] = useState("My New Bot");
  const [baseKey, setBaseKey] = useState<BotKey>("LeadQualifier");
  const [mode, setMode] = useState<"basic" | "custom">("custom");

  useEffect(() => {
    if (open) {
      setName("My New Bot");
      setBaseKey("LeadQualifier");
      setMode("custom");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30"
      onClick={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className="w-[520px] max-w-[92vw] rounded-2xl border-2 border-black bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xl font-extrabold mb-3">Create Bot from Template</div>

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm font-semibold">
            Name
            <input
              className="mt-1 w-full rounded-lg border-2 border-black/20 bg-white px-3 py-2 font-semibold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bot name"
            />
          </label>

          <label className="text-sm font-semibold">
            Template
            <select
              className="mt-1 w-full rounded-lg border-2 border-black/20 bg-white px-3 py-2 font-semibold"
              value={baseKey}
              onChange={(e) => setBaseKey(e.target.value as BotKey)}
            >
              {BOTS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            Plan
            <select
              className="mt-1 w-full rounded-lg border-2 border-black/20 bg-white px-3 py-2 font-semibold"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value === "basic" ? "basic" : "custom")
              }
            >
              <option value="basic">Basic</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            onClick={() => onCreate({ name: name.trim() || "My New Bot", baseKey, mode })}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function Bots() {
  const navigate = useNavigate();

  // plan select values per base template
  const [modes, setModes] = useState<Record<BotKey, "basic" | "custom">>(() =>
    Object.fromEntries(
      BOTS.map((b) => [b.key, getBotSettings(b.key).mode])
    ) as Record<BotKey, "basic" | "custom">
  );

  // instances under "My Bots"
  const [instances, setInstances] = useState<BotInstance[]>(() =>
    listInstances()
  );

  // keep plan selects synced if edited elsewhere
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("botSettings:")) {
        const key = e.key.split(":")[1] as BotKey;
        setModes((prev) => ({ ...prev, [key]: getBotSettings(key).mode }));
      }
      if (
        e.key === "botInstances:index" ||
        (e.key && e.key.startsWith("botSettingsInst:"))
      ) {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // modal state
  const [openCreate, setOpenCreate] = useState(false);

  const totals = useMemo(
    () => ({
      active: instances.length,
      conv: "1,284",
      leads: "312",
    }),
    [instances.length]
  );

  return (
    <div className="w-full h-full">
      {/* Header + Create button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-extrabold">Bots</div>
        <button
          className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
          onClick={() => setOpenCreate(true)}
        >
          + Create New Bot
        </button>
      </div>

      {/* Header metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value={String(totals.active)} />
        <Stat label="Conversations (7d)" value={totals.conv} />
        <Stat label="Leads / Tickets (7d)" value={totals.leads} />
      </div>

      {/* Bot catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {BOTS.map((b) => (
          <div
            key={b.key}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition"
          >
            <div
              className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br ${b.gradient}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                  {b.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {b.name}
                  </h3>
                  <p className="text-sm font-semibold text-foreground/80">
                    {b.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="text-sm font-semibold text-foreground/80">
                Plan:
              </div>
              <select
                className="rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm"
                value={modes[b.key]}
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
                className="ml-auto rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => navigate(`/admin/builder?bot=${b.key}`)}
                aria-label={`Open ${b.name} in Builder`}
              >
                Open Builder
              </button>
            </div>

            <div className="mt-3">
              <button
                className="inline-block rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-gray-50"
                onClick={() => {
                  const inst = duplicateInstanceFromTemplate({
                    baseKey: b.key,
                    mode: modes[b.key],
                    name: `${b.name} (Copy)`,
                  });
                  setInstances(listInstances());
                  navigate(`/admin/builder?inst=${inst.id}`);
                }}
              >
                Duplicate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Bots (instances) */}
      <div className="mt-10">
        <div className="text-xl font-extrabold mb-3">My Bots</div>
        {instances.length === 0 ? (
          <div className="rounded-xl border-2 border-black p-6 bg-gradient-to-r from-amber-200 via-sky-200 to-violet-200">
            <div className="font-semibold">
              No bots yet. Click <b>+ Create New Bot</b> or use{" "}
              <b>Duplicate</b> on a template.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instances.map((inst) => (
              <div
                key={inst.id}
                className="rounded-2xl border bg-card p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-extrabold">
                    {inst.name}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {inst.baseKey.replace(/([A-Z])/g, " $1").trim()} • {inst.mode}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-gray-50"
                    onClick={() => navigate(`/admin/builder?inst=${inst.id}`)}
                  >
                    Open
                  </button>
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-rose-50"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${inst.name}"? This removes its local data.`
                        )
                      ) {
                        removeInstance(inst.id);
                        setInstances(listInstances());
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={({ name, baseKey, mode }) => {
          const inst = createInstance({ name, baseKey, mode });
          setOpenCreate(false);
          setInstances(listInstances());
          // jump to Builder for that instance
          navigate(`/admin/builder?inst=${inst.id}`);
        }}
      />
    </div>
  );
}
