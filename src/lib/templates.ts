// src/lib/templates.ts

// Minimal types for our React Flow payloads
type Position = { x: number; y: number };

type RFNode = {
  id: string;
  type?: "message" | "input" | "choice" | "action";
  position: Position;
  data: Record<string, any>;
};

type RFEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
};

type Flow = {
  nodes: RFNode[];
  edges: RFEdge[];
};

/**
 * Helper creators so all nodes render consistently with our custom nodeTypes:
 * - message / input / choice / action
 */
const message = (id: string, position: Position, title: string, body?: string): RFNode => ({
  id,
  type: "message",
  position,
  data: { title, body },
});

const inputNode = (
  id: string,
  position: Position,
  label: string,
  placeholder = "Type..."
): RFNode => ({
  id,
  type: "input",
  position,
  data: { title: label, placeholder },
});

const choice = (
  id: string,
  position: Position,
  label: string,
  options: string[]
): RFNode => ({
  id,
  type: "choice",
  position,
  data: { title: label, options },
});

const action = (
  id: string,
  position: Position,
  label: string,
  description?: string
): RFNode => ({
  id,
  type: "action",
  position,
  data: { title: label, description },
});

const edge = (id: string, source: string, target: string): RFEdge => ({
  id,
  source,
  target,
  type: "smoothstep",
});

/**
 * ========= Lead Qualifier (existing) =========
 */
const LeadQualifier_basic: Flow = {
  nodes: [
    message("lq_welcome", { x: 80, y: 20 }, "👋 Welcome! Let’s qualify your lead."),
    inputNode("lq_name", { x: 60, y: 120 }, "What's your name?"),
    inputNode("lq_email", { x: 60, y: 230 }, "What's your email?"),
    choice("lq_budget", { x: 60, y: 340 }, "Do you have a budget?", ["<$1k", "$1k–$5k", "$5k–$20k", "$20k+"]),
    message("lq_thanks", { x: 60, y: 520 }, "✅ Thanks! We’ll review and reach out."),
  ],
  edges: [
    edge("e1", "lq_welcome", "lq_name"),
    edge("e2", "lq_name", "lq_email"),
    edge("e3", "lq_email", "lq_budget"),
    edge("e4", "lq_budget", "lq_thanks"),
  ],
};

const LeadQualifier_custom: Flow = {
  nodes: [
    message("lqc_welcome", { x: 520, y: 20 }, "👋 Welcome! Advanced lead scoring"),
    inputNode("lqc_name", { x: 500, y: 120 }, "Full name"),
    inputNode("lqc_email", { x: 500, y: 200 }, "Email (validated)"),
    inputNode("lqc_company", { x: 500, y: 280 }, "Company name"),
    choice("lqc_budget", { x: 500, y: 360 }, "Budget range", ["<$1k", "$1k–$5k", "$5k–$20k", "$20k+"]),
    choice("lqc_timeline", { x: 500, y: 460 }, "Timeline / urgency", ["ASAP", "This month", "This quarter", "Exploring"]),
    action("lqc_route", { x: 500, y: 560 }, "🔗 Webhook / CRM routing", "Sends payload to your universal CRM endpoint"),
    message("lqc_done", { x: 500, y: 660 }, "✅ Scored + routed. You’ll get an email soon."),
  ],
  edges: [
    edge("e1", "lqc_welcome", "lqc_name"),
    edge("e2", "lqc_name", "lqc_email"),
    edge("e3", "lqc_email", "lqc_company"),
    edge("e4", "lqc_company", "lqc_budget"),
    edge("e5", "lqc_budget", "lqc_timeline"),
    edge("e6", "lqc_timeline", "lqc_route"),
    edge("e7", "lqc_route", "lqc_done"),
  ],
};

/**
 * ========= Appointment Booking (existing) =========
 */
const AppointmentBooking_basic: Flow = {
  nodes: [
    message("ab_welcome", { x: 108, y: 20 }, "📅 Welcome! Let’s book your appointment."),
    choice("ab_service", { x: 90, y: 120 }, "Which service?", ["Consultation", "Demo", "Support"]),
    inputNode("ab_date", { x: 90, y: 260 }, "Preferred date?"),
    inputNode("ab_time", { x: 90, y: 350 }, "Preferred time?"),
    inputNode("ab_email", { x: 90, y: 440 }, "Your email?"),
    message("ab_done", { x: 90, y: 540 }, "✅ Request captured. You’ll get a confirmation."),
  ],
  edges: [
    edge("e1", "ab_welcome", "ab_service"),
    edge("e2", "ab_service", "ab_date"),
    edge("e3", "ab_date", "ab_time"),
    edge("e4", "ab_time", "ab_email"),
    edge("e5", "ab_email", "ab_done"),
  ],
};

