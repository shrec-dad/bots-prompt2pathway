// src/lib/templates.ts
// Unified 4-node flow for EVERY bot (Basic + Custom) to match your screenshot:
// Message → Input(email) → Choice(budget/options) → Action(notify)

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

// Reusable layout & data so every bot looks identical to your working flow
function makeStandardFlow(title: string, notifyLabel = "Notify team"): Template {
  return {
    nodes: [
      {
        id: "m1",
        type: "message",
        position: { x: -220, y: 0 },
        data: { title, text: "Welcome! How can I help?" },
      },
      {
        id: "i1",
        type: "input",
        position: { x: 110, y: -40 },
        data: { label: "What's your email?", field: "email", placeholder: "name@company.com" },
      },
      {
        id: "c1",
        type: "choice",
        position: { x: 40, y: 140 },
        data: {
          label: "Budget range?",
          options: ["< $1k", "$1k–$3k", "$3k+"],
        },
      },
      {
        id: "a1",
        type: "action",
        position: { x: 400, y: 10 },
        data: { label: notifyLabel, action: "sendEmail", to: "admin@example.com" },
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

// Exported registry — Builder.tsx imports { templates }
export const templates: Record<string, Template> = {
  // Lead Qualifier (you liked this flow — used verbatim)
  LeadQualifier_basic:  makeStandardFlow("Lead Qualifier", "Notify team"),
  LeadQualifier_custom: makeStandardFlow("Lead Qualifier", "Notify team"),

  // Appointment Booking
  AppointmentBooking_basic:  makeStandardFlow("Appointment Booking", "Send booking email"),
  AppointmentBooking_custom: makeStandardFlow("Appointment Booking", "Send booking email"),

  // Customer Support
  CustomerSupport_basic:  makeStandardFlow("Customer Support", "Create ticket email"),
  CustomerSupport_custom: makeStandardFlow("Customer Support", "Create ticket email"),

  // Waitlist
  Waitlist_basic:  makeStandardFlow("Waitlist", "Notify waitlist admin"),
  Waitlist_custom: makeStandardFlow("Waitlist", "Notify waitlist admin"),

  // Social Media
  SocialMedia_basic:  makeStandardFlow("Social Media", "Notify social team"),
  SocialMedia_custom: makeStandardFlow("Social Media", "Notify social team"),
};
