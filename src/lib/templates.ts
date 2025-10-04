// src/lib/templates.ts
// Central library of all bot templates used by the Builder.
// Each template is a ReactFlow graph: nodes[] + edges[].
// Node types expected by your Builder: "message" | "choice" | "input" | "action".

import type { Edge, Node } from "reactflow";

/* ---------- Types ---------- */

export type BotKey = string; // generalized so we can add custom keys beyond the 5
export type Mode = "basic" | "custom";

export type BotTemplate = {
  nodes: Node[];
  edges: Edge[];
};

export type TemplateDef = {
  key: BotKey;
  name: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
  description: string;
};

/* ---------- Storage Keys for Custom Templates ---------- */

const TPL_INDEX_KEY = "botTemplates:index"; // TemplateDef[]
const TPL_DATA_KEY = (key: string, mode: Mode) => `botTemplates:data:${key}_${mode}`;

// NEW: hidden list for “deleting” built-ins safely
const TPL_HIDDEN_KEY = "botTemplates:hiddenKeys"; // string[] of keys

/* ---------- Helpers ---------- */

function readJSON<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
}
const id = (p: string, n: number) => `${p}_${n}`;

/* =========================================================================
   Built-in 5 Templates (graphs)
   ======================================================================== */

const LeadQualifier_basic: BotTemplate = {
  nodes: [
    {
      id: id("welcome", 1),
      type: "message",
      data: { title: "Welcome", text: "Hi! Let’s see if we’re a fit. Ready to begin?" },
      position: { x: 60, y: 40 },
    },
    {
      id: id("email", 2),
      type: "input",
      data: { label: "Your email", placeholder: "name@example.com" },
      position: { x: 60, y: 190 },
    },
    {
      id: id("phone", 3),
      type: "input",
      data: { label: "Phone (optional)", placeholder: "(555) 555-5555" },
      position: { x: 320, y: 190 },
    },
    {
      id: id("company", 4),
      type: "input",
      data: { label: "Company / Business", placeholder: "Acme Co." },
      position: { x: 580, y: 190 },
    },
    {
      id: id("budget", 5),
      type: "choice",
      data: { label: "Budget range?", options: ["< $1k", "$1k–$3k", "$3k–$10k", "$10k+"] },
      position: { x: 60, y: 340 },
    },
    {
      id: id("timeline", 6),
      type: "choice",
      data: { label: "Timeline?", options: ["Urgent", "1–3 months", "3–6 months", "Flexible"] },
      position: { x: 320, y: 340 },
    },
    {
      id: id("pain", 7),
      type: "input",
      data: { label: "Main pain point", placeholder: "Briefly describe your challenge…" },
      position: { x: 580, y: 340 },
    },
    {
      id: id("submitEmail", 8),
      type: "action",
      data: { label: "Email lead to team", to: "mailto:admin@example.com" },
      position: { x: 320, y: 510 },
    },
    {
      id: id("thanks", 9),
      type: "message",
      data: { title: "Thanks!", text: "We’ll review and follow up with next steps." },
      position: { x: 580, y: 510 },
    },
  ],
  edges: [
    { id: "e1-2", source: id("welcome", 1), target: id("email", 2), type: "smoothstep" },
    { id: "e2-3", source: id("email", 2), target: id("phone", 3), type: "smoothstep" },
    { id: "e3-4", source: id("phone", 3), target: id("company", 4), type: "smoothstep" },
    { id: "e4-5", source: id("company", 4), target: id("budget", 5), type: "smoothstep" },
    { id: "e5-6", source: id("budget", 5), target: id("timeline", 6), type: "smoothstep" },
    { id: "e6-7", source: id("timeline", 6), target: id("pain", 7), type: "smoothstep" },
    { id: "e7-8", source: id("pain", 7), target: id("submitEmail", 8), type: "smoothstep" },
    { id: "e8-9", source: id("submitEmail", 8), target: id("thanks", 9), type: "smoothstep" },
  ],
};

