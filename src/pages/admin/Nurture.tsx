// src/pages/admin/Nurture.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { listInstances, type InstanceMeta } from "@/lib/instances";
import RecipientsManager from "@/components/RecipientsManager";
import type { Recipient, ChannelType, Campaign } from "@/types/nurture-types";

/** ───────────────────────────────────────────────────────────────────────────
 * Storage model (existing + NEW recipient/campaign keys)
 * ───────────────────────────────────────────────────────────────────────────*/

type Day = { enabled: boolean; subject: string; body: string };
const DAY_COUNT = 14;

type Provider = "sendgrid" | "mailgun" | "ses" | "gmail" | "smtp" | null;

type DeliverySettings = {
  provider: Provider;
  integrationAccountId: string | null;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  tagPrefix: string;
  defaultTime: string;
};

type PreviewOptions = {
  addUnsubscribeFooter: boolean;
  addTrackingPixelHint: boolean;
};

type WindowRange = { start: string; end: string };

type QuietHours = {
  enabled: boolean;
  start: string;
  end: string;
};

type ScheduleMode = "relative" | "calendar";

// NEW: Per-day channel configuration
type DayChannel = {
  channel: ChannelType;
  smsBody?: string; // SMS-specific body (shorter)
};

const keyForInst = (instId: string) => `nurture:inst:${instId}`;
const keyLenForInst = (instId: string) => `nurture:length:inst:${instId}`;
const keyDeliveryForInst = (instId: string) => `nurture:delivery:inst:${instId}`;
const keyPreviewOptsForInst = (instId: string) => `nurture:previewopts:inst:${instId}`;
const keyTimesForInst = (instId: string) => `nurture:sendtimes:inst:${instId}`;
const keyWindowsForInst = (instId: string) => `nurture:sendwindows:inst:${instId}`;
const keyModeForInst = (instId: string) => `nurture:schedulemode:inst:${instId}`;
const keyDatesForInst = (instId: string) => `nurture:dates:inst:${instId}`;
const keyTzForInst = (instId: string) => `nurture:timezone:inst:${instId}`;
const keyQuietForInst = (instId: string) => `nurture:quiet:inst:${instId}`;

// NEW: Recipients and channels
const keyRecipientsForInst = (instId: string) => `nurture:recipients:inst:${instId}`;
const keyChannelsForInst = (instId: string) => `nurture:channels:inst:${instId}`;
const keyCampaignsForInst = (instId: string) => `nurture:campaigns:inst:${instId}`;

const blankDay = (): Day => ({ enabled: false, subject: "", body: "" });

/** Utils */
const ensure14 = <T,>(arr: T[], filler: () => T) =>
  Array.from({ length: DAY_COUNT }, (_, i) => arr[i] ?? filler());

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const defaultTime = "09:00";
const defaultWindow: WindowRange = { start: "08:00", end: "20:00" };

function loadDays(instId: string): Day[] {
  try {
    const raw = localStorage.getItem(keyForInst(instId));
    if (!raw) return Array.from({ length: DAY_COUNT }, blankDay);
    return ensure14(JSON.parse(raw) as Day[], blankDay);
  } catch {
    return Array.from({ length: DAY_COUNT }, blankDay);
  }
}
function saveDays(instId: string, days: Day[]) {
  localStorage.setItem(keyForInst(instId), JSON.stringify(ensure14(days, blankDay)));
}

