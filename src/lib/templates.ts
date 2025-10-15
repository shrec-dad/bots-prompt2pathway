// src/lib/templates.ts
// Central library of all bot templates used by the Builder.
// Each template is a ReactFlow graph: nodes[] + edges[].
// Node types supported by your Builder: "message" | "choice" | "input" | "action" | "phone" | "calendar".

import type { Edge, Node } from "@xyflow/react";

/* ---------- Types ---------- */

export type BotKey = string; // generalized so we can add custom keys beyond the built-ins
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

// Hidden list for “deleting” built-ins safely
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
   Built-in 6 Templates (graphs)
   ======================================================================== */
/**
 * NOTE ABOUT ACTION DATA:
 * For webhook actions we include:
 *  - data.to: "webhook://calendar/universal" or "webhook://crm/universal"
 *  - data.payload: JSON-template object (string values can contain {{placeholders}})
 *  - data.retryOnFail?: boolean (hint for your runner)
 *  - data.onErrorNext?: string (node id to jump to on failure)
 *
 * For email actions we use:
 *  - data.to: "mailto:{{settings.teamEmail}}"
 *  - data.subject / data.body templates (optional)
 *
 * Tag actions:
 *  - data.to: "system:tags"
 *  - data.tags: string[]
 */

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
      data: { label: "Your email", placeholder: "name@example.com", required: true },
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
      data: { label: "Main pain point", placeholder: "Briefly describe your challenge…", multiline: true },
      position: { x: 580, y: 340 },
    },
    {
      id: id("tagLeadQ", 71),
      type: "action",
      data: { label: "Tag", to: "system:tags", tags: ["lead-qualifier", "basic"] },
      position: { x: 320, y: 450 },
    },
    {
      id: id("submitEmail", 8),
      type: "action",
      data: {
        label: "Email lead to team",
        to: "mailto:{{settings.teamEmail}}",
        subject: "New Lead ({{company}})",
        body:
          "Name: {{email}}\nPhone: {{phone}}\nCompany: {{company}}\nBudget: {{budget}}\nTimeline: {{timeline}}\nNotes: {{pain}}",
      },
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
    { id: "e7-71", source: id("pain", 7), target: id("tagLeadQ", 71), type: "smoothstep" },
    { id: "e71-8", source: id("tagLeadQ", 71), target: id("submitEmail", 8), type: "smoothstep" },
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
      data: { label: "Tag & Categorize", to: "system:tags", tags: ["lead-qualifier", "custom", "scored"] },
      position: { x: 200, y: 650 },
    },
    {
      id: id("crm", 12),
      type: "action",
      data: {
        label: "CRM Webhook",
        to: "webhook://crm/universal",
        retryOnFail: true,
        onErrorNext: id("submitEmail", 8),
        payload: {
          type: "lead.create",
          source: "lead-qualifier",
          lead: {
            email: "{{email}}",
            phone: "{{phone}}",
            company: "{{company}}",
            budget: "{{budget}}",
            timeline: "{{timeline}}",
            note: "{{pain}}",
          },
          instanceId: "{{inst_id}}",
        },
      },
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
    ...LeadQualifier_basic.edges.filter((e) => e.id !== "e7-71" && e.id !== "e71-8" && e.id !== "e8-9"),
    { id: "e7-10", source: id("pain", 7), target: id("score", 10), type: "smoothstep" },
    { id: "e10-11", source: id("score", 10), target: id("tags", 11), type: "smoothstep" },
    { id: "e11-12", source: id("tags", 11), target: id("crm", 12), type: "smoothstep" },
    { id: "e12-13", source: id("crm", 12), target: id("abtest", 13), type: "smoothstep" },
    { id: "e13-14", source: id("abtest", 13), target: id("dupcheck", 14), type: "smoothstep" },
    { id: "e14-8", source: id("dupcheck", 14), target: id("submitEmail", 8), type: "smoothstep" },
    { id: "e8-9", source: id("submitEmail", 8), target: id("thanks", 9), type: "smoothstep" },
  ],
};

