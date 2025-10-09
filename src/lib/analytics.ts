// src/lib/analytics.ts
// Tiny local analytics: event log + helpers for per-instance/per-template stats.

export type AnalyticsScope =
  | { kind: "inst"; id: string }     // specific client instance
  | { kind: "bot"; key: string };    // base template key (fallback when no instance)

export type EventType =
  | "bubble_open"       // user opens popup
  | "view_widget"       // widget visible (inline/sidebar)
  | "step_next"         // next step in flow
  | "step_back"
  | "lead_submit"       // final completion / lead captured
  | "close_widget"      // user closes
  | "error";            // generic error

export type AnalyticsEvent = {
  id: string;
  ts: number;                 // epoch ms
  type: EventType;
  scope: AnalyticsScope;
  meta?: Record<string, any>; // optional e.g. step index, page path, ua hash
};

const KEY_EVENTS = "analytics:events.v1";
const MAX_EVENTS = 10_000; // ring-buffer cap to keep localStorage sane

function readEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(KEY_EVENTS);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(all: AnalyticsEvent[]) {
  localStorage.setItem(KEY_EVENTS, JSON.stringify(all));
}

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function trackEvent(type: EventType, scope: AnalyticsScope, meta?: Record<string, any>) {
  const ev: AnalyticsEvent = { id: newId(), ts: Date.now(), type, scope, meta };
  const all = readEvents();
  all.push(ev);
  // Cap size (drop oldest)
  if (all.length > MAX_EVENTS) {
    all.splice(0, all.length - MAX_EVENTS);
  }
  writeEvents(all);
  // Fire a storage event for cross-tabs dashboards
  try {
    localStorage.setItem("analytics:last", String(ev.ts));
  } catch {}
}

/* ---------------- Aggregations ---------------- */

export type Totals = {
  events: number;
  bubbleOpens: number;
  views: number;
  nexts: number;
  backs: number;
  leads: number;
  closes: number;
};

export function getTotals(scope?: AnalyticsScope): Totals {
  const all = readEvents();
  const rows = scope ? all.filter((e) => sameScope(e.scope, scope)) : all;
  const t: Totals = {
    events: rows.length,
    bubbleOpens: 0,
    views: 0,
    nexts: 0,
    backs: 0,
    leads: 0,
    closes: 0,
  };
  for (const e of rows) {
    if (e.type === "bubble_open") t.bubbleOpens++;
    else if (e.type === "view_widget") t.views++;
    else if (e.type === "step_next") t.nexts++;
    else if (e.type === "step_back") t.backs++;
    else if (e.type === "lead_submit") t.leads++;
    else if (e.type === "close_widget") t.closes++;
  }
  return t;
}

export type DailyPoint = { dateISO: string; count: number };

export function getDailyCounts(scope?: AnalyticsScope, type?: EventType, days = 14): DailyPoint[] {
  const start = startOfDay(Date.now() - (days - 1) * DAY);
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start + i * DAY);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  const all = readEvents();
  const rows = all.filter((e) => {
    if (scope && !sameScope(e.scope, scope)) return false;
    if (type && e.type !== type) return false;
    return e.ts >= start;
  });

  for (const e of rows) {
    const key = new Date(e.ts).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return Array.from(buckets.entries()).map(([dateISO, count]) => ({ dateISO, count }));
}

export function getConversion(scope?: AnalyticsScope) {
  const t = getTotals(scope);
  const opens = Math.max(1, t.bubbleOpens + t.views); // denominator (view or open)
  const cr = (t.leads / opens) * 100;
  return { rate: cr, numerator: t.leads, denominator: opens };
}

/* ---------------- Utils ---------------- */

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function sameScope(a: AnalyticsScope, b: AnalyticsScope) {
  return a.kind === b.kind && ((a.kind === "inst" && a.id === (b as any).id) || (a.kind === "bot" && a.key === (b as any).key));
}

/* ---------------- Browser Helper (optional) ---------------- */

// Minimal global shim so external pages (or the /widget) can record:
declare global {
  interface Window {
    BotAnalytics?: { track: (type: EventType, scope: AnalyticsScope, meta?: Record<string, any>) => void };
  }
}

if (typeof window !== "undefined") {
  window.BotAnalytics = {
    track: (type, scope, meta) => trackEvent(type, scope, meta),
  };
}