const LeadQualifier_custom: BotTemplate = {
  nodes: [
    ...LeadQualifier_basic.nodes,
    {
      id: id("score", 10),
      type: "action",
      data: { label: "Advanced Lead Scoring", to: "system:lead_score_v2" },
      position: { x: 60, y: 510 },
    },
    {
      id: id("tags", 11),
      type: "action",
      data: { label: "Tag & Categorize", to: "system:apply_tags" },
      position: { x: 200, y: 650 },
    },
    {
      id: id("crm", 12),
      type: "action",
      data: { label: "CRM Webhook", to: "webhook://crm/universal" },
      position: { x: 420, y: 650 },
    },
    {
      id: id("abtest", 13),
      type: "action",
      data: { label: "A/B Test Bucket", to: "system:ab_bucket" },
      position: { x: 640, y: 650 },
    },
    {
      id: id("dupcheck", 14),
      type: "action",
      data: { label: "Duplicate Detection", to: "system:dedupe" },
      position: { x: 860, y: 650 },
    },
  ],
  edges: [
    ...LeadQualifier_basic.edges,
    { id: "e7-10", source: id("pain", 7), target: id("score", 10), type: "smoothstep" },
    { id: "e10-11", source: id("score", 10), target: id("tags", 11), type: "smoothstep" },
    { id: "e11-12", source: id("tags", 11), target: id("crm", 12), type: "smoothstep" },
    { id: "e12-13", source: id("crm", 12), target: id("abtest", 13), type: "smoothstep" },
    { id: "e13-14", source: id("abtest", 13), target: id("dupcheck", 14), type: "smoothstep" },
  ],
};

const AppointmentBooking_basic: BotTemplate = {
  nodes: [
    {
      id: id("welcome", 1),
      type: "message",
      data: { title: "Book Appointment", text: "Pick a service to get started." },
      position: { x: 60, y: 40 },
    },
    {
      id: id("service", 2),
      type: "choice",
      data: { label: "Service", options: ["Consultation", "Demo", "Support"] },
      position: { x: 60, y: 190 },
    },
    {
      id: id("date", 3),
      type: "input",
      data: { label: "Date", placeholder: "MM/DD/YYYY" },
      position: { x: 320, y: 190 },
    },
    {
      id: id("time", 4),
      type: "input",
      data: { label: "Time", placeholder: "HH:MM" },
      position: { x: 580, y: 190 },
    },
    {
      id: id("contact", 5),
      type: "input",
      data: { label: "Your email", placeholder: "name@example.com" },
      position: { x: 60, y: 340 },
    },
    {
      id: id("confirm", 6),
      type: "message",
      data: { title: "Confirmation", text: "We’ve booked it and sent a calendar invite." },
      position: { x: 320, y: 340 },
    },
    {
      id: id("ics", 7),
      type: "action",
      data: { label: "Generate .ics", to: "system:calendar_ics" },
      position: { x: 580, y: 340 },
    },
  ],
  edges: [
    { id: "e1-2", source: id("welcome", 1), target: id("service", 2), type: "smoothstep" },
    { id: "e2-3", source: id("service", 2), target: id("date", 3), type: "smoothstep" },
    { id: "e3-4", source: id("date", 3), target: id("time", 4), type: "smoothstep" },
    { id: "e4-5", source: id("time", 4), target: id("contact", 5), type: "smoothstep" },
    { id: "e5-6", source: id("contact", 5), target: id("confirm", 6), type: "smoothstep" },
    { id: "e6-7", source: id("confirm", 6), target: id("ics", 7), type: "smoothstep" },
  ],
};

const AppointmentBooking_custom: BotTemplate = {
  nodes: [
    ...AppointmentBooking_basic.nodes,
    {
      id: id("staff", 8),
      type: "choice",
      data: { label: "Preferred staff?", options: ["Any", "Alex", "Jordan", "Taylor"] },
      position: { x: 840, y: 190 },
    },
    {
      id: id("payment", 9),
      type: "action",
      data: { label: "Payment / Deposit", to: "webhook://payments/checkout" },
      position: { x: 840, y: 340 },
    },
    {
      id: id("calendarAPI", 10),
      type: "action",
      data: { label: "Calendar API", to: "webhook://calendar/universal" },
      position: { x: 1060, y: 340 },
    },
    {
      id: id("rules", 11),
      type: "action",
      data: { label: "Custom Booking Rules", to: "system:booking_rules" },
      position: { x: 1280, y: 340 },
    },
  ],
  edges: [
    ...AppointmentBooking_basic.edges,
    { id: "e4-8", source: id("time", 4), target: id("staff", 8), type: "smoothstep" },
    { id: "e7-9", source: id("ics", 7), target: id("payment", 9), type: "smoothstep" },
    { id: "e9-10", source: id("payment", 9), target: id("calendarAPI", 10), type: "smoothstep" },
    { id: "e10-11", source: id("calendarAPI", 10), target: id("rules", 11), type: "smoothstep" },
  ],
};

