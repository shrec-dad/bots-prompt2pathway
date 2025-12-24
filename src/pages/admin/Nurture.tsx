// src/pages/admin/Nurture.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useSearchParams, Link } from "react-router-dom";
import { fetchBots } from '@/store/botsSlice';
import { fetchInstances, updateInstance } from '@/store/botInstancesSlice';
import RecipientsManager from "@/components/RecipientsManager";
import { fetchRecipients, addRecipients, deleteRecipients } from "@/store/recipientsSlice";
import type { ChannelType } from "@/types/nurture-types";

/** ───────────────────────────────────────────────────────────────────────────
 * Storage model (existing + NEW recipient/campaign keys)
 * ───────────────────────────────────────────────────────────────────────────*/

type Day = { enabled: boolean; subject: string; body: string };
const DAY_COUNT = 14;

type Provider = "sendgrid" | "mailgun" | "ses" | "gmail" | "smtp";

type DeliverySettings = {
  provider: Provider;
  integrationAccountId: string;
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

const blankDay = (): Day => ({ enabled: false, subject: "", body: "" });

/** Utils */
const ensure14 = <T,>(arr: T[], filler: () => T) =>
  Array.from({ length: DAY_COUNT }, (_, i) => arr[i] ?? filler());

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const defaultTime = "09:00";
const defaultWindow: WindowRange = { start: "08:00", end: "20:00" };

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

  const dispatch = useDispatch();
  
  // selected instance
  const [instId, setInstId] = useState<string>(instFromUrl);
  const bots = useSelector((state: RootState) => state.bots.list);
  const instances = useSelector((state: RootState) => state.instances.list);
  const recipientsFromStore = useSelector((state: RootState) => state.recipients.list);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchInstances());
  }, [dispatch]);

  const handleUpdateInstance = async (id, data) => {
    try {
      await dispatch(updateInstance({id, data})).unwrap();
      dispatch(fetchInstances()); 
    } catch (err: any) {

    }
  }

  // schedule model
  const [days, setDays] = useState<Day[]>(Array.from({ length: DAY_COUNT }, blankDay));

  // length (UI view)
  const [lengthSetting, setLengthSetting] = useState<"7" | "14">("14");

  // schedule mode
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("relative");

  // times/windows/dates/timezone
  const [times, setTimes] = useState<string[]>(Array.from({ length: DAY_COUNT }, () => defaultTime));

  const [windows, setWindows] = useState<(WindowRange | null)[]>(Array.from({ length: DAY_COUNT }, () => null));

  const [dates, setDates] = useState<string[]>(Array.from({ length: DAY_COUNT }, () => ""));

  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York");

  // quiet hours
  const [quiet, setQuiet] = useState<QuietHours>({ enabled: false, start: defaultWindow.start, end: defaultWindow.end });

  // NEW: Recipients and channels - recipients now from Redux
  const [channels, setChannels] = useState<DayChannel[]>(Array.from({ length: DAY_COUNT }, () => ({ channel: "email" })));

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
  const [delivery, setDelivery] = useState<DeliverySettings>({
    provider: "smtp",
    integrationAccountId: "",
    fromName: "Sender",
    fromEmail: "",
    replyTo: "",
    tagPrefix: "campaign",
    defaultTime,
  });

  const [previewOpts, setPreviewOpts] = useState<PreviewOptions>({ addUnsubscribeFooter: false, addTrackingPixelHint: false });
  const [showWindowFields, setShowWindowFields] = useState<boolean>(false);

  // NEW: Recipients manager modal
  const [showRecipientsManager, setShowRecipientsManager] = useState(false);

  const selectedInst = useMemo(() => instances.find((m) => m._id === instId), [instances, instId]);
  
  // reload when instance changes
  useEffect(() => {
    if (!selectedInst) return;

    setDays(selectedInst.days ? ensure14(selectedInst.days, blankDay) : Array.from({ length: DAY_COUNT }, blankDay));
    setTimes(selectedInst.times ? ensure14(selectedInst.times, () => defaultTime) : Array.from({ length: DAY_COUNT }, () => defaultTime));
    setWindows(selectedInst.windows ? ensure14(selectedInst.windows as (WindowRange | null)[], () => null) : Array.from({ length: DAY_COUNT }, () => null));
    setDates(selectedInst.dates ? ensure14(selectedInst.dates as string[], () => "") : Array.from({ length: DAY_COUNT }, () => ""));
    setTimezone(selectedInst.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York");
    setQuiet(selectedInst.quiet || { enabled: false, start: defaultWindow.start, end: defaultWindow.end });
    setChannels(selectedInst.channels ? ensure14(selectedInst.channels as DayChannel[], () => ({ channel: "email" })) : Array.from({ length: DAY_COUNT }, () => ({ channel: "email" as ChannelType })));
    setLengthSetting(selectedInst.daysCount as "7" | "14" || "14");
    setScheduleMode(selectedInst.scheduleMode as ScheduleMode || "relative");

    // Fetch recipients from API when instance changes
    dispatch(fetchRecipients(instId));
    
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set("inst", instId);
      return next;
    });

    const instMeta = instances.find((x) => x._id === instId);
    setPreviewCtx((prev) => ({
      ...prev,
      inst_name: instMeta?.botKey || instId,
      company: instMeta?.name || prev.company,
    }));

    setDelivery(selectedInst.delivery || {
      provider: "smtp",
      integrationAccountId: "",
      fromName: "Sender",
      fromEmail: "",
      replyTo: "",
      tagPrefix: "campaign",
      defaultTime
    });

    setPreviewOpts(selectedInst.previewOpts as PreviewOptions ||{ addUnsubscribeFooter: false, addTrackingPixelHint: false });
    setFocusedIndex(0);
  }, [instId, setSearch, instances]);

  /** Actions */
  function saveSchedule() {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    handleUpdateInstance(instId, { 
      days,
      daysCount: lengthSetting,
      delivery,
      previewOpts,
      times,
      windows,
      scheduleMode,
      channels
    });

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
        instances.map((x) => `• ${x.name || x._id}  —  ${x._id}`).join("\n")
    );
    if (!targetId) return;

    handleUpdateInstance(targetId, {
      days,
      daysCount: lengthSetting,
      deliverySettings: delivery,
      previewOpts,
      times,
      windows,
      scheduleMode,
      channels
    });
   
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
    const botKey = selectedInst?.botKey || null;
    const seq = bots.find(b => b.key == botKey)?.starterSeq;
    if (!seq) {
      alert(`No starter sequence for this bot type.\nSupported: LeadQualifier, Waitlist.\nSelected: ${botKey || "(unknown)"}`);
      return;
    }
    const ok = confirm("Load the 14-day starter sequence? This will replace current messages.");
    if (!ok) return;
    
    setDays(seq);
    setLengthSetting("14");
    
    const t = Array.from({ length: DAY_COUNT }, () => delivery.defaultTime || defaultTime);
    setTimes(t);
    
    alert("Starter sequence loaded and saved.");
  }

  function setLen(newLen: "7" | "14") {
    if (!instId) return alert("Pick a Client Bot (instance) first.");
    setLengthSetting(newLen);
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
      recipients: recipientsFromStore.map(r => ({
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

      const newLen: "7" | "14" = incoming.length <= 7 ? "7" : "14";
      setLengthSetting(newLen);

      handleUpdateInstance(instId, {
        days: next,
        daysCount: newLen
      })
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
    if (recipientsFromStore.length === 0) {
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
      `• Recipients: ${recipientsFromStore.filter(r => r.status === "active").length} active\n` +
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

  const activeRecipients = recipientsFromStore.filter(r => r.status === "active").length;

  return (
    <div className="space-y-6 p-5">
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-foreground/70">Client Bot</label>
              <select
                className="rounded-lg border px-3 py-2 font-semibold bg-white min-w-[260px]"
                value={instId}
                onChange={(e) => setInstId(e.target.value)}
              >
                <option value="" disabled>Pick a client bot instance…</option>
                {instances.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((m) => (
                  <option key={m._id} value={m._id}>{m.name + " • " + m.plan}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}
                onClick={loadStarter}>
                Load Starter Sequence
              </button>
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}
                onClick={duplicateToNewInstance}>
                Duplicate to New Instance
              </button>
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}
                onClick={sendTestEmail}>
                Send Test Email
              </button>
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}
                onClick={saveSchedule}>
                Save Schedule
              </button>
              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border"
                style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}
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
              {recipientsFromStore.length} total ({recipientsFromStore.length - activeRecipients} inactive)
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
          recipients={recipientsFromStore}
          onAddRecipients = {async (recipients) => {
            if (!instId) return;
            await dispatch(addRecipients({ instId, recipients })).unwrap();
            dispatch(fetchRecipients(instId));
          }}
          onDeleteRecipients={async (ids) => {
            // Delete recipients via Redux API
            if (!instId) return;
            await dispatch(deleteRecipients(ids)).unwrap();
            // Re-fetch to ensure consistency
            dispatch(fetchRecipients(instId));
          }}
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
                      handleUpdateInstance(instId, {
                        delivery,
                        previewOpts,
                        times,
                        windows,
                        dates,
                        timezone,
                        quiet,
                        scheduleMode
                      });
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