const AppointmentBooking_custom: Flow = {
  nodes: [
    message("abc_welcome", { x: 520, y: 20 }, "📅 Smart Availability & Rules"),
    choice("abc_service", { x: 500, y: 120 }, "Select appointment type", ["Consultation", "Demo", "Training", "Onboarding"]),
    inputNode("abc_duration", { x: 500, y: 240 }, "Duration/min"),
    choice("abc_staff", { x: 500, y: 330 }, "Preferred staff?", ["Any", "Alex", "Jordan", "Taylor"]),
    inputNode("abc_date", { x: 500, y: 420 }, "Preferred date"),
    inputNode("abc_time", { x: 500, y: 500 }, "Preferred time"),
    action("abc_webhook", { x: 500, y: 580 }, "🔗 Webhook (universal calendar)", "Sends booking request to your adapter"),
    message("abc_done", { x: 500, y: 660 }, "✅ Booking submitted. Await confirmation."),
  ],
  edges: [
    edge("e1", "abc_welcome", "abc_service"),
    edge("e2", "abc_service", "abc_duration"),
    edge("e3", "abc_duration", "abc_staff"),
    edge("e4", "abc_staff", "abc_date"),
    edge("e5", "abc_date", "abc_time"),
    edge("e6", "abc_time", "abc_webhook"),
    edge("e7", "abc_webhook", "abc_done"),
  ],
};

/**
 * ========= Customer Support (existing) =========
 */
const CustomerSupport_basic: Flow = {
  nodes: [
    message("cs_welcome", { x: 80, y: 20 }, "🙌 Welcome to Support!"),
    choice("cs_category", { x: 60, y: 120 }, "Choose a category", ["Orders", "Tech", "Billing"]),
    inputNode("cs_issue", { x: 60, y: 260 }, "Describe your issue"),
    message("cs_ticket", { x: 60, y: 360 }, "✅ Ticket created. Our team will contact you."),
  ],
  edges: [
    edge("e1", "cs_welcome", "cs_category"),
    edge("e2", "cs_category", "cs_issue"),
    edge("e3", "cs_issue", "cs_ticket"),
  ],
};

const CustomerSupport_custom: Flow = {
  nodes: [
    message("csc_welcome", { x: 520, y: 20 }, "🤖 GPT-powered Support"),
    choice("csc_lang", { x: 500, y: 120 }, "Language", ["English", "Spanish", "French"]),
    inputNode("csc_issue", { x: 500, y: 210 }, "Describe your issue"),
    choice("csc_priority", { x: 500, y: 300 }, "Priority", ["Low", "Normal", "High", "Urgent"]),
    action("csc_crm", { x: 500, y: 400 }, "🔗 CRM Ticket", "Creates/updates ticket via webhook"),
    message("csc_done", { x: 500, y: 500 }, "✅ Ticket recorded. Auto-reply sent."),
  ],
  edges: [
    edge("e1", "csc_welcome", "csc_lang"),
    edge("e2", "csc_lang", "csc_issue"),
    edge("e3", "csc_issue", "csc_priority"),
    edge("e4", "csc_priority", "csc_crm"),
    edge("e5", "csc_crm", "csc_done"),
  ],
};

/**
 * ========= Waitlist (existing) =========
 */
const Waitlist_basic: Flow = {
  nodes: [
    message("wl_welcome", { x: 80, y: 20 }, "⏳ Join our waitlist!"),
    inputNode("wl_name", { x: 60, y: 120 }, "What's your name?"),
    inputNode("wl_email", { x: 60, y: 220 }, "What's your email?"),
    message("wl_added", { x: 60, y: 320 }, "✅ You’re added to the list!"),
  ],
  edges: [
    edge("e1", "wl_welcome", "wl_name"),
    edge("e2", "wl_name", "wl_email"),
    edge("e3", "wl_email", "wl_added"),
  ],
};

const Waitlist_custom: Flow = {
  nodes: [
    message("wlc_welcome", { x: 520, y: 20 }, "⏳ VIP Waitlist Experience"),
    inputNode("wlc_name", { x: 500, y: 120 }, "Full name"),
    inputNode("wlc_email", { x: 500, y: 200 }, "Email"),
    choice("wlc_interest", { x: 500, y: 280 }, "Interest level", ["Curious", "Interested", "Very Interested"]),
    action("wlc_webhook", { x: 500, y: 380 }, "🔗 Webhook: add to list + nurture", "Sends to universal CRM + email"),
    message("wlc_done", { x: 500, y: 480 }, "✅ Added! You’ll receive updates."),
  ],
  edges: [
    edge("e1", "wlc_welcome", "wlc_name"),
    edge("e2", "wlc_name", "wlc_email"),
    edge("e3", "wlc_email", "wlc_interest"),
    edge("e4", "wlc_interest", "wlc_webhook"),
    edge("e5", "wlc_webhook", "wlc_done"),
  ],
};

