// src/lib/templates.ts
import { Node, Edge } from "reactflow";

export type TemplateKey =
  | "LeadQualifier_basic"
  | "LeadQualifier_custom"
  | "AppointmentBooking_basic"
  | "AppointmentBooking_custom"
  | "CustomerSupport_basic"
  | "CustomerSupport_custom"
  | "Waitlist_basic"
  | "Waitlist_custom"
  | "SocialMedia_basic"
  | "SocialMedia_custom";

export type Template = { nodes: Node[]; edges: Edge[] };

const id = (() => {
  let n = 1;
  return () => String(n++);
})();

// --- Shared small helpers ---
const start = (label = "Start", x = 80, y = 80) => ({
  id: id(),
  type: "message",
  position: { x, y },
  data: { title: label, text: "Welcome! How can I help?" },
});

const input = (label: string, placeholder: string, x: number, y: number) => ({
  id: id(),
  type: "inputNode",
  position: { x, y },
  data: { label, placeholder },
});

const choice = (label: string, options: string[], x: number, y: number) => ({
  id: id(),
  type: "choiceNode",
  position: { x, y },
  data: { label, options },
});

const action = (label: string, x: number, y: number) => ({
  id: id(),
  type: "actionNode",
  position: { x, y },
  data: { label, action: "sendEmail", destination: "admin@example.com" },
});

const edge = (from: string, to: string, label?: string): Edge => ({
  id: id(),
  source: from,
  target: to,
  label,
  type: "smoothstep",
});

export const templates: Record<TemplateKey, Template> = {
  // --- Lead Qualifier ---
  LeadQualifier_basic: (() => {
    const a = start("Lead Qualifier");
    const b = input("What's your email?", "name@company.com", 360, 60);
    const c = choice("Budget range?", ["< $1k", "$1k–$3k", "$3k+"], 360, 200);
    const d = action("Notify team", 680, 130);
    return {
      nodes: [a, b, c, d],
      edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id, "submit")],
    };
  })(),
  LeadQualifier_custom: (() => {
    const a = start("Lead Qualifier (Custom)");
    const b = input("Email", "name@company.com", 360, 30);
    const c = input("Phone (optional)", "(555) 555-5555", 360, 150);
    const d = choice("Timeline", ["ASAP", "2–4 weeks", "Later"], 360, 270);
    const e = action("Score + route", 700, 160);
    return {
      nodes: [a, b, c, d, e],
      edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id), edge(d.id, e.id)],
    };
  })(),

  // --- Appointment Booking ---
  AppointmentBooking_basic: (() => {
    const a = start("Appointment Booking");
    const b = choice("Service", ["Consult", "Onboarding", "Support"], 360, 60);
    const c = input("Preferred date", "YYYY-MM-DD", 360, 180);
    const d = action("Send .ics + email", 680, 120);
    return { nodes: [a, b, c, d], edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id)] };
  })(),
  AppointmentBooking_custom: (() => {
    const a = start("Appointment Booking (Custom)");
    const b = choice("Staff", ["Alex", "Bri", "Casey"], 360, 40);
    const c = input("Date", "YYYY-MM-DD", 360, 160);
    const d = input("Time", "HH:MM", 360, 280);
    const e = action("Reserve slot + deposit", 700, 160);
    return { nodes: [a, b, c, d, e], edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id), edge(d.id, e.id)] };
  })(),

  // --- Customer Support ---
  CustomerSupport_basic: (() => {
    const a = start("Support Bot");
    const b = choice("Issue type", ["Order", "Billing", "Tech"], 360, 60);
    const c = input("Describe your issue", "Type here…", 360, 180);
    const d = action("Create ticket", 680, 120);
    return { nodes: [a, b, c, d], edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id)] };
  })(),
  CustomerSupport_custom: (() => {
    const a = start("Support (Custom)");
    const b = choice("Issue type", ["Order", "Billing", "Tech"], 360, 30);
    const c = input("Order # / Account", "12345", 360, 150);
    const d = action("Create ticket + escalate rules", 700, 90);
    return { nodes: [a, b, c, d], edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id)] };
  })(),

  // --- Waitlist ---
  Waitlist_basic: (() => {
    const a = start("Join Waitlist");
    const b = input("Email", "name@example.com", 360, 60);
    const c = action("Add to waitlist + confirm", 680, 60);
    return { nodes: [a, b, c], edges: [edge(a.id, b.id), edge(b.id, c.id)] };
  })(),
  Waitlist_custom: (() => {
    const a = start("Waitlist (Custom)");
    const b = input("Email", "name@example.com", 360, 40);
    const c = input("Phone (optional)", "(555) 555-5555", 360, 160);
    const d = choice("Interest level", ["Curious", "Interested", "Ready"], 360, 280);
    const e = action("Segment + drip", 700, 160);
    return { nodes: [a, b, c, d, e], edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id), edge(d.id, e.id)] };
  })(),

  // --- Social Media ---
  SocialMedia_basic: (() => {
    const a = start("Social DM Auto-Reply");
    const b = choice("Intent", ["FAQ", "Booking", "Support"], 360, 60);
    const c = action("Send link / CTA", 680, 60);
    return { nodes: [a, b, c], edges: [edge(a.id, b.id), edge(b.id, c.id)] };
  })(),
  SocialMedia_custom: (() => {
    const a = start("Social Concierge (Custom)");
    const b = choice("Intent", ["FAQ", "Booking", "Support", "Promo"], 360, 40);
    const c = input("Collect handle/email", "Optional", 360, 160);
    const d = action("CRM sync + follow-up", 700, 100);
    return { nodes: [a, b, c, d], edges: [edge(a.id, b.id), edge(b.id, c.id), edge(c.id, d.id)] };
  })(),
};