function loadDelivery(instId: string, fallbackName: string, fallbackTag: string): DeliverySettings {
  try {
    const raw = localStorage.getItem(keyDeliveryForInst(instId));
    if (raw) return JSON.parse(raw) as DeliverySettings;
  } catch {}
  return {
    provider: null,
    integrationAccountId: null,
    fromName: fallbackName || "Sender",
    fromEmail: "",
    replyTo: "",
    tagPrefix: fallbackTag || "campaign",
    defaultTime,
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
  return { addUnsubscribeFooter: false, addTrackingPixelHint: false };
}
function savePreviewOpts(instId: string, p: PreviewOptions) {
  localStorage.setItem(keyPreviewOptsForInst(instId), JSON.stringify(p));
}

function loadTimes(instId: string): string[] {
  try {
    const raw = localStorage.getItem(keyTimesForInst(instId));
    if (raw) return ensure14(JSON.parse(raw) as string[], () => defaultTime);
  } catch {}
  return Array.from({ length: DAY_COUNT }, () => defaultTime);
}
function saveTimes(instId: string, times: string[]) {
  localStorage.setItem(keyTimesForInst(instId), JSON.stringify(ensure14(times, () => defaultTime)));
}

function loadWindows(instId: string): (WindowRange | null)[] {
  try {
    const raw = localStorage.getItem(keyWindowsForInst(instId));
    if (raw) {
      const arr = JSON.parse(raw) as (WindowRange | null)[];
      return ensure14(arr, () => null);
    }
  } catch {}
  return Array.from({ length: DAY_COUNT }, () => null);
}
function saveWindows(instId: string, wins: (WindowRange | null)[]) {
  localStorage.setItem(keyWindowsForInst(instId), JSON.stringify(ensure14(wins, () => null)));
}

function loadMode(instId: string): ScheduleMode {
  try {
    const raw = localStorage.getItem(keyModeForInst(instId)) as ScheduleMode | null;
    if (raw === "relative" || raw === "calendar") return raw;
  } catch {}
  return "relative";
}
function saveMode(instId: string, mode: ScheduleMode) {
  localStorage.setItem(keyModeForInst(instId), mode);
}

function loadDates(instId: string): string[] {
  try {
    const raw = localStorage.getItem(keyDatesForInst(instId));
    if (raw) return ensure14(JSON.parse(raw) as string[], () => "");
  } catch {}
  return Array.from({ length: DAY_COUNT }, () => "");
}
function saveDates(instId: string, dates: string[]) {
  localStorage.setItem(keyDatesForInst(instId), JSON.stringify(ensure14(dates, () => "")));
}

function loadTimezone(instId: string): string {
  try {
    const raw = localStorage.getItem(keyTzForInst(instId));
    if (raw) return raw;
  } catch {}
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}
function saveTimezone(instId: string, tz: string) {
  localStorage.setItem(keyTzForInst(instId), tz);
}

function loadQuietHours(instId: string): QuietHours {
  try {
    const raw = localStorage.getItem(keyQuietForInst(instId));
    if (raw) return JSON.parse(raw) as QuietHours;
  } catch {}
  return { enabled: false, start: defaultWindow.start, end: defaultWindow.end };
}
function saveQuietHours(instId: string, q: QuietHours) {
  localStorage.setItem(keyQuietForInst(instId), JSON.stringify(q));
}

// NEW: Recipients
function loadRecipients(instId: string): Recipient[] {
  try {
    const raw = localStorage.getItem(keyRecipientsForInst(instId));
    if (raw) return JSON.parse(raw) as Recipient[];
  } catch {}
  return [];
}
function saveRecipients(instId: string, recipients: Recipient[]) {
  localStorage.setItem(keyRecipientsForInst(instId), JSON.stringify(recipients));
}

// NEW: Channels (per-day)
function loadChannels(instId: string): DayChannel[] {
  try {
    const raw = localStorage.getItem(keyChannelsForInst(instId));
    if (raw) return ensure14(JSON.parse(raw) as DayChannel[], () => ({ channel: "email" }));
  } catch {}
  return Array.from({ length: DAY_COUNT }, () => ({ channel: "email" as ChannelType }));
}
function saveChannels(instId: string, channels: DayChannel[]) {
  localStorage.setItem(
    keyChannelsForInst(instId),
    JSON.stringify(ensure14(channels, () => ({ channel: "email" })))
  );
}

// NEW: Campaigns
function loadCampaigns(instId: string): Campaign[] {
  try {
    const raw = localStorage.getItem(keyCampaignsForInst(instId));
    if (raw) return JSON.parse(raw) as Campaign[];
  } catch {}
  return [];
}
function saveCampaigns(instId: string, campaigns: Campaign[]) {
  localStorage.setItem(keyCampaignsForInst(instId), JSON.stringify(campaigns));
}

/** ───────────────────────────────────────────────────────────────────────────
 * Starter sequences (unchanged)
 * ───────────────────────────────────────────────────────────────────────────*/

function seqLeadQualifier(): Day[] {
  return [
    { enabled: true, subject: "👋 Quick hello from {{company}} — next steps inside", body: `Hi {{name}},\n\nThanks for reaching out to {{company}}! 🎉\nBased on your inquiry, I put together the next steps so you can see value quickly.\n\n**What to expect**\n• 20–30 min call to align on goals\n• A sample plan tailored to your use case\n• Clear pricing + timeline\n\nReady to grab a time? 👉 {{booking_link}}\n\nIf you prefer email, just reply here or reach us at {{contact_email}}.\n\n— {{inst_name}} Team` },
    { enabled: true, subject: "✅ Your goals from our intake (quick recap)", body: `Hi {{name}},\n\nFrom your notes, it sounds like you're aiming to:\n1) Solve {{painpoint or key goal}}\n2) Stay within a budget range that makes sense\n3) Move quickly without surprises\n\nWe do this often for teams like yours at {{company}}. Want me to pencil in a time? ✍️\nBook here → {{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "📅 2 slots left this week — want one?", body: `Hi {{name}},\n\nHeads up: we have **two** open slots left this week for quick consults.\n• Wed 11:00 AM\n• Thu 2:30 PM\n\nIf either works, lock it in here → {{booking_link}}\n\nPrefer another time? Reply with a few windows. We'll accommodate.\n\n— {{inst_name}}` },
    { enabled: true, subject: "💡 Example outcome we recently delivered", body: `Hi {{name}},\n\nSharing a quick example:\n> "Within 14 days we increased qualified leads by 36% and cut response time by 58%."\n\nWe'd love to map this to {{company}}. Even 20 minutes helps clarify ROI.\nGrab a slot → {{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "✨ 3 reasons teams pick us (short list)", body: `Hi {{name}},\n\n1) Speed — time-to-value in days, not months\n2) Clarity — simple pricing, no surprises\n3) Results — measurable outcomes you can show your team\n\nIf that's what you're after, let's connect:\n{{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "🧭 Roadmap preview (so you know what happens)", body: `Hi {{name}},\n\nOur typical flow:\n• Discovery (20–30 mins)\n• Quick plan + estimate\n• Build + iterate (fast feedback)\n• Launch + measure 📈\n\nIf that works, I'll send a calendar invite. Here's my calendar:\n{{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "Still interested? Here's a 1-page overview 📄", body: `Hi {{name}},\n\nAttaching our simple 1-pager (what we do and how we help teams like {{company}}).\n[Paste your 1-pager link or keep as is]\n\nIf you'd like a walkthrough, pick any time here:\n{{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "⚡ Quick win ideas for {{company}}", body: `Hi {{name}},\n\nHere are 3 quick win ideas we've seen work for similar teams:\n1) [Idea #1]\n2) [Idea #2]\n3) [Idea #3]\n\nWant me to tailor these to {{company}}? 15 mins is enough.\n{{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "Heads-up: pricing window this month 🗓️", body: `Hi {{name}},\n\nWe're keeping current pricing through the end of this month. If you want to lock it in, I recommend a quick call.\n\nSave a spot → {{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "✨ Realistic timeline & milestone plan (sample)", body: `Hi {{name}},\n\nTypical milestone flow looks like:\n• Week 1: Setup + alignment\n• Week 2: First wins\n• Week 3–4: Iterate + expand\n\nIf you're on board, I'll tailor a plan for {{company}}.\nBook here → {{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "Common questions (quick answers inside) ❓", body: `Hi {{name}},\n\n**Q: How long does onboarding take?**\nA: Usually under a week to first results.\n\n**Q: Is this locked-in?**\nA: No — simple, transparent terms.\n\n**Q: Can we start small?**\nA: Absolutely. We prefer phased rollouts.\n\nNext step if you're curious:\n{{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "Friendly nudge: want me to keep a slot for you?", body: `Hi {{name}},\n\nNo rush — happy to keep a slot this week if helpful.\nGrab it here: {{booking_link}}\n\nIf email is easier, reply with a couple of windows and I'll send an invite.\n\n— {{inst_name}}` },
    { enabled: true, subject: "Last call this round — should I pause follow-ups? ⏸️", body: `Hi {{name}},\n\nIf now isn't the right time, I can pause follow-ups for a month. Just say the word.\n\nIf you do want to chat, here's the fastest way:\n{{booking_link}}\n\n— {{inst_name}}` },
    { enabled: true, subject: "Thanks for considering us 🙏 (keep this handy)", body: `Hi {{name}},\n\nAppreciate you considering {{company}}.\nKeeping this here for when timing fits:\n• Book: {{booking_link}}\n• Email: {{contact_email}}\n• Phone: {{phone}}\n\nI'm around if/when you're ready.\n\n— {{inst_name}}` },
  ];
}