/**
 * ========= Social Media (NEW) =========
 * Basic = quick auto-replies + contact capture
 * Custom = multi-platform + feature selection + tone/keywords + webhook hooks
 */
const SocialMedia_basic: Flow = {
  nodes: [
    message("sm_welcome", { x: 80, y: 20 }, "📣 Social Media Assistant", "Auto-DM replies, comment handling, quick capture."),
    choice("sm_platform", { x: 60, y: 120 }, "Which platform?", ["Facebook", "Instagram", "Twitter/X", "TikTok"]),
    inputNode("sm_question", { x: 60, y: 240 }, "Common question or comment?"),
    action("sm_autoreply", { x: 60, y: 330 }, "⚙️ Auto-Reply (placeholder)", "Simulates a canned reply"),
    choice("sm_capture", { x: 60, y: 430 }, "Capture contact from DMs?", ["Yes", "No"]),
    inputNode("sm_email", { x: 60, y: 520 }, "Email (optional)"),
    message("sm_done", { x: 60, y: 610 }, "✅ Saved. You’ll receive a copy via email."),
  ],
  edges: [
    edge("e1", "sm_welcome", "sm_platform"),
    edge("e2", "sm_platform", "sm_question"),
    edge("e3", "sm_question", "sm_autoreply"),
    edge("e4", "sm_autoreply", "sm_capture"),
    edge("e5", "sm_capture", "sm_email"),
    edge("e6", "sm_email", "sm_done"),
  ],
};

const SocialMedia_custom: Flow = {
  nodes: [
    message("smc_welcome", { x: 520, y: 20 }, "📣 Social Media Pro", "Multi-platform + tone + webhook actions"),
    choice("smc_platforms", { x: 500, y: 120 }, "Select platforms", ["Facebook", "Instagram", "Twitter/X", "TikTok", "LinkedIn"]),
    choice("smc_features", { x: 500, y: 240 }, "Choose features", [
      "Auto-DM Replies",
      "Comment Moderation",
      "FAQ Responses",
      "Link Sharing",
      "Schedule Prompt",
    ]),
    inputNode("smc_tone", { x: 500, y: 380 }, "Brand tone (e.g., Friendly, Bold)"),
    inputNode("smc_keywords", { x: 500, y: 460 }, "Keywords to watch"),
    action("smc_webhook", { x: 500, y: 540 }, "🔗 Webhook: universal CRM", "Sends captured contacts & events"),
    action("smc_scheduler", { x: 500, y: 620 }, "🗓️ Schedule Content Prompt", "Placeholder for content planning"),
    message("smc_done", { x: 500, y: 700 }, "✅ Setup complete. You can iterate anytime."),
  ],
  edges: [
    edge("e1", "smc_welcome", "smc_platforms"),
    edge("e2", "smc_platforms", "smc_features"),
    edge("e3", "smc_features", "smc_tone"),
    edge("e4", "smc_tone", "smc_keywords"),
    edge("e5", "smc_keywords", "smc_webhook"),
    edge("e6", "smc_webhook", "smc_scheduler"),
    edge("e7", "smc_scheduler", "smc_done"),
  ],
};

/**
 * Master registry:
 * Keys must match `${currentBot}_${plan}` (plan is lowercased).
 * currentBot values expected in the app:
 *  "LeadQualifier" | "AppointmentBooking" | "CustomerSupport" | "Waitlist" | "SocialMedia"
 */
export const templates: Record<string, Flow> = {
  // Lead Qualifier
  LeadQualifier_basic: LeadQualifier_basic,
  LeadQualifier_custom: LeadQualifier_custom,

  // Appointment Booking
  AppointmentBooking_basic: AppointmentBooking_basic,
  AppointmentBooking_custom: AppointmentBooking_custom,

  // Customer Support
  CustomerSupport_basic: CustomerSupport_basic,
  CustomerSupport_custom: CustomerSupport_custom,

  // Waitlist
  Waitlist_basic: Waitlist_basic,
  Waitlist_custom: Waitlist_custom,

  // Social Media (NEW)
  SocialMedia_basic: SocialMedia_basic,
  SocialMedia_custom: SocialMedia_custom,
};

// Keep both styles working
export default templates;

