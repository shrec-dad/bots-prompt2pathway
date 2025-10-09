/* ------------------------------------------------------------------------
 * Lightweight Analytics Tracker
 * ------------------------------------------------------------------------
 * - Public API: trackEvent(name, scope, props?)
 * - Persists a rolling event log (analytics.events.v1)
 * - Updates dashboard metrics (analytics.metrics.v2) used by pages/admin/Analytics.tsx
 * - Keeps small internal state (analytics.state.v1) for session timing & counters
 * ---------------------------------------------------------------------- */

type EventScope =
  | { kind: "inst"; id: string }  // specific client bot instance
  | { kind: "bot"; key: string }; // base template key

type EventName =
  | "bubble_open"
  | "step_next"
  | "step_back"
  | "close_widget"
  | "lead_submit";

type EventRecord = {
  ts: number;             // epoch ms
  name: EventName;
  scope: EventScope;
  props?: Record<string, any>;
};

const EVENTS_KEY = "analytics.events.v1";
const METRICS_KEY = "analytics.metrics.v2"; // matches Analytics.tsx AKEY
const STATE_KEY = "analytics.state.v1";     // internal helper state (sessions, counters)

/* ---------------- shared types with Analytics.tsx metrics ---------------- */
type Metrics = {
  conversations: number;
  leads: number;
  appointments: number;
  csatPct: number;         // 0–100
  avgResponseSecs: number; // (not computed here)
  conversionPct: number;   // 0–100

  dropoffPct: number;          // 0–100
  qualifiedLeads: number;      // count
  avgConversationSecs: number; // seconds
  handoffRatePct: number;      // 0–100
  peakChatTime: string;        // e.g., "2–3 PM"
};

const defaultMetrics: Metrics = {
  conversations: 0,
  leads: 0,
  appointments: 0,
  csatPct: 0,
  avgResponseSecs: 0,
  conversionPct: 0,

  dropoffPct: 0,
  qualifiedLeads: 0,
  avgConversationSecs: 0,
  handoffRatePct: 0,
  peakChatTime: "—",
};

/* ---------------- internal state for sessions & counters ---------------- */
type InternalState = {
  /** active session start times, keyed by scopeId */
  activeSessions: Record<string, number>;
  /** total completed session count (used for avgConversationSecs denominator) */
  completedSessions: number;
  /** drop-offs (close without lead) */
  dropoffs: number;
  /** hour bucket counts for peak time, key "HH" (00–23) */
  hourCounts: Record<string, number>;
};

const defaultState: InternalState = {
  activeSessions: {},
  completedSessions: 0,
  dropoffs: 0,
  hourCounts: {},
};

