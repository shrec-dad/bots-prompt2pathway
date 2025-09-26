// src/lib/templates.ts
// Consistent 4-node layout (Message → Input → Choice → Action)
// but with PER-BOT labels/fields/actions so each bot is meaningful.

type NodeData = Record<string, any>;

type TplNode = {
  id: string;
  type: "message" | "input" | "choice" | "action";
  position: { x: number; y: number };
  data: NodeData;
};

type TplEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

type Template = {
  nodes: TplNode[];
  edges: TplEdge[];
};

type FlowConfig = {
  title: string;
  messageText: string;

  inputLabel: string;
  inputField: string;
  inputPlaceholder: string;

  choiceLabel: string;
  choiceOptions: string[];

  actionLabel: string;
  actionType: string; // e.g., "sendEmail", "bookOrICS", "createTicket", etc.
  actionTo: string;
};

// Reusable shape (your preferred layout & arrows)
function makeFlow(cfg: FlowConfig): Template {
  return {
    nodes: [
      {
        id: "m1",
        type: "message",
        position: { x: -220, y: 0 },
        data: { title: cfg.title, text: cfg.messageText },
      },
      {
        id: "i1",
        type: "input",
        position: { x: 110, y: -40 },
        data: { label: cfg.inputLabel, field: cfg.inputField, placeholder: cfg.inputPlaceholder },
      },
      {
        id: "c1",
        type: "choice",
        position: { x: 40, y: 140 },
        data: { label: cfg.choiceLabel, options: cfg.choiceOptions },
      },
      {
        id: "a1",
        type: "action",
        position: { x: 400, y: 10 },
        data: { label: cfg.actionLabel, action: cfg.actionType, to: cfg.actionTo },
      },
    ],
    edges: [
      { id: "e1", source: "m1", target: "i1" },
      { id: "e2", source: "m1", target: "c1" },
      { id: "e3", source: "i1", target: "a1", label: "submit" },
      { id: "e4", source: "c1", target: "a1" },
    ],
  };
}

// ---- Per-bot configs (Basic + Custom use the same base for now; you can extend later) ----

// Lead Qualifier
const LeadQualifierBase: FlowConfig = {
  title: "Lead Qualifier",
  messageText: "Welcome! Quick questions to route you fast.",
  inputLabel: "What's your email?",
  inputField: "email",
  inputPlaceholder: "name@company.com",
  choiceLabel: "Budget range?",
  choiceOptions: ["< $1k", "$1k–$3k", "$3k+"],
  actionLabel: "Score & notify",
  actionType: "scoreAndEmail",
  actionTo: "admin@example.com",
};

// Appointment Booking
const AppointmentBase: FlowConfig = {
  title: "Appointment Booking",
  messageText: "Pick a service and we’ll book you.",
  inputLabel: "Your email",
  inputField: "email",
  inputPlaceholder: "you@domain.com",
  choiceLabel: "Service",
  choiceOptions: ["Consultation", "Coaching", "Follow-up"],
  actionLabel: "Create calendar hold",
  actionType: "bookOrICS",
  actionTo: "admin@example.com",
};

// Customer Support
const SupportBase: FlowConfig = {
  title: "Customer Support",
  messageText: "Tell us what you need help with.",
  inputLabel: "Order # or email",
  inputField: "ticketKey",
  inputPlaceholder: "ORD123 or you@domain.com",
  choiceLabel: "Category",
  choiceOptions: ["Order issue", "Returns", "Billing", "Technical"],
  actionLabel: "Create ticket",
  actionType: "createTicket",
  actionTo: "support@example.com",
};

// Waitlist
const WaitlistBase: FlowConfig = {
  title: "Waitlist",
  messageText: "Join and we’ll keep you updated.",
  inputLabel: "Your email",
  inputField: "email",
  inputPlaceholder: "you@domain.com",
  choiceLabel: "Interest level",
  choiceOptions: ["Curious", "Very interested", "VIP"],
  actionLabel: "Add to waitlist",
  actionType: "addToWaitlist",
  actionTo: "admin@example.com",
};

// Social Media
const SocialBase: FlowConfig = {
  title: "Social Assistant",
  messageText: "Choose where you need help.",
  inputLabel: "Your handle",
  inputField: "handle",
  inputPlaceholder: "@yourname",
  choiceLabel: "Platform",
  choiceOptions: ["Instagram", "Facebook", "TikTok", "LinkedIn"],
  actionLabel: "Send auto-reply",
  actionType: "sendAutoResponse",
  actionTo: "social@example.com",
};

// ---- Exported registry used by Builder.tsx ----
export const templates: Record<string, Template> = {
  // Lead Qualifier
  LeadQualifier_basic:  makeFlow(LeadQualifierBase),
  LeadQualifier_custom: makeFlow(LeadQualifierBase),

  // Appointment Booking
  AppointmentBooking_basic:  makeFlow(AppointmentBase),
  AppointmentBooking_custom: makeFlow(AppointmentBase),

  // Customer Support
  CustomerSupport_basic:  makeFlow(SupportBase),
  CustomerSupport_custom: makeFlow(SupportBase),

  // Waitlist
  Waitlist_basic:  makeFlow(WaitlistBase),
  Waitlist_custom: makeFlow(WaitlistBase),

  // Social Media
  SocialMedia_basic:  makeFlow(SocialBase),
  SocialMedia_custom: makeFlow(SocialBase),
};
