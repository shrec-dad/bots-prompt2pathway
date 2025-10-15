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
    // ensure array length is normalized
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
 * Starter sequences (Lead Qualifier & Waitlist)
 * - Universal placeholders you can tweak per client:
 *   {{name}}, {{company}}, {{inst_name}}, {{product}}, {{booking_link}},
 *   {{contact_email}}, {{phone}}, {{cta_link}}
 * - All days default to enabled for an easy start.
 * ───────────────────────────────────────────────────────────────────────────*/

function seqLeadQualifier(): Day[] {
  return [
    {
      enabled: true,
      subject: "👋 Quick hello from {{company}} — next steps inside",
      body: `Hi {{name}},\n\nThanks for reaching out to {{company}}! 🎉\nBased on your inquiry, I put together the next steps so you can see value quickly.\n\n**What to expect**\n• 20–30 min call to align on goals\n• A sample plan tailored to your use case\n• Clear pricing + timeline\n\nReady to grab a time? 👉 {{booking_link}}\n\nIf you prefer email, just reply here or reach us at {{contact_email}}.\n\n— {{inst_name}} Team`
    },
    {
      enabled: true,
      subject: "✅ Your goals from our intake (quick recap)",
      body: `Hi {{name}},\n\nFrom your notes, it sounds like you're aiming to:\n1) Solve {{painpoint or key goal}}\n2) Stay within a budget range that makes sense\n3) Move quickly without surprises\n\nWe do this often for teams like yours at {{company}}. Want me to pencil in a time? ✍️\nBook here → {{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "📅 2 slots left this week — want one?",
      body: `Hi {{name}},\n\nHeads up: we have **two** open slots left this week for quick consults.\n• Wed 11:00 AM\n• Thu 2:30 PM\n\nIf either works, lock it in here → {{booking_link}}\n\nPrefer another time? Reply with a few windows. We’ll accommodate.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "💡 Example outcome we recently delivered",
      body: `Hi {{name}},\n\nSharing a quick example:\n> “Within 14 days we increased qualified leads by 36% and cut response time by 58%.”\n\nWe’d love to map this to {{company}}. Even 20 minutes helps clarify ROI.\nGrab a slot → {{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "✨ 3 reasons teams pick us (short list)",
      body: `Hi {{name}},\n\n1) Speed — time-to-value in days, not months\n2) Clarity — simple pricing, no surprises\n3) Results — measurable outcomes you can show your team\n\nIf that’s what you’re after, let’s connect:\n{{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "🧭 Roadmap preview (so you know what happens)",
      body: `Hi {{name}},\n\nOur typical flow:\n• Discovery (20–30 mins)\n• Quick plan + estimate\n• Build + iterate (fast feedback)\n• Launch + measure 📈\n\nIf that works, I’ll send a calendar invite. Here’s my calendar:\n{{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "Still interested? Here’s a 1-page overview 📄",
      body: `Hi {{name}},\n\nAttaching our simple 1-pager (what we do and how we help teams like {{company}}).\n[Paste your 1-pager link or keep as is]\n\nIf you’d like a walkthrough, pick any time here:\n{{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "⚡ Quick win ideas for {{company}}",
      body: `Hi {{name}},\n\nHere are 3 quick win ideas we’ve seen work for similar teams:\n1) [Idea #1]\n2) [Idea #2]\n3) [Idea #3]\n\nWant me to tailor these to {{company}}? 15 mins is enough.\n{{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "Heads-up: pricing window this month 🗓️",
      body: `Hi {{name}},\n\nWe’re keeping current pricing through the end of this month. If you want to lock it in, I recommend a quick call.\n\nSave a spot → {{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "✨ Realistic timeline & milestone plan (sample)",
      body: `Hi {{name}},\n\nTypical milestone flow looks like:\n• Week 1: Setup + alignment\n• Week 2: First wins\n• Week 3–4: Iterate + expand\n\nIf you’re on board, I’ll tailor a plan for {{company}}.\nBook here → {{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "Common questions (quick answers inside) ❓",
      body: `Hi {{name}},\n\n**Q: How long does onboarding take?**\nA: Usually under a week to first results.\n\n**Q: Is this locked-in?**\nA: No — simple, transparent terms.\n\n**Q: Can we start small?**\nA: Absolutely. We prefer phased rollouts.\n\nNext step if you’re curious:\n{{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "Friendly nudge: want me to keep a slot for you?",
      body: `Hi {{name}},\n\nNo rush — happy to keep a slot this week if helpful.\nGrab it here: {{booking_link}}\n\nIf email is easier, reply with a couple of windows and I’ll send an invite.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "Last call this round — should I pause follow-ups? ⏸️",
      body: `Hi {{name}},\n\nIf now isn’t the right time, I can pause follow-ups for a month. Just say the word.\n\nIf you do want to chat, here’s the fastest way:\n{{booking_link}}\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "Thanks for considering us 🙏 (keep this handy)",
      body: `Hi {{name}},\n\nAppreciate you considering {{company}}.\nKeeping this here for when timing fits:\n• Book: {{booking_link}}\n• Email: {{contact_email}}\n• Phone: {{phone}}\n\nI’m around if/when you’re ready.\n\n— {{inst_name}}`
    }
  ];
}

function seqWaitlist(): Day[] {
  return [
    {
      enabled: true,
      subject: "🎉 You’re on the waitlist! What happens next…",
      body: `Hi {{name}},\n\nYou’re officially on the list for **{{product}}** — love having you here! 🙌\n\n**What to expect**\n• Early updates + previews\n• Priority access when spots open\n• Sweet launch perks for early supporters\n\nYou can reply to this email anytime with questions.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "👀 Sneak peek of {{product}}",
      body: `Hi {{name}},\n\nHere’s a quick look at what we’re building:\n• Core idea: [1-line value]\n• Who it’s for: [persona]\n• Why it’s different: [edge]\n\nGot feedback? Hit reply — we’re listening.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "💌 Tell us your top use case",
      body: `Hi {{name}},\n\nWhat would make {{product}} a **must-have** for you?\nReply with 1–2 lines. The best insights often come from real workflows.\n\n(We reply to every note.)\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "🤫 Early mockups (rough, but real)",
      body: `Hi {{name}},\n\nSharing a few early mockups. Nothing fancy yet — just honest progress.\n[Link or remove]\n\nIf you want to be part of private beta, reply **BETA** and we’ll prioritize you.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "🧭 Roadmap: what’s shipping soon",
      body: `Hi {{name}},\n\nUpcoming milestones for {{product}}:\n• v0.1: Core feature working end-to-end\n• v0.2: Onboarding + basic analytics\n• v0.3: Integrations & polish\n\nWant early access? Reply with **EARLY**.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "📣 We’re adding a few early testers",
      body: `Hi {{name}},\n\nWe’re inviting a *limited* group for early testing this month.\nIf interested, reply with your main goal and we’ll slot you in if there’s a fit.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "📋 Quick survey (1 minute, promise)",
      body: `Hi {{name}},\n\nMind sharing a bit about your workflow? It helps us ship the right thing.\n[Link to a short form] or just hit reply with your top 2 must-haves.\n\nThank you!\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "⚡ Mini update: progress + what’s next",
      body: `Hi {{name}},\n\nProgress this week:\n• Finished [X]\n• Testing [Y]\n• Next: [Z]\n\nWe’re getting closer. Thanks for being here!\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "🎁 Early supporter perks (because you’re awesome)",
      body: `Hi {{name}},\n\nWe’re planning perks for early supporters:\n• Founding member pricing\n• Access to private roadmap\n• Vote on upcoming features\n\nInterested? Reply **PERKS**.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "⏱️ Timeline check",
      body: `Hi {{name}},\n\nQuick update: we’re tracking well and still aiming for early access soon.\nWant me to put you on the first-invite list? Reply **FIRST**.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "👋 Want a personal walkthrough when ready?",
      body: `Hi {{name}},\n\nWhen {{product}} is ready, would a 10-minute walkthrough help?\nIf yes, reply **WALKTHROUGH** and we’ll set you up on launch week.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "⭐ Feature spotlight: something you’ll love",
      body: `Hi {{name}},\n\nWe’re polishing a feature we think you’ll love:\n[Feature summary]\n\nIf this solves a headache for you, reply and tell us how you do it today.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "🧪 Final checks before invites go out",
      body: `Hi {{name}},\n\nWe’re in the final checks stage.\nWant to be in the first wave of invites? Reply **INVITE ME**.\n\n— {{inst_name}}`
    },
    {
      enabled: true,
      subject: "🎉 You’re on our first-invite list",
      body: `Hi {{name}},\n\nThanks for sticking with us on this journey.\nYou’re on our first-invite list. Keep an eye on your inbox — it’s nearly time.\n\nP.S. If you ever need anything, write us at {{contact_email}}.\n\n— {{inst_name}}`
    }
  ];
}

/** Detect sequence by instance.bot key */
function getStarterSequenceFor(botKey?: string | null): Day[] | null {
  switch (botKey) {
    case "LeadQualifier":
      return seqLeadQualifier();
    case "Waitlist":
      return seqWaitlist();
    default:
      return null;
  }
}

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

    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subj
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  /** Load Starter Sequence (detects instance.bot as LeadQualifier or Waitlist) */
  function loadStarter() {
    if (!instId) {
      alert("Pick a Client Bot (instance) first.");
      return;
    }
    const botKey = selectedInst?.bot || null;
    const seq = getStarterSequenceFor(botKey);
    if (!seq) {
      alert(
        `No starter sequence found for this bot type.\nSupported: LeadQualifier, Waitlist.\nSelected bot: ${botKey || "(unknown)"}`
      );
      return;
    }
    const ok = confirm(
      "Load the 14-day starter sequence for this bot?\n\nThis will replace your current messages for this instance."
    );
    if (!ok) return;
    setDays(seq);
    saveDays(instId, seq);
    alert("Starter sequence loaded and saved.");
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
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-fuchsia-500/20 to-sky-500/20 hover:from-fuchsia-500/30 hover:to-sky-500/30"
              onClick={loadStarter}
            >
              Load Starter Sequence
            </button>

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