function seqWaitlist(): Day[] {
  return [
    { enabled: true, subject: "🎉 You're on the waitlist! What happens next…", body: `Hi {{name}},\n\nYou're officially on the list for **{{product}}** — love having you here! 🙌\n\n**What to expect**\n• Early updates + previews\n• Priority access when spots open\n• Sweet launch perks for early supporters\n\nYou can reply to this email anytime with questions.\n\n— {{inst_name}}` },
    { enabled: true, subject: "👀 Sneak peek of {{product}}", body: `Hi {{name}},\n\nHere's a quick look at what we're building:\n• Core idea: [1-line value]\n• Who it's for: [persona]\n• Why it's different: [edge]\n\nGot feedback? Hit reply — we're listening.\n\n— {{inst_name}}` },
    { enabled: true, subject: "💌 Tell us your top use case", body: `Hi {{name}},\n\nWhat would make {{product}} a **must-have** for you?\nReply with 1–2 lines. The best insights often come from real workflows.\n\n(We reply to every note.)\n\n— {{inst_name}}` },
    { enabled: true, subject: "🤫 Early mockups (rough, but real)", body: `Hi {{name}},\n\nSharing a few early mockups. Nothing fancy yet — just honest progress.\n[Link or remove]\n\nIf you want to be part of private beta, reply **BETA** and we'll prioritize you.\n\n— {{inst_name}}` },
    { enabled: true, subject: "🧭 Roadmap: what's shipping soon", body: `Hi {{name}},\n\nUpcoming milestones for {{product}}:\n• v0.1: Core feature working end-to-end\n• v0.2: Onboarding + basic analytics\n• v0.3: Integrations & polish\n\nWant early access? Reply with **EARLY**.\n\n— {{inst_name}}` },
    { enabled: true, subject: "📣 We're adding a few early testers", body: `Hi {{name}},\n\nWe're inviting a *limited* group for early testing this month.\nIf interested, reply with your main goal and we'll slot you in if there's a fit.\n\n— {{inst_name}}` },
    { enabled: true, subject: "📋 Quick survey (1 minute, promise)", body: `Hi {{name}},\n\nMind sharing a bit about your workflow? It helps us ship the right thing.\n[Link to a short form] or just hit reply with your top 2 must-haves.\n\nThank you!\n— {{inst_name}}` },
    { enabled: true, subject: "⚡ Mini update: progress + what's next", body: `Hi {{name}},\n\nProgress this week:\n• Finished [X]\n• Testing [Y]\n• Next: [Z]\n\nWe're getting closer. Thanks for being here!\n\n— {{inst_name}}` },
    { enabled: true, subject: "🎁 Early supporter perks (because you're awesome)", body: `Hi {{name}},\n\nWe're planning perks for early supporters:\n• Founding member pricing\n• Access to private roadmap\n• Vote on upcoming features\n\nInterested? Reply **PERKS**.\n\n— {{inst_name}}` },
    { enabled: true, subject: "⏱️ Timeline check", body: `Hi {{name}},\n\nQuick update: we're tracking well and still aiming for early access soon.\nWant me to put you on the first-invite list? Reply **FIRST**.\n\n— {{inst_name}}` },
    { enabled: true, subject: "👋 Want a personal walkthrough when ready?", body: `Hi {{name}},\n\nWhen {{product}} is ready, would a 10-minute walkthrough help?\nIf yes, reply **WALKTHROUGH** and we'll set you up on launch week.\n\n— {{inst_name}}` },
    { enabled: true, subject: "⭐ Feature spotlight: something you'll love", body: `Hi {{name}},\n\nWe're polishing a feature we think you'll love:\n[Feature summary]\n\nIf this solves a headache for you, reply and tell us how you do it today.\n\n— {{inst_name}}` },
    { enabled: true, subject: "🧪 Final checks before invites go out", body: `Hi {{name}},\n\nWe're in the final checks stage.\nWant to be in the first wave of invites? Reply **INVITE ME**.\n\n— {{inst_name}}` },
    { enabled: true, subject: "🎉 You're on our first-invite list", body: `Hi {{name}},\n\nThanks for sticking with us on this journey.\nYou're on our first-invite list. Keep an eye on your inbox — it's nearly time.\n\nP.S. If you ever need anything, write us at {{contact_email}}.\n\n— {{inst_name}}` },
  ];
}
function getStarterSequenceFor(botKey?: string | null): Day[] | null {
  switch (botKey) {
    case "LeadQualifier": return seqLeadQualifier();
    case "Waitlist":      return seqWaitlist();
    default:              return null;
  }
}

