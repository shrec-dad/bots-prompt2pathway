// src/pages/admin/Nurture.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listInstances, type InstanceMeta } from "@/lib/instances";

/** ───────────────────────────────────────────────────────────────────────────
 * Storage model
 * Each instance stores its own nurture schedule:
 *   localStorage["nurture:inst:<id>"] = Day[]
 * where Day = { enabled:boolean, subject:string, body:string }
 * ───────────────────────────────────────────────────────────────────────────*/

type Day = { enabled: boolean; subject: string; body: string };
const DAY_COUNT = 14;

const keyForInst = (instId: string) => `nurture:inst:${instId}`;

function loadDays(instId: string): Day[] {
  try {
    const raw = localStorage.getItem(keyForInst(instId));
    if (!raw) return Array.from({ length: DAY_COUNT }, () => blankDay());
    const parsed = JSON.parse(raw) as Day[];
    // make sure array length is normalized
    const out = Array.from({ length: DAY_COUNT }, (_, i) => parsed[i] ?? blankDay());
    return out;
  } catch {
    return Array.from({ length: DAY_COUNT }, () => blankDay());
  }
}

function saveDays(instId: string, days: Day[]) {
  const normalized = Array.from({ length: DAY_COUNT }, (_, i) => days[i] ?? blankDay());
  localStorage.setItem(keyForInst(instId), JSON.stringify(normalized));
}

const blankDay = (): Day => ({ enabled: false, subject: "", body: "" });

/** ───────────────────────────────────────────────────────────────────────────
 * UI bits
 * ───────────────────────────────────────────────────────────────────────────*/

const input =
  "w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

function Block({
  index,
  value,
  onChange,
}: {
  index: number;
  value: Day;
  onChange: (d: Day) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-purple-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-[28px] font-black text-purple-900">Day {index + 1}</div>
        <label className="inline-flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div className="mt-3">
        <div className="text-xs font-extrabold uppercase text-purple-700 mb-1">Subject</div>
        <input
          className={input}
          value={value.subject}
          placeholder="Subject for Day X"
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
        />
      </div>

      <div className="mt-3">
        <div className="text-xs font-extrabold uppercase text-purple-700 mb-1">Message</div>
        <textarea
          className={input}
          rows={5}
          placeholder="Short message for Day X"
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
        />
      </div>
    </div>
  );
}

/** ───────────────────────────────────────────────────────────────────────────
 * Page
 * ───────────────────────────────────────────────────────────────────────────*/

export default function Nurture() {
  const [search, setSearch] = useSearchParams();
  const instFromUrl = search.get("inst") || "";

  // list of bot instances (for the picker)
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "botInstances:index" || e.key.startsWith("botInstances:")) {
        setInstances(listInstances());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // currently selected instance
  const [instId, setInstId] = useState<string>(instFromUrl);

  // schedule model
  const [days, setDays] = useState<Day[]>(
    instFromUrl ? loadDays(instFromUrl) : Array.from({ length: DAY_COUNT }, () => blankDay())
  );

  // reload when instance changes
  useEffect(() => {
    if (!instId) return;
    setDays(loadDays(instId));
    // keep URL in sync
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set("inst", instId);
      return next;
    });
  }, [instId, setSearch]);

  const selectedInst = useMemo(
    () => instances.find((m) => m.id === instId),
    [instances, instId]
  );

  function saveSchedule() {
    if (!instId) {
      alert("Pick a Client Bot (instance) first.");
      return;
    }
    saveDays(instId, days);
    alert("Nurture schedule saved for this instance.");
  }

  function duplicateToNewInstance() {
    const first = instances[0];
    if (!first) {
      alert("No instances yet. Create or duplicate a bot first on the Bots page.");
      return;
    }
    // just navigate to nurture with that instance to edit; duplication of bots
    // themselves happens on the Bots page. Here we’ll clone the *schedule* to
    // another existing instance the user picks.
    const targetId = prompt(
      `Paste the INSTANCE ID to copy this schedule to.\n\nAvailable:\n` +
        instances.map((x) => `• ${x.name || x.id}  —  ${x.id}`).join("\n")
    );
    if (!targetId) return;
    saveDays(targetId, days);
    window.location.href = `/admin/nurture?inst=${encodeURIComponent(targetId)}`;
  }

  function sendTestEmail() {
    if (!instId) {
      alert("Pick a Client Bot (instance) first.");
      return;
    }
    const to = prompt("Send test to (email address):", "you@example.com");
    if (!to) return;

    // Build a simple preview using the first enabled day.
    const enabled = days
      .map((d, i) => ({ ...d, day: i + 1 }))
      .filter((d) => d.enabled && (d.subject || d.body));

    if (enabled.length === 0) {
      alert("You have no enabled messages. Enable at least one day first.");
      return;
    }

    const first = enabled[0];
    const subj = `[TEST] Day ${first.day} — ${first.subject || "Nurture Message"}`;
    const body =
      `This is a test send for instance "${selectedInst?.name || instId}".\n\n` +
      enabled
        .slice(0, 3) // keep it short
        .map(
          (d) =>
            `Day ${d.day}\nSubject: ${d.subject || "(none)"}\nMessage:\n${d.body || "(none)"}\n`
        )
        .join("\n---\n") +
      `\n\n(Only a preview — actual scheduling/wiring is up to your ESP.)`;

    // mailto keeps it simple for this prototype
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subj
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Nurture (Day 1–14)
            </h1>
            <p className="text-sm text-foreground/70">
              Create simple 7–14 day sequences now. This page has placeholders ready
              to wire to your email service later.
            </p>
            {!instId && (
              <div className="text-xs font-bold text-rose-700 mt-1">
                (Unsaved / No Instance Selected)
              </div>
            )}
          </div>

          {/* Instance picker + actions */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-foreground/70">
                Client Bot
              </label>
              <select
                className="rounded-lg border px-3 py-2 font-semibold bg-white min-w-[260px]"
                value={instId}
                onChange={(e) => setInstId(e.target.value)}
              >
                <option value="" disabled>
                  Pick a client bot instance…
                </option>
                {instances
                  .slice()
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {(m.name || `${m.bot} Instance`) + " • " + m.mode}
                    </option>
                  ))}
              </select>
            </div>

            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30"
              onClick={duplicateToNewInstance}
            >
              Duplicate to New Instance
            </button>

            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30"
              onClick={sendTestEmail}
            >
              Send Test Email
            </button>

            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30"
              onClick={saveSchedule}
            >
              Save Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Grid of days (2-up) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {days.map((d, i) => (
          <Block
            key={i}
            index={i}
            value={d}
            onChange={(next) =>
              setDays((prev) => {
                const out = [...prev];
                out[i] = next;
                return out;
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