/* ---------------- storage helpers ---------------- */
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------------- small utils ---------------- */
function scopeId(scope: EventScope): string {
  return scope.kind === "inst" ? `inst:${scope.id}` : `bot:${scope.key}`;
}
function hourLabelFromDate(d: Date): { hourKey: string; pretty: string } {
  const h = d.getHours(); // 0-23
  const next = (h + 1) % 24;
  const fmt = (n: number) =>
    new Date(2000, 0, 1, n).toLocaleTimeString([], { hour: "numeric" }); // "2 AM", "3 PM"
  return { hourKey: String(h).padStart(2, "0"), pretty: `${fmt(h)}–${fmt(next)}` };
}
function recomputePeakChatTime(hourCounts: Record<string, number>): string {
  let bestKey = "";
  let bestVal = -1;
  for (const [k, v] of Object.entries(hourCounts)) {
    if (v > bestVal) {
      bestKey = k;
      bestVal = v;
    }
  }
  if (!bestKey) return "—";
  const h = parseInt(bestKey, 10);
  const d = new Date(2000, 0, 1, h);
  const next = new Date(2000, 0, 1, (h + 1) % 24);
  const fmt = (date: Date) => date.toLocaleTimeString([], { hour: "numeric" });
  return `${fmt(d)}–${fmt(next)}`;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/* ------------------------------------------------------------------------
 * Metrics update rules (heuristic but consistent with the dashboard)
 * ---------------------------------------------------------------------- */
function updateMetricsForEvent(name: EventName, evt: EventRecord) {
  const m = readJSON<Metrics>(METRICS_KEY, defaultMetrics);
  const st = readJSON<InternalState>(STATE_KEY, defaultState);

  const now = Date.now();
  const sid = scopeId(evt.scope);

  switch (name) {
    case "bubble_open": {
      // New conversation if not already active for this scope
      if (!st.activeSessions[sid]) {
        st.activeSessions[sid] = now;
        m.conversations += 1;
      }
      break;
    }

    case "lead_submit": {
      // Mark a successful conversion; close the session if any
      const startedAt = st.activeSessions[sid];
      if (startedAt) {
        const secs = Math.max(0, Math.round((now - startedAt) / 1000));
        // Update avgConversationSecs using completedSessions as denominator
        const n = st.completedSessions;
        m.avgConversationSecs = round1((m.avgConversationSecs * n + secs) / (n + 1));
        st.completedSessions = n + 1;

        // bucket hour of close
        const { hourKey } = hourLabelFromDate(new Date());
        st.hourCounts[hourKey] = (st.hourCounts[hourKey] || 0) + 1;
        m.peakChatTime = recomputePeakChatTime(st.hourCounts);

        // Close session
        delete st.activeSessions[sid];
      }

      m.leads += 1;
      // Guard against divide-by-zero
      if (m.conversations > 0) {
        m.conversionPct = round1((m.leads / m.conversations) * 100);
      }
      // Drop-off % derived from dropoffs/conversations
      if (m.conversations > 0) {
        m.dropoffPct = round1((st.dropoffs / m.conversations) * 100);
      }
      break;
    }

    case "close_widget": {
      // Only count a drop-off if a session was open but no lead was submitted
      const startedAt = st.activeSessions[sid];
      if (startedAt) {
        const secs = Math.max(0, Math.round((now - startedAt) / 1000));
        const n = st.completedSessions;
        m.avgConversationSecs = round1((m.avgConversationSecs * n + secs) / (n + 1));
        st.completedSessions = n + 1;

        // bucket hour of close
        const { hourKey } = hourLabelFromDate(new Date());
        st.hourCounts[hourKey] = (st.hourCounts[hourKey] || 0) + 1;
        m.peakChatTime = recomputePeakChatTime(st.hourCounts);

        // Treat as dropoff
        st.dropoffs += 1;
        delete st.activeSessions[sid];
      }
      if (m.conversations > 0) {
        m.dropoffPct = round1((st.dropoffs / m.conversations) * 100);
      }
      break;
    }

    // Navigation events are logged but don't mutate the summary directly
    case "step_next":
    case "step_back": {
      // no-op for aggregates; retained in event log
      break;
    }
  }

  writeJSON(METRICS_KEY, m);
  writeJSON(STATE_KEY, st);
}

/* ------------------------------------------------------------------------
 * Public API: trackEvent
 * ---------------------------------------------------------------------- */
export function trackEvent(
  name: EventName,
  scope: EventScope,
  props?: Record<string, any>
) {
  const evt: EventRecord = { ts: Date.now(), name, scope, props };

  // Append to rolling log (cap length to keep storage in check)
  const log = readJSON<EventRecord[]>(EVENTS_KEY, []);
  log.push(evt);
  // keep only last 500 events
  const trimmed = log.slice(-500);
  writeJSON(EVENTS_KEY, trimmed);

  // Update dashboard metrics
  updateMetricsForEvent(name, evt);
}

/* ------------------------------------------------------------------------
 * Optional helpers (could be used elsewhere)
 * ---------------------------------------------------------------------- */
export function getEvents(): EventRecord[] {
  return readJSON<EventRecord[]>(EVENTS_KEY, []);
}
export function getMetrics(): Metrics {
  return readJSON<Metrics>(METRICS_KEY, defaultMetrics);
}
export function resetAnalytics() {
  writeJSON(METRICS_KEY, defaultMetrics);
  writeJSON(STATE_KEY, defaultState);
  writeJSON(EVENTS_KEY, []);
}

