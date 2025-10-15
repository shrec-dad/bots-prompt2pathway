// src/pages/admin/Nurture.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listInstances, type InstanceMeta } from "@/lib/instances";

/** ───────────────────────────────────────────────────────────────────────────
 * Storage model (unchanged + small additions)
 * Per-instance schedule:
 *   localStorage["nurture:inst:<id>"] = Day[]  // normalized to 14 slots
 * Per-instance length preference (UI only):
 *   localStorage["nurture:length:inst:<id>"] = "7" | "14"
 * NEW: Per-instance delivery settings (UI only, provider-agnostic):
 *   localStorage["nurture:delivery:inst:<id>"] = DeliverySettings
 * NEW: Per-instance preview options (unsubscribe/tracking toggles):
 *   localStorage["nurture:previewopts:inst:<id>"] = PreviewOptions
 * ───────────────────────────────────────────────────────────────────────────*/

type Day = { enabled: boolean; subject: string; body: string };
const DAY_COUNT = 14;

type Provider =
  | "sendgrid"
  | "mailgun"
  | "ses"
  | "gmail"
  | "smtp"
  | null;

type DeliverySettings = {
  provider: Provider;               // chosen provider (UI-only)
  integrationAccountId: string | null; // filled by backend later; null for now
  fromName: string;
  fromEmail: string;
  replyTo: string;
  tagPrefix: string;
};

type PreviewOptions = {
  addUnsubscribeFooter: boolean;
  addTrackingPixelHint: boolean; // visual hint only
};

const keyForInst = (instId: string) => `nurture:inst:${instId}`;
const keyLenForInst = (instId: string) => `nurture:length:inst:${instId}`;
const keyDeliveryForInst = (instId: string) => `nurture:delivery:inst:${instId}`;
const keyPreviewOptsForInst = (instId: string) => `nurture:previewopts:inst:${instId}`;

const blankDay = (): Day => ({ enabled: false, subject: "", body: "" });

function loadDays(instId: string): Day[] {
  try {
    const raw = localStorage.getItem(keyForInst(instId));
    if (!raw) return Array.from({ length: DAY_COUNT }, () => blankDay());
    const parsed = JSON.parse(raw) as Day[];
    return Array.from({ length: DAY_COUNT }, (_, i) => parsed[i] ?? blankDay());
  } catch {
    return Array.from({ length: DAY_COUNT }, () => blankDay());
  }
}

function saveDays(instId: string, days: Day[]) {
  const normalized = Array.from({ length: DAY_COUNT }, (_, i) => days[i] ?? blankDay());
  localStorage.setItem(keyForInst(instId), JSON.stringify(normalized));
}

function loadDelivery(instId: string, fallbackName: string, fallbackTag: string): DeliverySettings {
  try {
    const raw = localStorage.getItem(keyDeliveryForInst(instId));
    if (raw) return JSON.parse(raw) as DeliverySettings;
  } catch {}
  return {
    provider: null,
    integrationAccountId: null,
    fromName: fallbackName,
    fromEmail: "",
    replyTo: "",
    tagPrefix: fallbackTag,
  };
}

function saveDelivery(instId: string, d: DeliverySettings) {
  localStorage.setItem(keyDeliveryForInst(instId), JSON.stringify(d));
}

function loadPreviewOpts(instId: string): PreviewOptions {
  try {
    const raw = localStorage.getItem(keyPreviewOptsForInst(instId));
    if (raw) return JSON.parse(raw) as PreviewOptions;
  } catch {}
  return {
    addUnsubscribeFooter: false,
    addTrackingPixelHint: false,
  };
}

function savePreviewOpts(instId: string, p: PreviewOptions) {
  localStorage.setItem(keyPreviewOptsForInst(instId), JSON.stringify(p));
}

/** ───────────────────────────────────────────────────────────────────────────
 * Starter sequences (Lead Qualifier & Waitlist) — unchanged
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
 * Helpers for UI / Preview
 * ───────────────────────────────────────────────────────────────────────────*/

const input =
  "w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-[15px] font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent";

type PreviewContext = {
  name: string;
  company: string;
  inst_name: string;
  product: string;
  booking_link: string;
  contact_email: string;
  phone: string;
};

function applyPlaceholders(text: string, ctx: PreviewContext) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const k = key as keyof PreviewContext;
    // @ts-expect-error safe lookup
    return (ctx[k] as string) ?? `{{${key}}}`;
  });
}