const CustomerSupport_basic: BotTemplate = {
  nodes: [
    {
      id: id("welcome", 1),
      type: "message",
      data: { title: "Support", text: "How can we help? Pick a category." },
      position: { x: 60, y: 40 },
    },
    {
      id: id("category", 2),
      type: "choice",
      data: { label: "Category", options: ["Orders", "Billing", "Returns", "Technical"] },
      position: { x: 60, y: 190 },
    },
    {
      id: id("ref", 3),
      type: "input",
      data: { label: "Order / Ref # (optional)", placeholder: "ABC123…" },
      position: { x: 320, y: 190 },
    },
    {
      id: id("desc", 4),
      type: "input",
      data: { label: "Describe the problem", placeholder: "What happened?" },
      position: { x: 580, y: 190 },
    },
    {
      id: id("hours", 5),
      type: "message",
      data: { title: "Business Hours", text: "Mon–Fri 9am–6pm. We’ll reply ASAP." },
      position: { x: 60, y: 340 },
    },
    {
      id: id("ticket", 6),
      type: "action",
      data: { label: "Create Ticket", to: "system:create_ticket" },
      position: { x: 320, y: 340 },
    },
    {
      id: id("notify", 7),
      type: "action",
      data: { label: "Email Notification", to: "mailto:support@example.com" },
      position: { x: 580, y: 340 },
    },
  ],
  edges: [
    { id: "e1-2", source: id("welcome", 1), target: id("category", 2), type: "smoothstep" },
    { id: "e2-3", source: id("category", 2), target: id("ref", 3), type: "smoothstep" },
    { id: "e3-4", source: id("ref", 3), target: id("desc", 4), type: "smoothstep" },
    { id: "e4-5", source: id("desc", 4), target: id("hours", 5), type: "smoothstep" },
    { id: "e5-6", source: id("hours", 5), target: id("ticket", 6), type: "smoothstep" },
    { id: "e6-7", source: id("ticket", 6), target: id("notify", 7), type: "smoothstep" },
  ],
};

const CustomerSupport_custom: BotTemplate = {
  nodes: [
    ...CustomerSupport_basic.nodes,
    {
      id: id("ai", 8),
      type: "action",
      data: { label: "AI Response (GPT)", to: "system:gpt_suggest" },
      position: { x: 840, y: 190 },
    },
    {
      id: id("lang", 9),
      type: "choice",
      data: { label: "Language", options: ["English", "Spanish", "French", "German"] },
      position: { x: 840, y: 340 },
    },
    {
      id: id("priority", 10),
      type: "action",
      data: { label: "Sentiment / Priority", to: "system:sentiment_route" },
      position: { x: 1060, y: 340 },
    },
    {
      id: id("crm", 11),
      type: "action",
      data: { label: "Create CRM Ticket", to: "webhook://crm/ticket" },
      position: { x: 1280, y: 340 },
    },
  ],
  edges: [
    ...CustomerSupport_basic.edges,
    { id: "e4-8", source: id("desc", 4), target: id("ai", 8), type: "smoothstep" },
    { id: "e8-9", source: id("ai", 8), target: id("lang", 9), type: "smoothstep" },
    { id: "e9-10", source: id("lang", 9), target: id("priority", 10), type: "smoothstep" },
    { id: "e10-11", source: id("priority", 10), target: id("crm", 11), type: "smoothstep" },
  ],
};