/** ───────────────────────────────────────────────────────────────────────────
 * UI helpers
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

function applyPlaceholders(text: string, ctx: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => (ctx[key] ?? `{{${key}}}`));
}

function timeOutsideWindow(t: string, win?: WindowRange | null, quiet?: QuietHours): boolean {
  if (quiet?.enabled) {
    if (t < quiet.start || t > quiet.end) return true;
  }
  if (win && (t < win.start || t > win.end)) return true;
  return false;
}

/** Day Block - NOW WITH CHANNEL SELECTOR */
function Block({
  index,
  value,
  onChange,
  onFocus,
  time,
  onTimeChange,
  windowRange,
  onWindowChange,
  showWindowFields,
  dateStr,
  onDateChange,
  scheduleMode,
  quiet,
  channel,
  onChannelChange,
}: {
  index: number;
  value: Day;
  onChange: (d: Day) => void;
  onFocus?: () => void;
  time: string;
  onTimeChange: (t: string) => void;
  windowRange: WindowRange | null;
  onWindowChange: (w: WindowRange | null) => void;
  showWindowFields: boolean;
  dateStr: string;
  onDateChange: (d: string) => void;
  scheduleMode: ScheduleMode;
  quiet: QuietHours;
  channel: DayChannel;
  onChannelChange: (c: DayChannel) => void;
}) {
  const warn = timeOutsideWindow(time, windowRange || undefined, quiet);
  
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

      {/* NEW: Channel Selector */}
      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
        <div className="mb-2 text-xs font-extrabold uppercase text-indigo-700">Channel</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChannelChange({ ...channel, channel: "email" })}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ring-1 ${
              channel.channel === "email"
                ? "bg-indigo-200 ring-black"
                : "bg-white ring-indigo-300 hover:bg-indigo-50"
            }`}
          >
            📧 Email
          </button>
          <button
            onClick={() => onChannelChange({ ...channel, channel: "sms" })}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ring-1 ${
              channel.channel === "sms"
                ? "bg-indigo-200 ring-black"
                : "bg-white ring-indigo-300 hover:bg-indigo-50"
            }`}
            title="SMS support coming soon"
          >
            📱 SMS
          </button>
          <button
            onClick={() => onChannelChange({ ...channel, channel: "both" })}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ring-1 ${
              channel.channel === "both"
                ? "bg-indigo-200 ring-black"
                : "bg-white ring-indigo-300 hover:bg-indigo-50"
            }`}
            title="Send both Email and SMS"
          >
            📧📱 Both
          </button>
        </div>
        {(channel.channel === "sms" || channel.channel === "both") && (
          <div className="mt-2 text-xs font-bold text-amber-700 bg-amber-100 rounded px-2 py-1">
            ⚠️ SMS support coming soon. Configure SMS provider in Integrations first.
          </div>
        )}
      </div>

      {/* Schedule controls */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Send time</div>
          <input
            type="time"
            className={input}
            value={time}
            onChange={(e) => onTimeChange(e.target.value || defaultTime)}
            onFocus={onFocus}
          />
          {warn && (
            <div className="mt-1 text-xs font-bold text-rose-700">
              Outside quiet hours or window
            </div>
          )}
        </div>

        {scheduleMode === "calendar" && (
          <div>
            <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Date</div>
            <input
              type="date"
              className={input}
              value={dateStr}
              onChange={(e) => onDateChange(e.target.value)}
              onFocus={onFocus}
            />
          </div>
        )}
      </div>

      {/* Optional send window */}
      {showWindowFields && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">
            Send window (optional)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              className={input}
              value={windowRange?.start || ""}
              placeholder="Earliest"
              onChange={(e) =>
                onWindowChange(
                  e.target.value && (windowRange?.end || "")
                    ? { start: e.target.value, end: windowRange?.end || e.target.value }
                    : e.target.value
                    ? { start: e.target.value, end: e.target.value }
                    : null
                )
              }
              onFocus={onFocus}
            />
            <input
              type="time"
              className={input}
              value={windowRange?.end || ""}
              placeholder="Latest"
              onChange={(e) =>
                onWindowChange(
                  e.target.value && (windowRange?.start || "")
                    ? { start: windowRange?.start || e.target.value, end: e.target.value }
                    : e.target.value
                    ? { start: e.target.value, end: e.target.value }
                    : null
                )
              }
              onFocus={onFocus}
            />
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="mt-3">
        <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">
          {channel.channel === "sms" ? "SMS Preview Text" : "Subject"}
        </div>
        <input
          className={input}
          value={value.subject}
          placeholder={channel.channel === "sms" ? "Preview text" : "Subject for Day X"}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          onFocus={onFocus}
        />
      </div>

      {/* Body */}
      <div className="mt-3">
        <div className="mb-1 text-xs font-extrabold uppercase text-purple-700 flex items-center justify-between">
          <span>Message</span>
          {channel.channel === "sms" && (
            <span className="text-xs font-bold text-indigo-600">
              {value.body.length} chars
            </span>
          )}
        </div>
        <textarea
          className={input}
          rows={channel.channel === "sms" ? 3 : 5}
          placeholder={
            channel.channel === "sms"
              ? "Keep it short for SMS (160 chars recommended)"
              : "Message for Day X"
          }
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          onFocus={onFocus}
        />
        {channel.channel === "sms" && value.body.length > 160 && (
          <div className="mt-1 text-xs font-bold text-amber-700">
            ⚠️ Message exceeds 160 chars (may split into multiple SMS)
          </div>
        )}
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

  // list of bot instances
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

  // selected instance
  const [instId, setInstId] = useState<string>(instFromUrl);

  // schedule model (14 in storage)
  const [days, setDays] = useState<Day[]>(
    instFromUrl ? loadDays(instFromUrl) : Array.from({ length: DAY_COUNT }, blankDay)
  );

  // length (UI view)
  const [lengthSetting, setLengthSetting] = useState<"7" | "14">("14");

  // schedule mode
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("relative");

  // times/windows/dates/timezone
  const [times, setTimes] = useState<string[]>(() =>
    instFromUrl ? loadTimes(instFromUrl) : Array.from({ length: DAY_COUNT }, () => defaultTime)
  );
  const [windows, setWindows] = useState<(WindowRange | null)[]>(() =>
    instFromUrl ? loadWindows(instFromUrl) : Array.from({ length: DAY_COUNT }, () => null)
  );
  const [dates, setDates] = useState<string[]>(() =>
    instFromUrl ? loadDates(instFromUrl) : Array.from({ length: DAY_COUNT }, () => "")
  );
  const [timezone, setTimezone] = useState<string>(() =>
    instFromUrl ? loadTimezone(instFromUrl) : loadTimezone("default")
  );

  // quiet hours
  const [quiet, setQuiet] = useState<QuietHours>(() =>
    instFromUrl ? loadQuietHours(instFromUrl) : { enabled: false, start: defaultWindow.start, end: defaultWindow.end }
  );

  // NEW: Recipients and channels
  const [recipients, setRecipients] = useState<Recipient[]>(() =>
    instFromUrl ? loadRecipients(instFromUrl) : []
  );
  const [channels, setChannels] = useState<DayChannel[]>(() =>
    instFromUrl ? loadChannels(instFromUrl) : Array.from({ length: DAY_COUNT }, () => ({ channel: "email" }))
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    instFromUrl ? loadCampaigns(instFromUrl) : []
  );

  // UI state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [previewCtx, setPreviewCtx] = useState<PreviewContext>({
    name: "Jessica",
    company: "Your Company",
    inst_name: instFromUrl || "Lead Qualifier",
    product: "Your Product",
    booking_link: "https://example.com/book",
    contact_email: "info@example.com",
    phone: "(804) 555-0199",
  });

  const [showDelivery, setShowDelivery] = useState<boolean>(false);
  const [delivery, setDelivery] = useState<DeliverySettings>(() =>
    loadDelivery(instFromUrl, "Sender", instFromUrl || "campaign")
  );
  const [previewOpts, setPreviewOpts] = useState<PreviewOptions>(() => loadPreviewOpts(instFromUrl));
  const [showWindowFields, setShowWindowFields] = useState<boolean>(false);

  // NEW: Recipients manager modal
  const [showRecipientsManager, setShowRecipientsManager] = useState(false);

  // reload when instance changes
  useEffect(() => {
    if (!instId) return;
    setDays(loadDays(instId));
    setTimes(loadTimes(instId));
    setWindows(loadWindows(instId));
    setDates(loadDates(instId));
    setTimezone(loadTimezone(instId));
    setQuiet(loadQuietHours(instId));
    setRecipients(loadRecipients(instId));
    setChannels(loadChannels(instId));
    setCampaigns(loadCampaigns(instId));

    const savedLen = (localStorage.getItem(keyLenForInst(instId)) as "7" | "14") || "14";
    setLengthSetting(savedLen);

    const savedMode = loadMode(instId);
    setScheduleMode(savedMode);

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

  // persistors
  useEffect(() => { if (instId) localStorage.setItem(keyLenForInst(instId), lengthSetting); }, [instId, lengthSetting]);
  useEffect(() => { if (instId) saveDelivery(instId, delivery); }, [instId, delivery]);
  useEffect(() => { if (instId) savePreviewOpts(instId, previewOpts); }, [instId, previewOpts]);
  useEffect(() => { if (instId) saveTimes(instId, times); }, [instId, times]);
  useEffect(() => { if (instId) saveWindows(instId, windows); }, [instId, windows]);
  useEffect(() => { if (instId) saveDates(instId, dates); }, [instId, dates]);
  useEffect(() => { if (instId) saveTimezone(instId, timezone); }, [instId, timezone]);
  useEffect(() => { if (instId) saveQuietHours(instId, quiet); }, [instId, quiet]);
  useEffect(() => { if (instId) saveMode(instId, scheduleMode); }, [instId, scheduleMode]);
  useEffect(() => { if (instId) saveRecipients(instId, recipients); }, [instId, recipients]);
  useEffect(() => { if (instId) saveChannels(instId, channels); }, [instId, channels]);
  useEffect(() => { if (instId) saveCampaigns(instId, campaigns); }, [instId, campaigns]);

  const selectedInst = useMemo(() => instances.find((m) => m.id === instId), [instances, instId]);

  /** Actions */
  function saveSchedule() {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
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
    localStorage.setItem(keyTimesForInst(targetId), JSON.stringify(times));
    localStorage.setItem(keyWindowsForInst(targetId), JSON.stringify(windows));
    localStorage.setItem(keyModeForInst(targetId), scheduleMode);
    localStorage.setItem(keyDatesForInst(targetId), JSON.stringify(dates));
    localStorage.setItem(keyTzForInst(targetId), timezone);
    localStorage.setItem(keyQuietForInst(targetId), JSON.stringify(quiet));
    localStorage.setItem(keyRecipientsForInst(targetId), JSON.stringify(recipients));
    localStorage.setItem(keyChannelsForInst(targetId), JSON.stringify(channels));
    window.location.href = `/admin/nurture?inst=${encodeURIComponent(targetId)}`;
  }

  function sendTestEmail() {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    const to = prompt("Send test to (email address):", "you@example.com");
    if (!to) return;

    const enabled = days
      .map((d, i) => ({ ...d, day: i + 1 }))
      .filter((d) => d.enabled && (d.subject || d.body));

    if (enabled.length === 0) return alert("Enable at least one day first.");

    const first = enabled[0];
    const subj = `[TEST] Day ${first.day} — ${first.subject || "Nurture Message"}`;
    const body =
      `This is a test send for instance "${selectedInst?.name || instId}".\n\n` +
      enabled
        .slice(0, 3)
        .map((d) => {
          const timeStr = times[d.day - 1] || defaultTime;
          const dateStr = dates[d.day - 1] || "(relative)";
          const ch = channels[d.day - 1]?.channel || "email";
          return `Day ${d.day} — ${scheduleMode === "calendar" ? dateStr : "relative"}, ${timeStr}, Channel: ${ch}\nSubject: ${d.subject || "(none)"}\nMessage:\n${d.body || "(none)"}\n`;
        })
        .join("\n---\n") +
      `\n\n(Preview only — actual scheduling via your ESP/backend.)`;

    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subj
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  function loadStarter() {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    const botKey = selectedInst?.bot || null;
    const seq = getStarterSequenceFor(botKey);
    if (!seq) {
      alert(`No starter sequence for this bot type.\nSupported: LeadQualifier, Waitlist.\nSelected: ${botKey || "(unknown)"}`);
      return;
    }
    const ok = confirm("Load the 14-day starter sequence? This will replace current messages.");
    if (!ok) return;
    setDays(seq);
    saveDays(instId, seq);
    setLengthSetting("14");
    localStorage.setItem(keyLenForInst(instId), "14");
    const t = Array.from({ length: DAY_COUNT }, () => delivery.defaultTime || defaultTime);
    setTimes(t);
    saveTimes(instId, t);
    alert("Starter sequence loaded and saved.");
  }

  function setLen(newLen: "7" | "14") {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    setLengthSetting(newLen);
    localStorage.setItem(keyLenForInst(instId), newLen);
  }

  function exportJSON() {
    const visible = lengthSetting === "7" ? days.slice(0, 7) : days.slice(0, 14);
    const payload = {
      instance: instId,
      length: visible.length,
      schedule: visible,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = `nurture_${instId || "instance"}_${visible.length}d_${new Date().toISOString().slice(0, 10)}`;
    a.href = url; a.download = `${base}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function exportBackendJSON() {
    const payload = {
      instanceId: instId,
      delivery: {
        integrationAccountId: delivery.integrationAccountId,
        provider: delivery.provider,
        fromName: delivery.fromName,
        fromEmail: delivery.fromEmail,
        replyTo: delivery.replyTo || delivery.fromEmail || "",
        tagPrefix: delivery.tagPrefix,
      },
      sequence: ensure14(days, blankDay),
      placeholders: { ...previewCtx },
      length: lengthSetting === "7" ? 7 : 14,
      sendTimes: ensure14(times, () => delivery.defaultTime || defaultTime),
      sendWindows: ensure14(windows, () => null),
      scheduleMode,
      dates: ensure14(dates, () => ""),
      timezone,
      channels: ensure14(channels, () => ({ channel: "email" })),
      recipients: recipients.map(r => ({
        id: r.id,
        email: r.email,
        phone: r.phone,
        name: r.name,
        company: r.company,
        status: r.status,
      })),
      exportedAt: new Date().toISOString(),
      previewOptions: { ...previewOpts },
      quietHours: { ...quiet },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = `nurture_backend_${instId || "instance"}_${payload.length}d_${new Date().toISOString().slice(0, 10)}`;
    a.href = url; a.download = `${base}.json`; a.click(); URL.revokeObjectURL(url);
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  function importClick() {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    fileInputRef.current?.click();
  }
  function isValidDay(d: any): d is Day {
    return d && typeof d === "object" && typeof d.enabled === "boolean" && typeof d.subject === "string" && typeof d.body === "string";
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
      const next = ensure14(incoming, blankDay);
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

  function applyPreset(preset: "B2B_9AM" | "TUTH_2PM" | "MWF_9_TUTH_2" | "WEEKEND_10AM") {
    const vis = lengthSetting === "7" ? 7 : 14;
    setTimes((prev) => {
      const next = [...prev];
      for (let i = 0; i < vis; i++) {
        const weekday = (i % 7);
        let t = prev[i] || defaultTime;
        switch (preset) {
          case "B2B_9AM": t = "09:00"; break;
          case "TUTH_2PM": t = (weekday === 1 || weekday === 3) ? "14:00" : prev[i] || "14:00"; break;
          case "MWF_9_TUTH_2": t = (weekday === 0 || weekday === 2 || weekday === 4) ? "09:00" : "14:00"; break;
          case "WEEKEND_10AM": t = (weekday === 5 || weekday === 6) ? "10:00" : prev[i] || "10:00"; break;
        }
        next[i] = t;
      }
      return next;
    });
  }

  function autoFillDatesFrom(startISO: string) {
    if (!startISO) return;
    const start = new Date(startISO + "T00:00:00");
    if (isNaN(start.getTime())) return alert("Invalid start date.");
    setDates((prev) => {
      const next = [...prev];
      for (let i = 0; i < 14; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        next[i] = iso;
      }
      return next;
    });
  }

  // NEW: Launch campaign (placeholder for backend)
  function launchCampaign() {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    if (recipients.length === 0) {
      alert("Add recipients first using the Recipients Manager.");
      return;
    }
    
    const enabled = days.filter((d, i) => d.enabled && i < (lengthSetting === "7" ? 7 : 14));
    if (enabled.length === 0) {
      alert("Enable at least one day before launching.");
      return;
    }

    const ok = confirm(
      `Launch nurture campaign?\n\n` +
      `• Recipients: ${recipients.filter(r => r.status === "active").length} active\n` +
      `• Days: ${enabled.length}\n` +
      `• Mode: ${scheduleMode}\n\n` +
      `This will queue emails to send via your ESP.`
    );
    if (!ok) return;

    // TODO: Call backend API to queue campaign
    alert(
      "Campaign launch ready!\n\n" +
      "This is a UI-only prototype. Connect your backend to:\n" +
      "1. Queue sends via your ESP\n" +
      "2. Track delivery/opens/clicks\n" +
      "3. Update analytics in real-time"
    );
  }

  const visibleCount = lengthSetting === "7" ? 7 : 14;
  const visibleDays = days.slice(0, visibleCount);
  const selectedInstMeta = useMemo(() => selectedInst, [selectedInst]);

  const currentDay = visibleDays[focusedIndex] ?? visibleDays.find((d) => d.enabled) ?? visibleDays[0] ?? null;
  const currentSubject = currentDay ? applyPlaceholders(currentDay.subject || "", previewCtx as any) : "";
  let currentBody = currentDay ? applyPlaceholders(currentDay.body || "", previewCtx as any) : "";
  if (previewOpts.addUnsubscribeFooter) {
    const footer = `\n\n—\nYou're receiving this because you engaged with {{company}}.\nUnsubscribe: {{unsubscribe_link}}`;
    currentBody += "\n" + applyPlaceholders(footer, { ...previewCtx, unsubscribe_link: "https://example.com/unsubscribe" } as any);
  }

  const activeRecipients = recipients.filter(r => r.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 rounded-t-2xl border-b">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight whitespace-nowrap">Nurture (Day 1–14)</h1>
            <p className="text-sm text-foreground/70">
              Multi-channel campaigns with recipient management and analytics.
            </p>
            {!instId && <div className="text-xs font-bold text-rose-700 mt-1">(Unsaved / No Instance Selected)</div>}
          </div>

          {/* Instance picker + actions */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-foreground/70">Client Bot</label>
              <select
                className="rounded-lg border px-3 py-2 font-semibold bg-white min-w-[260px]"
                value={instId}
                onChange={(e) => setInstId(e.target.value)}
              >
                <option value="" disabled>Pick a client bot instance…</option>
                {instances.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((m) => (
                  <option key={m.id} value={m.id}>{(m.name || `${m.bot} Instance`) + " • " + m.mode}</option>
                ))}
              </select>
            </div>

            <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-fuchsia-500/20 to-sky-500/20 hover:from-fuchsia-500/30 hover:to-sky-500/30" onClick={loadStarter}>
              Load Starter Sequence
            </button>
            <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30" onClick={duplicateToNewInstance}>
              Duplicate to New Instance
            </button>
            <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30" onClick={sendTestEmail}>
              Send Test Email
            </button>
            <button className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30" onClick={saveSchedule}>
              Save Schedule
            </button>
            <button
              className="rounded-xl px-4 py-2 font-bold ring-1 ring-black bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100"
              onClick={() => {
                if (!instId) return alert("Pick a Client Bot (instance) first.");
                setShowDelivery(true);
              }}
              title="Per-instance sender & provider (UI-only). Providers are managed on Integrations."
            >
              Delivery Settings
            </button>
          </div>
        </div>

        {/* Controls: Length, Mode, Import/Export */}
        <div className="flex flex-col gap-3 p-4 border-t bg-white md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-foreground/70">Length</span>
              <button onClick={() => setLen("7")} className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ${lengthSetting === "7" ? "bg-yellow-100 ring-black" : "bg-gray-50 ring-gray-300 hover:bg-gray-100"}`} title="Show days 1–7">7 days</button>
              <button onClick={() => setLen("14")} className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ${lengthSetting === "14" ? "bg-green-100 ring-black" : "bg-gray-50 ring-gray-300 hover:bg-gray-100"}`} title="Show all 14 days">14 days</button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-foreground/70">Schedule</span>
              <button
                onClick={() => setScheduleMode("relative")}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ${scheduleMode === "relative" ? "bg-indigo-100 ring-black" : "bg-gray-50 ring-gray-300 hover:bg-gray-100"}`}
              >
                Relative Days
              </button>
              <button
                onClick={() => setScheduleMode("calendar")}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ${scheduleMode === "calendar" ? "bg-indigo-100 ring-black" : "bg-gray-50 ring-gray-300 hover:bg-gray-100"}`}
              >
                Specific Dates
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportJSON} className="rounded-xl px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100">
              Export JSON
            </button>
            <button onClick={importClick} className="rounded-xl px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100">
              Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
            <button onClick={exportBackendJSON} className="rounded-xl px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100">
              Export for Backend (.json)
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Recipients & Campaign Section */}
      <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[22px] font-black text-purple-900">Recipients & Campaign</div>
            <p className="text-sm text-foreground/70">
              Manage contacts and launch bulk campaigns (BCC-style delivery)
            </p>
          </div>
          <Link
            to={`/admin/analytics?inst=${instId}`}
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-black bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100"
          >
            📊 View Analytics
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border-2 border-purple-300 bg-purple-50/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-extrabold text-purple-900">Recipients</div>
              <span className="text-2xl font-black">{activeRecipients}</span>
            </div>
            <div className="text-sm text-foreground/70 mb-3">
              {recipients.length} total ({recipients.length - activeRecipients} inactive)
            </div>
            <button
              onClick={() => {
                if (!instId) return alert("Pick a Client Bot (instance) first.");
                setShowRecipientsManager(true);
              }}
              className="w-full rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white hover:bg-purple-50"
            >
              Manage Recipients
            </button>
          </div>

          <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-extrabold text-indigo-900">Enabled Days</div>
              <span className="text-2xl font-black">
                {days.filter((d, i) => d.enabled && i < visibleCount).length}
              </span>
            </div>
            <div className="text-sm text-foreground/70 mb-3">
              of {visibleCount} visible days
            </div>
            <div className="text-xs text-foreground/60">
              Each recipient gets personalized messages
            </div>
          </div>

          <div className="rounded-xl border-2 border-green-300 bg-green-50/40 p-4">
            <div className="font-extrabold text-green-900 mb-2">Launch Campaign</div>
            <div className="text-sm text-foreground/70 mb-3">
              Send to all active recipients
            </div>
            <button
              onClick={launchCampaign}
              className="w-full rounded-lg px-3 py-2 font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_3px_0_#000] active:translate-y-[1px] disabled:opacity-50"
              disabled={activeRecipients === 0}
              title={activeRecipients === 0 ? "Add recipients first" : "Queue campaign via ESP"}
            >
              🚀 Launch Now
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50/40 p-3">
          <div className="text-sm font-bold text-amber-900 mb-1">
            📧 BCC-Style Delivery (Privacy Protected)
          </div>
          <div className="text-xs text-foreground/70">
            Each recipient receives their own personalized email. No one sees other recipients' addresses.
            Messages are sent individually through your ESP with proper personalization.
          </div>
        </div>
      </div>

      {/* Readiness Checklist */}
      <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between mb-2">
          <div className="text-[22px] font-black text-purple-900">Readiness Checklist</div>
          <a className="text-sm font-bold underline" href="/admin/integrations" title="Manage providers and accounts">
            Manage on Integrations →
          </a>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
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
            <div className="font-extrabold text-purple-700 mb-1">Recipients added?</div>
            <div>{activeRecipients > 0 ? `${activeRecipients} active` : "Add recipients to start"}</div>
          </li>
          <li className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
            <div className="font-extrabold text-purple-700 mb-1">SMS Provider?</div>
            <div className="text-xs text-amber-700">Coming soon - configure on Integrations</div>
          </li>
        </ul>
      </div>

      {/* Main content: Grid + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Grid of days */}
        <div className="xl:col-span-2">
          {/* Smart presets + toggles */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="text-xs font-bold uppercase text-foreground/70 mr-2">Presets</div>
            <button className="rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-white hover:bg-gray-50" onClick={() => applyPreset("B2B_9AM")}>B2B Weekdays 9am</button>
            <button className="rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-white hover:bg-gray-50" onClick={() => applyPreset("TUTH_2PM")}>Tu/Th 2pm</button>
            <button className="rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-white hover:bg-gray-50" onClick={() => applyPreset("MWF_9_TUTH_2")}>M/W/F 9a + Tu/Th 2p</button>
            <button className="rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ring-black bg-white hover:bg-gray-50" onClick={() => applyPreset("WEEKEND_10AM")}>Weekend 10am</button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-foreground/70">Send window fields</label>
              <input type="checkbox" checked={showWindowFields} onChange={(e) => setShowWindowFields(e.target.checked)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visibleDays.map((d, i) => (
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
                onFocus={() => setFocusedIndex(i)}
                scheduleMode={scheduleMode}
                time={times[i] || defaultTime}
                onTimeChange={(t) =>
                  setTimes((prev) => {
                    const out = [...prev];
                    out[i] = t || defaultTime;
                    return out;
                  })
                }
                windowRange={windows[i] || null}
                onWindowChange={(w) =>
                  setWindows((prev) => {
                    const out = [...prev];
                    out[i] = w;
                    return out;
                  })
                }
                showWindowFields={showWindowFields}
                dateStr={dates[i] || ""}
                onDateChange={(dstr) =>
                  setDates((prev) => {
                    const out = [...prev];
                    out[i] = dstr;
                    return out;
                  })
                }
                quiet={quiet}
                channel={channels[i]}
                onChannelChange={(ch) =>
                  setChannels((prev) => {
                    const out = [...prev];
                    out[i] = ch;
                    return out;
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* Live Preview panel */}
        <div className="xl:col-span-1">
          <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)] sticky top-4">
            <div className="h-2 rounded-md bg-black mb-4" />
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[22px] font-black text-purple-900">Live Preview</div>
              <div className="text-xs font-bold text-purple-700">Day {Math.min(focusedIndex + 1, visibleDays.length)}</div>
            </div>

            {/* Preview Context */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 mb-4">
              <div className="text-xs font-extrabold uppercase text-purple-700 mb-2">Preview Context</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    ["name", "Jessica"],
                    ["company", selectedInstMeta?.name || "Your Company"],
                    ["inst_name", selectedInstMeta?.bot || instId || "Lead Qualifier"],
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

            {/* Channel indicator */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 mb-3">
              <div className="text-xs font-extrabold uppercase text-indigo-700 mb-1">Channel</div>
              <div className="text-sm font-bold">
                {channels[focusedIndex]?.channel === "email" && "📧 Email"}
                {channels[focusedIndex]?.channel === "sms" && "📱 SMS"}
                {channels[focusedIndex]?.channel === "both" && "📧📱 Email + SMS"}
              </div>
            </div>

            {/* Schedule banner */}
            <div className="rounded-xl border border-purple-200 bg-white p-3 mb-3">
              <div className="text-xs font-extrabold uppercase text-purple-700 mb-1">Scheduled</div>
              <div className="text-[13px]">
                {scheduleMode === "calendar"
                  ? `${dates[focusedIndex] || "(no date)"} at ${times[focusedIndex] || defaultTime} ${timezone}`
                  : `Day ${focusedIndex + 1} at ${times[focusedIndex] || defaultTime} ${timezone}`}
              </div>
              {quiet.enabled && (times[focusedIndex] < quiet.start || times[focusedIndex] > quiet.end) && (
                <div className="mt-1 text-xs font-bold text-rose-700">Outside quiet hours</div>
              )}
            </div>

            {/* Rendered subject/body */}
            <div className="rounded-xl border border-purple-200 bg-white p-3">
              <div className="text-xs font-extrabold uppercase text-purple-700 mb-1">Subject (rendered)</div>
              <div className="rounded-md border border-purple-200 bg-purple-50/40 p-2 text-[15px] font-semibold">
                {currentSubject || <span className="text-gray-400">(empty)</span>}
              </div>

              <div className="mt-3 text-xs font-extrabold uppercase text-purple-700 mb-1">Body (rendered)</div>
              <div className="rounded-md border border-purple-200 bg-purple-50/40 p-2 whitespace-pre-wrap text-[15px] font-semibold max-h-[300px] overflow-y-auto">
                {currentBody || <span className="text-gray-400">(empty)</span>}
              </div>
            </div>

            <div className="mt-3 text-[12px] text-gray-600">
              Unknown placeholders (e.g., <code>{"{{unknown}}"}</code>) are shown as-is so you can fix them before exporting.
            </div>
          </div>
        </div>
      </div>

      {/* Recipients Manager Modal */}
      {showRecipientsManager && (
        <RecipientsManager
          recipients={recipients}
          onRecipientsChange={setRecipients}
          onClose={() => setShowRecipientsManager(false)}
        />
      )}

      {/* Delivery Settings Drawer */}
      {showDelivery && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDelivery(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white border-l-2 border-black/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.0)] overflow-y-auto">
            <div className="p-5 border-b-2 border-black/80 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="text-xl font-black">Delivery & Scheduling (UI-only)</div>
              <div className="text-xs text-gray-600">
                Choose a provider, sender, defaults, timezone, and quiet hours. Providers are connected on{" "}
                <a className="underline font-semibold" href="/admin/integrations">Integrations</a>.
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Provider */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-extrabold">Delivery Provider</div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 border">
                    {delivery.provider
                      ? (delivery.integrationAccountId ? `Connected: ${delivery.provider.toUpperCase()}` : `Selected (local): ${delivery.provider.toUpperCase()}`)
                      : "Not connected"}
                  </span>
                </div>
                <select
                  className="w-full rounded-lg border px-3 py-2 font-semibold bg-white"
                  value={delivery.provider || ""}
                  onChange={(e) => setDelivery((d) => ({ ...d, provider: (e.target.value || null) as Provider }))}
                >
                  <option value="">Select provider (universal)</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">AWS SES</option>
                  <option value="gmail">Gmail / Google Workspace</option>
                  <option value="smtp">Generic SMTP</option>
                </select>
                <div className="mt-2 text-xs text-gray-600">Selection is local until Integrations links an account.</div>
                <div className="mt-3">
                  <a className="text-sm font-bold underline" href="/admin/integrations">Manage on Integrations →</a>
                </div>
              </div>

              {/* Sender */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Sender</div>
                <div className="grid grid-cols-1 gap-3">
                  <input className="rounded-lg border px-3 py-2 font-semibold" placeholder="From Name" value={delivery.fromName} onChange={(e) => setDelivery((d) => ({ ...d, fromName: e.target.value }))} />
                  <input className="rounded-lg border px-3 py-2 font-semibold" placeholder="From Email" value={delivery.fromEmail} onChange={(e) => setDelivery((d) => ({ ...d, fromEmail: e.target.value }))} />
                  <input className="rounded-lg border px-3 py-2 font-semibold" placeholder="Reply-To (optional)" value={delivery.replyTo} onChange={(e) => setDelivery((d) => ({ ...d, replyTo: e.target.value }))} />
                  <input className="rounded-lg border px-3 py-2 font-semibold" placeholder="Tag Prefix" value={delivery.tagPrefix} onChange={(e) => setDelivery((d) => ({ ...d, tagPrefix: e.target.value }))} />
                </div>
              </div>

              {/* Defaults & Timezone */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Defaults & Timezone</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Default time</div>
                    <input
                      type="time"
                      className="rounded-lg border px-3 py-2 font-semibold w-full"
                      value={delivery.defaultTime || defaultTime}
                      onChange={(e) => setDelivery((d) => ({ ...d, defaultTime: e.target.value || defaultTime }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Timezone</div>
                    <input
                      className="rounded-lg border px-3 py-2 font-semibold w-full"
                      placeholder="America/New_York"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white"
                    onClick={() => {
                      const vis = visibleCount;
                      setTimes((prev) => {
                        const out = [...prev];
                        for (let i = 0; i < vis; i++) out[i] = delivery.defaultTime || defaultTime;
                        return out;
                      });
                    }}
                  >
                    Apply to all visible days
                  </button>
                </div>
              </div>

              {/* Quiet hours */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Quiet Hours (UI-only)</div>
                <label className="inline-flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={quiet.enabled}
                    onChange={(e) => setQuiet((q) => ({ ...q, enabled: e.target.checked }))}
                  />
                  Enable quiet hours warnings
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Start</div>
                    <input
                      type="time"
                      className="rounded-lg border px-3 py-2 font-semibold w-full"
                      value={quiet.start}
                      onChange={(e) => setQuiet((q) => ({ ...q, start: e.target.value || defaultWindow.start }))}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">End</div>
                    <input
                      type="time"
                      className="rounded-lg border px-3 py-2 font-semibold w-full"
                      value={quiet.end}
                      onChange={(e) => setQuiet((q) => ({ ...q, end: e.target.value || defaultWindow.end }))}
                    />
                  </div>
                </div>
              </div>

              {/* Calendar helper */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Specific Dates (auto-fill)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <div className="mb-1 text-xs font-extrabold uppercase text-purple-700">Start date</div>
                    <input
                      type="date"
                      className="rounded-lg border px-3 py-2 font-semibold w-full"
                      onChange={(e) => e.target.value && autoFillDatesFrom(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <div className="text-xs text-gray-600">
                      Auto-fills Day 1..14 dates. Switch schedule to <strong>Specific Dates</strong> to edit per-day.
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-xl border-[2px] border-black/80 p-4">
                <div className="font-extrabold mb-2">Actions</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white"
                    onClick={() => {
                      saveDelivery(instId, delivery);
                      savePreviewOpts(instId, previewOpts);
                      saveTimes(instId, times);
                      saveWindows(instId, windows);
                      saveDates(instId, dates);
                      saveTimezone(instId, timezone);
                      saveQuietHours(instId, quiet);
                      saveMode(instId, scheduleMode);
                      alert("Delivery & scheduling settings saved.");
                    }}
                  >
                    Save Settings
                  </button>
                  <button className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white" onClick={() => setShowDelivery(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