function Block({
  index,
  value,
  onChange,
  onFocus,
}: {
  index: number;
  value: Day;
  onChange: (d: Day) => void;
  onFocus?: () => void;
}) {
  return (
    <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
      {/* Header stripe */}
      <div className="h-2 rounded-md bg-black mb-4" />
      <div className="flex items-center justify-between">
        <div className="text-[28px] font-black text-purple-900">Day {index + 1}</div>
        <label className="inline-flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            onFocus={onFocus}
          />
          Enabled
        </label>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Subject</div>
        <input
          className={input}
          value={value.subject}
          placeholder="Subject for Day X"
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          onFocus={onFocus}
        />
      </div>

      <div className="mt-3">
        <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Message</div>
        <textarea
          className={input}
          rows={5}
          placeholder="Short message for Day X"
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          onFocus={onFocus}
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

  // schedule model (always 14 in storage)
  const [days, setDays] = useState<Day[]>(
    instFromUrl ? loadDays(instFromUrl) : Array.from({ length: DAY_COUNT }, () => blankDay())
  );

  // length setting UI preference per instance
  const [lengthSetting, setLengthSetting] = useState<"7" | "14">("14");

  // which day shows in preview
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // live preview context (editable)
  const [previewCtx, setPreviewCtx] = useState<PreviewContext>({
    name: "Jessica",
    company: "Your Company",
    inst_name: instFromUrl || "Lead Qualifier",
    product: "Your Product",
    booking_link: "https://example.com/book",
    contact_email: "info@example.com",
    phone: "(804) 555-0199",
  });

  // delivery settings drawer state
  const [showDelivery, setShowDelivery] = useState<boolean>(false);
  const [delivery, setDelivery] = useState<DeliverySettings>(() =>
    loadDelivery(instFromUrl, "Sender", instFromUrl || "campaign")
  );
  const [previewOpts, setPreviewOpts] = useState<PreviewOptions>(() =>
    loadPreviewOpts(instFromUrl)
  );

  // reload when instance changes
  useEffect(() => {
    if (!instId) return;
    setDays(loadDays(instId));

    const savedLen = (localStorage.getItem(keyLenForInst(instId)) as "7" | "14") || "14";
    setLengthSetting(savedLen);

    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set("inst", instId);
      return next;
    });

    const instMeta = instances.find((x) => x.id === instId);
    setPreviewCtx((prev) => ({
      ...prev,
      inst_name: instMeta?.bot || instId,
      company: instMeta?.name || prev.company,
    }));

    setDelivery(loadDelivery(instId, instMeta?.name || "Sender", instId || "campaign"));
    setPreviewOpts(loadPreviewOpts(instId));

    setFocusedIndex(0);
  }, [instId, setSearch, instances]);

  // persist length preference when it changes
  useEffect(() => {
    if (!instId) return;
    localStorage.setItem(keyLenForInst(instId), lengthSetting);
  }, [instId, lengthSetting]);

  // persist delivery + preview opts when they change
  useEffect(() => {
    if (!instId) return;
    saveDelivery(instId, delivery);
  }, [instId, delivery]);

  useEffect(() => {
    if (!instId) return;
    savePreviewOpts(instId, previewOpts);
  }, [instId, previewOpts]);

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
    localStorage.setItem(keyLenForInst(targetId), lengthSetting);
    localStorage.setItem(keyDeliveryForInst(targetId), JSON.stringify(delivery));
    localStorage.setItem(keyPreviewOptsForInst(targetId), JSON.stringify(previewOpts));
    window.location.href = `/admin/nurture?inst=${encodeURIComponent(targetId)}`;
  }

  function sendTestEmail() {
    if (!instId) {
      alert("Pick a Client Bot (instance) first.");
      return;
    }
    const to = prompt("Send test to (email address):", "you@example.com");
    if (!to) return;

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
        .slice(0, 3)
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
    setLengthSetting("14");
    localStorage.setItem(keyLenForInst(instId), "14");
    alert("Starter sequence loaded and saved.");
  }

  /** Toggle between 7 and 14 without destroying data (hide 8–14 in UI) */
  function setLen(newLen: "7" | "14") {
    if (!instId) {
      alert("Pick a Client Bot (instance) first.");
      return;
    }
    setLengthSetting(newLen);
    localStorage.setItem(keyLenForInst(instId), newLen);
  }

  /** Export current visible schedule as basic JSON (kept from prior version) */
  function exportJSON() {
    const visible = lengthSetting === "7" ? days.slice(0, 7) : days.slice(0, 14);
    const payload = {
      instance: instId,
      length: visible.length,
      schedule: visible,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = `nurture_${instId || "instance"}_${visible.length}d_${new Date()
      .toISOString()
      .slice(0, 10)}`;
    a.href = url;
    a.download = `${base}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** NEW: Export backend-ready JSON (includes delivery + placeholders + full 14 slots) */
  function exportBackendJSON() {
    const payload = {
      instanceId: instId,
      delivery: {
        integrationAccountId: delivery.integrationAccountId, // null until real connection
        provider: delivery.provider,                         // "sendgrid" | "mailgun" | "ses" | "gmail" | "smtp" | null
        fromName: delivery.fromName,
        fromEmail: delivery.fromEmail,
        replyTo: delivery.replyTo || delivery.fromEmail || "",
        tagPrefix: delivery.tagPrefix,
      },
      sequence: Array.from({ length: 14 }, (_, i) => days[i] ?? blankDay()),
      placeholders: { ...previewCtx },
      length: lengthSetting === "7" ? 7 : 14,
      exportedAt: new Date().toISOString(),
      previewOptions: { ...previewOpts }, // so backend can optionally mirror footer behavior
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = `nurture_backend_${instId || "instance"}_${payload.length}d_${new Date()
      .toISOString()
      .slice(0, 10)}`;
    a.href = url;
    a.download = `${base}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  function importClick() {
    if (!instId) {
      alert("Pick a Client Bot (instance) first.");
      return;
    }
    fileInputRef.current?.click();
  }

  function isValidDay(d: any): d is Day {
    return (
      d &&
      typeof d === "object" &&
      typeof d.enabled === "boolean" &&
      typeof d.subject === "string" &&
      typeof d.body === "string"
    );
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.schedule) || !parsed.schedule.every(isValidDay)) {
        alert("Invalid JSON. Expecting { schedule: Day[] } with enabled/subject/body.");
        return;
      }
      const incoming: Day[] = parsed.schedule.slice(0, 14);
      const next = Array.from({ length: 14 }, (_, i) => incoming[i] ?? blankDay());
      setDays(next);
      saveDays(instId, next);
      const newLen: "7" | "14" = incoming.length <= 7 ? "7" : "14";
      setLengthSetting(newLen);
      localStorage.setItem(keyLenForInst(instId), newLen);
      alert("Imported schedule applied and saved.");
    } catch {
      alert("Could not read JSON file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // derived
  const visibleDays = lengthSetting === "7" ? days.slice(0, 7) : days;
  const selectedInstMeta = useMemo(
    () => instances.find((m) => m.id === instId),
    [instances, instId]
  );

  const previewDay: Day | null =
    visibleDays[focusedIndex] ??
    visibleDays.find((d) => d.enabled) ??
    visibleDays[0] ??
    null;

  // Render preview subject/body, with optional unsubscribe footer (preview only)
  const renderedSubject = previewDay ? applyPlaceholders(previewDay.subject || "", previewCtx) : "";
  let renderedBody = previewDay ? applyPlaceholders(previewDay.body || "", previewCtx) : "";
  if (previewOpts.addUnsubscribeFooter) {
    const footer =
      `\n\n—\nYou’re receiving this because you engaged with {{company}}.\n` +
      `Unsubscribe: {{unsubscribe_link}}`;
    renderedBody += "\n" + applyPlaceholders(footer, {
      ...previewCtx,
      // @ts-ignore (allow placeholder)
      unsubscribe_link: "https://example.com/unsubscribe",
    } as any);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight whitespace-nowrap">
              Nurture (Day 1–14)
            </h1>
            <p className="text-sm text-foreground/70">
              Provider-agnostic editor. Keep sequences independent; connect or change ESPs anytime.
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

            {/* NEW: Delivery Settings */}
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-black bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100"
              onClick={() => {
                if (!instId) {
                  alert("Pick a Client Bot (instance) first.");
                  return;
                }
                setShowDelivery(true);
              }}
              title="Per-instance sender & provider (UI-only). Providers are managed on Integrations."
            >
              Delivery Settings
            </button>
          </div>
        </div>

        {/* Controls row for Length + Import/Export */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground/70">Length</span>
            <button
              onClick={() => setLen("7")}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ${
                lengthSetting === "7"
                  ? "bg-yellow-100 ring-black"
                  : "bg-gray-50 ring-gray-300 hover:bg-gray-100"
              }`}
              title="Show days 1–7 (keeps 8–14 saved in background)"
            >
              7 days
            </button>
            <button
              onClick={() => setLen("14")}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ${
                lengthSetting === "14"
                  ? "bg-green-100 ring-black"
                  : "bg-gray-50 ring-gray-300 hover:bg-gray-100"
              }`}
              title="Show all 14 days"
            >
              14 days
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportJSON}
              className="rounded-xl px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100"
              title="Download current schedule as JSON"
            >
              Export JSON
            </button>
            <button
              onClick={importClick}
              className="rounded-xl px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100"
              title="Import schedule JSON"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onImportFile}
            />

            {/* NEW: Export Backend */}
            <button
              onClick={exportBackendJSON}
              className="rounded-xl px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
              title="Export backend-ready payload (delivery + placeholders + 14-slot sequence)"
            >
              Export for Backend (.json)
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Readiness Checklist (non-blocking) */}
      <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between mb-2">
          <div className="text-[22px] font-black text-purple-900">Readiness Checklist</div>
          <a
            className="text-sm font-bold underline"
            href="/admin/integrations"
            title="Manage providers and accounts"
          >
            Manage on Integrations →
          </a>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <li className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
            <div className="font-extrabold text-purple-700 mb-1">Provider connected?</div>
            <div>
              {delivery.provider && delivery.integrationAccountId
                ? `Connected: ${delivery.provider.toUpperCase()}`
                : "Not connected — connect on Integrations"}
            </div>
          </li>
          <li className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
            <div className="font-extrabold text-purple-700 mb-1">From email set?</div>
            <div>{delivery.fromEmail ? delivery.fromEmail : "Add a sender in Delivery Settings"}</div>
          </li>
          <li className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
            <div className="font-extrabold text-purple-700 mb-1">Unsubscribe footer?</div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={previewOpts.addUnsubscribeFooter}
                onChange={(e) =>
                  setPreviewOpts((p) => ({ ...p, addUnsubscribeFooter: e.target.checked }))
                }
              />
              Preview-only footer in rendered body
            </label>
          </li>
        </ul>
        <div className="mt-3 text-xs text-gray-600">
          Note: Domain verification & tracking pixel support depend on the connected provider and will
          be displayed after Integrations are wired. Toggle above is preview-only.
        </div>
      </div>

      {/* Main content: Grid + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Grid of days */}
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visibleDays.map((d, i) => (
              <Block
                key={i}
                index={i}
                value={d}
                onChange={(next) =>
                  setDays((prev) => {
                    const out = [...prev];
                    out[i] = next; // i aligns with visible index for 7 or 14
                    return out;
                  })
                }
                onFocus={() => setFocusedIndex(i)}
              />
            ))}
          </div>
        </div>

        {/* Live Preview panel */}
        <div className="xl:col-span-1">
          <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
            <div className="h-2 rounded-md bg-black mb-4" />
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[22px] font-black text-purple-900">
                Live Preview
              </div>
              <div className="text-xs font-bold text-purple-700">
                Day {Math.min(focusedIndex + 1, visibleDays.length)}
              </div>
            </div>

            {/* Preview Context */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 mb-4">
              <div className="text-xs font-extrabold uppercase text-purple-700 mb-2">
                Preview Context
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    ["name", "Jessica"],
                    ["company", selectedInst?.name || "Your Company"],
                    ["inst_name", selectedInst?.bot || instId || "Lead Qualifier"],
                    ["product", "Your Product"],
                    ["booking_link", "https://example.com/book"],
                    ["contact_email", "info@example.com"],
                    ["phone", "(804) 555-0199"],
                  ] as Array<[keyof PreviewContext, string]>
                ).map(([k, placeholder]) => (
                  <input
                    key={k}
                    className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-sm"
                    placeholder={placeholder}
                    value={previewCtx[k]}
                    onChange={(e) => setPreviewCtx((prev) => ({ ...prev, [k]: e.target.value }))}
                  />
                ))}
              </div>
            </div>

            {/* Rendered subject/body */}
            <div className="rounded-xl border border-purple-200 bg-white p-3">
              <div className="text-xs font-extrabold uppercase text-purple-700 mb-1">
                Subject (rendered)
              </div>
              <div className="rounded-md border border-purple-200 bg-purple-50/40 p-2 text-[15px] font-semibold">
                {renderedSubject || <span className="text-gray-400">(empty)</span>}
              </div>

              <div className="mt-3 text-xs font-extrabold uppercase text-purple-700 mb-1">
                Body (rendered)
              </div>
              <div className="rounded-md border border-purple-200 bg-purple-50/40 p-2 whitespace-pre-wrap text-[15px] font-semibold">
                {renderedBody || <span className="text-gray-400">(empty)</span>}
              </div>
            </div>

            <div className="mt-3 text-[12px] text-gray-600">
              Tip: Unknown placeholders (e.g., <code>{"{{unknown}}"}</code>) are shown as-is so you
              can spot and fix them before exporting.
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Settings Drawer (UI-only) */}
      {showDelivery && (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDelivery(false)}
          />
          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l-2 border-black/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.0)]">
            <div className="p-5 border-b-2 border-black/80 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="text-xl font-black">Delivery Settings (UI-only)</div>
              <div className="text-xs text-gray-600">
                Choose a provider and sender for this instance. Providers are connected on{" "}
                <a className="underline font-semibold" href="/admin/integrations">Integrations</a>.
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Provider row */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-extrabold">Delivery Provider</div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 border">
                    {delivery.provider
                      ? (delivery.integrationAccountId
                          ? `Connected: ${delivery.provider.toUpperCase()}`
                          : `Selected (local): ${delivery.provider.toUpperCase()}`)
                      : "Not connected"}
                  </span>
                </div>
                <select
                  className="w-full rounded-lg border px-3 py-2 font-semibold bg-white"
                  value={delivery.provider || ""}
                  onChange={(e) =>
                    setDelivery((d) => ({
                      ...d,
                      provider: (e.target.value || null) as Provider,
                    }))
                  }
                >
                  <option value="">Select provider (universal)</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">AWS SES</option>
                  <option value="gmail">Gmail / Google Workspace</option>
                  <option value="smtp">Generic SMTP</option>
                </select>
                <div className="mt-2 text-xs text-gray-600">
                  This selection is stored locally until your Integrations backend links an account.
                </div>
                <div className="mt-3">
                  <a className="text-sm font-bold underline" href="/admin/integrations">
                    Manage on Integrations →
                  </a>
                </div>
              </div>

              {/* Sender block */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Sender</div>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    className="rounded-lg border px-3 py-2 font-semibold"
                    placeholder="From Name"
                    value={delivery.fromName}
                    onChange={(e) => setDelivery((d) => ({ ...d, fromName: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border px-3 py-2 font-semibold"
                    placeholder="From Email"
                    value={delivery.fromEmail}
                    onChange={(e) => setDelivery((d) => ({ ...d, fromEmail: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border px-3 py-2 font-semibold"
                    placeholder="Reply-To (optional)"
                    value={delivery.replyTo}
                    onChange={(e) => setDelivery((d) => ({ ...d, replyTo: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border px-3 py-2 font-semibold"
                    placeholder="Tag Prefix (e.g., instance id)"
                    value={delivery.tagPrefix}
                    onChange={(e) => setDelivery((d) => ({ ...d, tagPrefix: e.target.value }))}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  These values are per instance. Your backend can validate domains & policy later.
                </div>
              </div>

              {/* Actions (preview-only) */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Actions</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="rounded-lg px-3 py-2 font-bold ring-1 ring-gray-300 bg-gray-100 cursor-not-allowed"
                    title="Connect a provider on Integrations to enable sending"
                    disabled
                  >
                    Send via ESP (coming soon)
                  </button>
                  <button
                    className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white"
                    onClick={() => {
                      saveDelivery(instId, delivery);
                      savePreviewOpts(instId, previewOpts);
                      alert("Delivery settings saved locally for this instance.");
                    }}
                  >
                    Save Settings
                  </button>
                  <button
                    className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white"
                    onClick={() => setShowDelivery(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  Once the backend is ready, this button will send through the selected provider with
                  the instance’s sender details — without locking you to any single ESP.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