const Waitlist_basic: BotTemplate = {
  nodes: [
    {
      id: id("welcome", 1),
      type: "message",
      data: { title: "Join Waitlist", text: "Add your info and we’ll save your place in line." },
      position: { x: 60, y: 40 },
    },
    {
      id: id("email", 2),
      type: "input",
      data: { label: "Email", placeholder: "name@example.com" },
      position: { x: 60, y: 190 },
    },
    {
      id: id("phone", 3),
      type: "input",
      data: { label: "Phone (optional)", placeholder: "(555) 555-5555" },
      position: { x: 320, y: 190 },
    },
    {
      id: id("interest", 4),
      type: "choice",
      data: { label: "Interest level", options: ["Curious", "Very interested", "VIP"] },
      position: { x: 580, y: 190 },
    },
    {
      id: id("referral", 5),
      type: "input",
      data: { label: "Referral code (optional)", placeholder: "FRIEND123…" },
      position: { x: 60, y: 340 },
    },
    {
      id: id("queue", 6),
      type: "message",
      data: { title: "You’re In!", text: "We’ll email your position & updates." },
      position: { x: 320, y: 340 },
    },
    {
      id: id("export", 7),
      type: "action",
      data: { label: "Export to Sheet", to: "system:export_csv" },
      position: { x: 580, y: 340 },
    },
  ],
  edges: [
    { id: "e1-2", source: id("welcome", 1), target: id("email", 2), type: "smoothstep" },
    { id: "e2-3", source: id("email", 2), target: id("phone", 3), type: "smoothstep" },
    { id: "e3-4", source: id("phone", 3), target: id("interest", 4), type: "smoothstep" },
    { id: "e4-5", source: id("interest", 4), target: id("referral", 5), type: "smoothstep" },
    { id: "e5-6", source: id("referral", 5), target: id("queue", 6), type: "smoothstep" },
    { id: "e6-7", source: id("queue", 6), target: id("export", 7), type: "smoothstep" },
  ],
};

const Waitlist_custom: BotTemplate = {
  nodes: [
    ...Waitlist_basic.nodes,
    {
      id: id("vip", 8),
      type: "choice",
      data: { label: "VIP Fast-Track?", options: ["No", "Yes"] },
      position: { x: 840, y: 190 },
    },
    {
      id: id("deposit", 9),
      type: "action",
      data: { label: "Deposit / Pre-pay", to: "webhook://payments/deposit" },
      position: { x: 840, y: 340 },
    },
    {
      id: id("updates", 10),
      type: "action",
      data: { label: "Automated Updates", to: "system:automated_updates" },
      position: { x: 1060, y: 340 },
    },
    {
      id: id("rewards", 11),
      type: "action",
      data: { label: "Referral Rewards", to: "system:referral_rewards" },
      position: { x: 1280, y: 340 },
    },
  ],
  edges: [
    ...Waitlist_basic.edges,
    { id: "e6-8", source: id("queue", 6), target: id("vip", 8), type: "smoothstep" },
    { id: "e8-9", source: id("vip", 8), target: id("deposit", 9), type: "smoothstep" },
    { id: "e9-10", source: id("deposit", 9), target: id("updates", 10), type: "smoothstep" },
    { id: "e10-11", source: id("updates", 10), target: id("rewards", 11), type: "smoothstep" },
  ],
};

const SocialMedia_basic: BotTemplate = {
  nodes: [
    {
      id: id("welcome", 1),
      type: "message",
      data: { title: "Social Bot", text: "Pick a platform and how I should help." },
      position: { x: 60, y: 40 },
    },
    {
      id: id("platform", 2),
      type: "choice",
      data: { label: "Platform", options: ["Instagram", "Facebook", "Twitter/X", "TikTok"] },
      position: { x: 60, y: 190 },
    },
    {
      id: id("purpose", 3),
      type: "choice",
      data: { label: "I should…", options: ["Auto-reply DMs", "Manage comments", "Share links", "FAQ replies"] },
      position: { x: 320, y: 190 },
    },
    {
      id: id("contact", 4),
      type: "input",
      data: { label: "Contact capture (optional)", placeholder: "email or phone" },
      position: { x: 580, y: 190 },
    },
    {
      id: id("done", 5),
      type: "message",
      data: { title: "Saved", text: "Your social automation preferences are set." },
      position: { x: 320, y: 340 },
    },
  ],
  edges: [
    { id: "e1-2", source: id("welcome", 1), target: id("platform", 2), type: "smoothstep" },
    { id: "e2-3", source: id("platform", 2), target: id("purpose", 3), type: "smoothstep" },
    { id: "e3-4", source: id("purpose", 3), target: id("contact", 4), type: "smoothstep" },
    { id: "e4-5", source: id("contact", 4), target: id("done", 5), type: "smoothstep" },
  ],
};