/* ====== Appointment Booking (refined to use a calendar node) ====== */

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
      id: id("calendar", 3),
      type: "calendar",
      data: {
        label: "Choose a time",
        // Optional hints your runtime/renderer may use:
        durationMins: 30,
        timezone: "{{visitor.tz}}",
      },
      position: { x: 320, y: 190 },
    },
    {
      id: id("contact", 5),
      type: "input",
      data: { label: "Your email", placeholder: "name@example.com", required: true },
      position: { x: 580, y: 190 },
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
    { id: "e2-3", source: id("service", 2), target: id("calendar", 3), type: "smoothstep" },
    { id: "e3-5", source: id("calendar", 3), target: id("contact", 5), type: "smoothstep" },
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
    // same as basic, plus custom branches
    { id: "e1-2", source: id("welcome", 1), target: id("service", 2), type: "smoothstep" },
    { id: "e2-3", source: id("service", 2), target: id("calendar", 3), type: "smoothstep" },
    { id: "e3-8", source: id("calendar", 3), target: id("staff", 8), type: "smoothstep" },
    { id: "e3-5", source: id("calendar", 3), target: id("contact", 5), type: "smoothstep" },
    { id: "e5-6", source: id("contact", 5), target: id("confirm", 6), type: "smoothstep" },
    { id: "e6-7", source: id("confirm", 6), target: id("ics", 7), type: "smoothstep" },
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
      data: { label: "Describe the problem", placeholder: "What happened?", multiline: true },
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
      data: {
        label: "Email Notification",
        to: "mailto:{{settings.teamEmail}}",
        subject: "Support Request ({{category}})",
        body: "Ref: {{ref}}\nIssue: {{desc}}",
      },
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
      data: { label: "AI Response (Knowledge)", to: "system:gpt_suggest" },
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
      data: {
        label: "Create CRM Ticket",
        to: "webhook://crm/ticket",
        payload: {
          type: "ticket.create",
          source: "customer-support",
          ticket: { ref: "{{ref}}", desc: "{{desc}}", category: "{{category}}", lang: "{{lang}}" },
        },
      },
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
      data: { label: "Email", placeholder: "name@example.com", required: true },
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

/* =========================== RECEPTIONIST ============================== */

const Receptionist_basic: BotTemplate = {
  nodes: [
    {
      id: id("r_welcome", 1),
      type: "message",
      data: {
        title: "Receptionist",
        text: "Hello! How may I direct your call or inquiry today?",
      },
      position: { x: 120, y: 40 },
    },
    {
      id: id("r_option", 2),
      type: "choice",
      data: {
        label: "Choose an option",
        options: ["Schedule Appointment", "Leave Message", "General Question"],
      },
      position: { x: 120, y: 200 },
    },
    {
      id: id("r_name", 3),
      type: "input",
      data: { label: "Your name", placeholder: "John Doe", required: true },
      position: { x: 440, y: 200 },
    },
    {
      id: id("r_email", 4),
      type: "input",
      data: { label: "Your email", placeholder: "name@example.com", required: true },
      position: { x: 760, y: 200 },
    },
    {
      id: id("r_msg", 5),
      type: "input",
      data: {
        label: "Your message or request",
        placeholder: "Type your message here...",
        multiline: true,
      },
      position: { x: 120, y: 360 },
    },
    {
      id: id("r_tag_main", 6),
      type: "action",
      data: { label: "Tag", to: "system:tags", tags: ["receptionist", "basic"] },
      position: { x: 440, y: 360 },
    },
    {
      id: id("r_sendTeam", 7),
      type: "action",
      data: {
        label: "Send to team",
        to: "mailto:{{settings.teamEmail}}",
        subject: "Receptionist Message – {{r_option}}",
        body:
          "From: {{r_name}} <{{r_email}}>\nReason: {{r_option}}\n\nMessage:\n{{r_msg}}",
      },
      position: { x: 440, y: 460 },
    },
    {
      id: id("r_thanks", 8),
      type: "message",
      data: {
        title: "Thank you!",
        text: "Your message has been received. We'll get back to you soon.",
      },
      position: { x: 760, y: 460 },
    },
  ],
  edges: [
    { id: "re1-2", source: id("r_welcome", 1), target: id("r_option", 2), type: "smoothstep" },
    { id: "re2-3", source: id("r_option", 2), target: id("r_name", 3), type: "smoothstep" },
    { id: "re3-4", source: id("r_name", 3), target: id("r_email", 4), type: "smoothstep" },
    { id: "re2-5", source: id("r_option", 2), target: id("r_msg", 5), type: "smoothstep" },
    { id: "re5-6", source: id("r_msg", 5), target: id("r_tag_main", 6), type: "smoothstep" },
    { id: "re6-7", source: id("r_tag_main", 6), target: id("r_sendTeam", 7), type: "smoothstep" },
    { id: "re7-8", source: id("r_sendTeam", 7), target: id("r_thanks", 8), type: "smoothstep" },
  ],
};

const Receptionist_custom: BotTemplate = {
  nodes: [
    // reuse the basic nodes as a base
    ...Receptionist_basic.nodes.filter(
      (n) => ![id("r_tag_main", 6), id("r_sendTeam", 7), id("r_thanks", 8)].includes(n.id as string)
    ),

    // Branch: Calendar Booking (universal webhook)
    {
      id: id("r_book_tag", 20),
      type: "action",
      data: { label: "Tag (Booking)", to: "system:tags", tags: ["receptionist", "booking"] },
      position: { x: 620, y: 360 },
    },
    {
      id: id("r_calendar", 21),
      type: "action",
      data: {
        label: "Calendar Booking",
        to: "webhook://calendar/universal",
        retryOnFail: true,
        onErrorNext: id("r_sendTeam", 24),
        payload: {
          type: "calendar.create",
          source: "receptionist",
          customer: { name: "{{r_name}}", email: "{{r_email}}" },
          service: "{{r_option}}",
          notes: "{{r_msg}}",
          instanceId: "{{inst_id}}",
        },
      },
      position: { x: 840, y: 360 },
    },

    // Branch: CRM (lead)
    {
      id: id("r_crm_tag", 22),
      type: "action",
      data: { label: "Tag (Lead)", to: "system:tags", tags: ["receptionist", "lead"] },
      position: { x: 1060, y: 360 },
    },
    {
      id: id("r_crm", 23),
      type: "action",
      data: {
        label: "Send to CRM",
        to: "webhook://crm/universal",
        retryOnFail: true,
        onErrorNext: id("r_sendTeam", 24),
        payload: {
          type: "lead.create",
          source: "receptionist",
          lead: {
            name: "{{r_name}}",
            email: "{{r_email}}",
            intent: "{{r_option}}",
            note: "{{r_msg}}",
          },
          instanceId: "{{inst_id}}",
        },
      },
      position: { x: 1280, y: 360 },
    },

    // Smart fallback / human handoff
    {
      id: id("r_sendTeam", 24),
      type: "action",
      data: {
        label: "Send to team",
        to: "mailto:{{settings.teamEmail}}",
        subject: "Receptionist Handoff – {{r_option}}",
        body:
          "Could not auto-complete via webhook.\n\nFrom: {{r_name}} <{{r_email}}>\nReason: {{r_option}}\n\nMessage:\n{{r_msg}}",
      },
      position: { x: 780, y: 460 },
    },

    // AI Router (knowledge fallback)
    {
      id: id("r_ai", 25),
      type: "action",
      data: {
        label: "AI Assistant Routing",
        to: "system:ai_router",
        hints: ["faq", "pricing", "hours", "location"],
      },
      position: { x: 1100, y: 460 },
    },

    // Final confirmation
    {
      id: id("r_done", 26),
      type: "message",
      data: { title: "Thank you!", text: "We’ve got it and will follow up shortly." },
      position: { x: 1280, y: 520 },
    },
  ],
  edges: [
    // Base progression
    { id: "rc1-2", source: id("r_welcome", 1), target: id("r_option", 2), type: "smoothstep" },
    { id: "rc2-3", source: id("r_option", 2), target: id("r_name", 3), type: "smoothstep" },
    { id: "rc3-4", source: id("r_name", 3), target: id("r_email", 4), type: "smoothstep" },
    { id: "rc2-5", source: id("r_option", 2), target: id("r_msg", 5), type: "smoothstep" },

    // Branching actions (you can condition these in your runner by checking r_option)
    { id: "rc5-20", source: id("r_msg", 5), target: id("r_book_tag", 20), type: "smoothstep" },
    { id: "rc20-21", source: id("r_book_tag", 20), target: id("r_calendar", 21), type: "smoothstep" },

    { id: "rc21-22", source: id("r_calendar", 21), target: id("r_crm_tag", 22), type: "smoothstep" },
    { id: "rc22-23", source: id("r_crm_tag", 22), target: id("r_crm", 23), type: "smoothstep" },

    // Handoff + AI + Done
    { id: "rc21-24", source: id("r_calendar", 21), target: id("r_sendTeam", 24), type: "smoothstep" },
    { id: "rc23-24", source: id("r_crm", 23), target: id("r_sendTeam", 24), type: "smoothstep" },
    { id: "rc24-25", source: id("r_sendTeam", 24), target: id("r_ai", 25), type: "smoothstep" },
    { id: "rc25-26", source: id("r_ai", 25), target: id("r_done", 26), type: "smoothstep" },
  ],
};

/* ---------- Built-in registry (metadata for the 6 cards) ---------- */
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
  {
    key: "Receptionist",
    name: "Receptionist",
    emoji: "☎️",
    gradient: "from-sky-500/20 via-cyan-400/20 to-emerald-500/20",
    description:
      "Acts as a general business receptionist to answer, schedule, route, and take messages.",
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
  Receptionist_basic,
  Receptionist_custom,
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
   Delete / Hide APIs for template management
   ======================================================================== */

export function deleteTemplate(key: BotKey): { removed: boolean; kind: "builtin" | "custom" } {
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
