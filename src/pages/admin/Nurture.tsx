// src/pages/admin/Nurture.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { listInstances, type InstanceMeta } from "@/lib/instances";

/* ----------------------------------------------------------------------------
   Types & storage helpers
---------------------------------------------------------------------------- */

type NurtureDay = {
  enabled: boolean;
  subject: string;
  message: string;
};

type NurtureSchedule = {
  instId: string;        // instance this schedule belongs to
  days: NurtureDay[];    // 7–14 days supported; we’ll render up to 14
  updatedAt: number;
};

const DEFAULT_DAYS = 14;

const makeEmptyDays = (n = DEFAULT_DAYS): NurtureDay[] =>
  Array.from({ length: n }).map(() => ({
    enabled: false,
    subject: "",
    message: "",
  }));

const keyForInst = (instId: string) => `nurture:schedule:inst:${instId}`;

function loadSchedule(instId: string): NurtureSchedule {
  try {
    const raw = localStorage.getItem(keyForInst(instId));
    if (raw) {
      const parsed = JSON.parse(raw) as NurtureSchedule;
      // pad to DEFAULT_DAYS so UI always has enough cards
      const days = [...(parsed.days || [])];
      while (days.length < DEFAULT_DAYS) days.push({ enabled: false, subject: "", message: "" });
      return { ...parsed, days };
    }
  } catch (_) {}
  return { instId, days: makeEmptyDays(), updatedAt: Date.now() };
}

function saveSchedule(s: NurtureSchedule) {
  localStorage.setItem(keyForInst(s.instId), JSON.stringify({ ...s, updatedAt: Date.now() }));
}

/* ----------------------------------------------------------------------------
   Small UI helpers
---------------------------------------------------------------------------- */

const sectionCard =
  "rounded-2xl border bg-white shadow-sm";
const cardHead =
  "p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b";
const actionBtn =
  "rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30";
const input =
  "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold";
const chkLabel =
  "inline-flex items-center gap-2 text-sm font-bold text-foreground/80";

/* ----------------------------------------------------------------------------
   Page
---------------------------------------------------------------------------- */

export default function Nurture() {
  const [search] = useSearchParams();
  const nav = useNavigate();

  // Instance context (URL param ?inst=ID). If absent, use a local fallback key.
  const instId = search.get("inst") || "default";
  const [schedule, setSchedule] = useState<NurtureSchedule>(() => loadSchedule(instId));
  const [instances, setInstances] = useState<InstanceMeta[]>(() => listInstances());

  // keep in sync if user switches instId via URL elsewhere
  useEffect(() => {
    setSchedule(loadSchedule(instId));
  }, [instId]);

  // keep instance list fresh across tabs
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

  const setDay = (i: number, patch: Partial<NurtureDay>) =>
    setSchedule((prev) => {
      const next = { ...prev, days: prev.days.slice() };
      next.days[i] = { ...next.days[i], ...patch };
      return next;
    });

  const save = () => {
    saveSchedule(schedule);
    alert("Nurture schedule saved.");
  };

  const duplicateToNewInstance = () => {
    if (instances.length === 0) {
      alert("You don’t have any bot instances yet. Go to Bots → Duplicate or Create one first.");
      return;
    }
    const options = instances
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((m) => `${m.name || `${m.bot} Instance`} — ${m.id}`);

    const picked = prompt(
      "Paste the destination Instance ID (shown after the dash in the list below):\n\n" +
        options.join("\n"),
      ""
    );
    if (!picked) return;

    const destId = picked.trim();
    const found = instances.find((m) => m.id === destId);
    if (!found) {
      alert("No instance with that ID was found.");
      return;
    }

    const copy: NurtureSchedule = {
      instId: destId,
      days: schedule.days.map((d) => ({ ...d })),
      updatedAt: Date.now(),
    };
    saveSchedule(copy);
    nav(`/admin/nurture?inst=${encodeURIComponent(destId)}`);
  };

  // Simple client-side "send test email" with mailto. Picks first Enabled day (else Day 1).
  const sendTestEmail = () => {
    const day =
      schedule.days.find((d) => d.enabled && (d.subject || d.message)) ||
      schedule.days[0];
    const to = prompt("Send test email to:", "you@example.com") || "";
    if (!to) return;
    const subj = encodeURIComponent(day.subject || "Test Nurture Email");
    const body = encodeURIComponent(day.message || "(no content)");
    window.location.href = `mailto:${to}?subject=${subj}&body=${body}`;
  };

  const titleSuffix = useMemo(() => {
    if (instId === "default") return " (Unsaved / No Instance Selected)";
    const ins = instances.find((m) => m.id === instId);
    return ins ? ` — ${ins.name || `${ins.bot} • ${ins.mode}`}` : ` — ${instId}`;
  }, [instId, instances]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={sectionCard}>
        <div className={`${cardHead} flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4`}>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Nurture (Day 1–14)
              <span className="text-foreground/60 text-sm font-semibold ml-2">
                {titleSuffix}
              </span>
            </h1>
            <p className="text-sm text-foreground/70">
              Create simple 7–14 day sequences now. This page has placeholders ready to wire to your email service later.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className={actionBtn} onClick={duplicateToNewInstance}>
              Duplicate to New Instance
            </button>
            <button className={actionBtn} onClick={sendTestEmail} title="Opens a mail draft with the first enabled day">
              Send Test Email
            </button>
            <button
              className="rounded-xl px-4 py-2 font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={save}
            >
              Save Schedule
            </button>
          </div>
        </div>

        {/* Body: two-column day cards */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schedule.days.map((d, i) => {
              const dayNum = i + 1;
              return (
                <div key={i} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-extrabold">Day {dayNum}</div>
                    <label className={chkLabel} title="Include this day in the sequence">
                      <input
                        type="checkbox"
                        checked={!!d.enabled}
                        onChange={(e) => setDay(i, { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-bold uppercase text-purple-700">Subject</div>
                      <input
                        className={input}
                        placeholder="Subject for Day X"
                        value={d.subject}
                        onChange={(e) => setDay(i, { subject: e.target.value })}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-bold uppercase text-purple-700">Message</div>
                      <textarea
                        className={`${input} min-h-[120px]`}
                        placeholder="Short message for Day X"
                        value={d.message}
                        onChange={(e) => setDay(i, { message: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="text-xs text-foreground/70">
        Tip: open Nurture for a specific client bot instance via
        <code className="mx-1 px-1 rounded bg-muted/40">/admin/nurture?inst=&lt;INSTANCE_ID&gt;</code>.
        You can surface this from your Bots page with a “Nurture” button on each card if you like.
      </div>
    </div>
  );
}