const SocialMedia_custom: BotTemplate = {
  nodes: [
    ...SocialMedia_basic.nodes,
    {
      id: id("multip", 6),
      type: "action",
      data: { label: "Multi-platform Manager", to: "system:multi_platform" },
      position: { x: 840, y: 190 },
    },
    {
      id: id("recommend", 7),
      type: "action",
      data: { label: "Content Recommendations", to: "system:content_recs" },
      position: { x: 840, y: 340 },
    },
    {
      id: id("contest", 8),
      type: "action",
      data: { label: "Contest / Giveaway", to: "system:contest_mgr" },
      position: { x: 1060, y: 340 },
    },
    {
      id: id("analytics", 9),
      type: "action",
      data: { label: "Social Analytics", to: "system:social_analytics" },
      position: { x: 1280, y: 340 },
    },
  ],
  edges: [
    ...SocialMedia_basic.edges,
    { id: "e5-6", source: id("done", 5), target: id("multip", 6), type: "smoothstep" },
    { id: "e6-7", source: id("multip", 6), target: id("recommend", 7), type: "smoothstep" },
    { id: "e7-8", source: id("recommend", 7), target: id("contest", 8), type: "smoothstep" },
    { id: "e8-9", source: id("contest", 8), target: id("analytics", 9), type: "smoothstep" },
  ],
};

/* ---------- Built-in registry (metadata for the 5 cards) ---------- */
const BUILTIN_DEFS: TemplateDef[] = [
  {
    key: "LeadQualifier",
    name: "Lead Qualifier",
    emoji: "🎯",
    gradient: "from-purple-500/20 via-fuchsia-400/20 to-pink-500/20",
    description: "Qualify leads with scoring, validation and routing. Best for sales intake.",
  },
  {
    key: "AppointmentBooking",
    name: "Appointment Booking",
    emoji: "📅",
    gradient: "from-emerald-500/20 via-teal-400/20 to-cyan-500/20",
    description: "Offer services, show availability, confirm and remind automatically.",
  },
  {
    key: "CustomerSupport",
    name: "Customer Support",
    emoji: "🛟",
    gradient: "from-indigo-500/20 via-blue-400/20 to-sky-500/20",
    description: "Answer FAQs, create tickets, route priority issues and hand off to humans.",
  },
  {
    key: "Waitlist",
    name: "Waitlist",
    emoji: "⏳",
    gradient: "from-amber-500/25 via-orange-400/20 to-rose-500/20",
    description: "Collect interest, show queue status and notify customers.",
  },
  {
    key: "SocialMedia",
    name: "Social Media",
    emoji: "📣",
    gradient: "from-pink-500/20 via-rose-400/20 to-red-500/20",
    description: "Auto-DM replies, comment handling, and engagement prompts across platforms.",
  },
];

/* ---------- Built-in graphs map ---------- */
const builtinGraphs: Record<string, BotTemplate> = {
  LeadQualifier_basic,
  LeadQualifier_custom,
  AppointmentBooking_basic,
  AppointmentBooking_custom,
  CustomerSupport_basic,
  CustomerSupport_custom,
  Waitlist_basic,
  Waitlist_custom,
  SocialMedia_basic,
  SocialMedia_custom,
};

/* =========================================================================
   Public API
   ======================================================================== */

// Helper: is a key one of the built-ins?
export function isBuiltInKey(key: BotKey): boolean {
  return BUILTIN_DEFS.some((d) => d.key === key);
}

// Return built-ins (minus hidden) + any user-created TemplateDefs
export function listTemplateDefs(): TemplateDef[] {
  const custom = readJSON<TemplateDef[]>(TPL_INDEX_KEY, []);
  const hidden = readJSON<string[]>(TPL_HIDDEN_KEY, []);

  // Ensure unique keys (built-ins take precedence if same key somehow exists)
  const mergedMap = new Map<string, TemplateDef>();
  [...BUILTIN_DEFS, ...custom].forEach((d) => mergedMap.set(d.key, d));

  // Filter hidden
  return Array.from(mergedMap.values()).filter((d) => !hidden.includes(d.key));
}

// Create a new template definition + seed skeleton graphs for both modes
export function createTemplate(def: {
  name: string;
  key: string;
  emoji?: string;
  gradient?: string;
  description?: string;
}) {
  const trimmedKey = (def.key || def.name || "NewBot").trim();
  if (!trimmedKey) return;

  // prevent duplicate keys
  const existing = listTemplateDefs().some((d) => d.key === trimmedKey);
  if (existing) return;

  const tplDef: TemplateDef = {
    key: trimmedKey,
    name: def.name?.trim() || trimmedKey,
    emoji: def.emoji || "🤖",
    gradient: def.gradient || "from-purple-500/20 via-indigo-400/20 to-emerald-500/20",
    description: def.description || "Custom template",
  };

  const index = readJSON<TemplateDef[]>(TPL_INDEX_KEY, []);
  index.push(tplDef);
  writeJSON(TPL_INDEX_KEY, index);

  // seed a skeleton graph for both modes
  const skeleton: BotTemplate = {
    nodes: [
      {
        id: id("welcome", 1),
        type: "message",
        data: { title: "Welcome", text: "Start building your flow…" },
        position: { x: 80, y: 60 },
      },
    ],
    edges: [],
  };
  writeJSON(TPL_DATA_KEY(tplDef.key, "basic"), skeleton);
  writeJSON(TPL_DATA_KEY(tplDef.key, "custom"), skeleton);
}

// Save/replace a template graph for a given key + mode (used later if needed)
export function saveTemplateGraph(key: BotKey, mode: Mode, graph: BotTemplate) {
  writeJSON(TPL_DATA_KEY(key, mode), graph);
}

// Read a template graph for key+mode, preferring custom storage; fallback to built-ins
export function getTemplate(bot: BotKey, mode: Mode): BotTemplate | undefined {
  const custom = readJSON<BotTemplate | null>(TPL_DATA_KEY(bot, mode), null);
  if (custom) return custom;
  return builtinGraphs[`${bot}_${mode}`];
}

/* =========================================================================
   NEW: Delete / Hide APIs for template management
   ======================================================================== */

/**
 * For built-ins, we "hide" the key (reversible).
 * For customs, we remove index entry and both graphs.
 * Returns an object describing what happened.
 */
export function deleteTemplate(key: BotKey): {
  removed: boolean;
  kind: "builtin" | "custom";
} {
  if (isBuiltInKey(key)) {
    // hide built-in
    const hidden = readJSON<string[]>(TPL_HIDDEN_KEY, []);
    if (!hidden.includes(key)) {
      hidden.push(key);
      writeJSON(TPL_HIDDEN_KEY, hidden);
    }
    return { removed: true, kind: "builtin" };
  }

  // remove custom from index
  const index = readJSON<TemplateDef[]>(TPL_INDEX_KEY, []);
  const next = index.filter((d) => d.key !== key);
  writeJSON(TPL_INDEX_KEY, next);

  // remove both stored graphs
  try {
    localStorage.removeItem(TPL_DATA_KEY(key, "basic"));
    localStorage.removeItem(TPL_DATA_KEY(key, "custom"));
  } catch {}

  // Optional cleanup for per-bot keys (safe no-ops if missing)
  try {
    localStorage.removeItem(`botOverrides:${key}_basic`);
    localStorage.removeItem(`botOverrides:${key}_custom`);
    localStorage.removeItem(`botSettings:${key}`);
    localStorage.removeItem(`botKnowledge:${key}`);
  } catch {}

  return { removed: true, kind: "custom" };
}

/** Reverse the hide for a built-in (handy if you change your mind) */
export function unhideTemplate(key: BotKey) {
  const hidden = readJSON<string[]>(TPL_HIDDEN_KEY, []);
  const next = hidden.filter((k) => k !== key);
  writeJSON(TPL_HIDDEN_KEY, next);
}
