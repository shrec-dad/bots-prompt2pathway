// src/lib/templates.ts
export type NodeType = "welcome" | "input" | "choice" | "action" | "thank-you";
export type NodeDef = { id: string; type: NodeType; label: string };
export type EdgeDef = { id: string; source: string; target: string; label?: string };

export type Template = {
  id: string;
  name: string;
  nodes: NodeDef[];
  edges: EdgeDef[];
};

/** Helper builders */
function basicFlow(name: string): Template {
  return {
    id: name,
    name,
    nodes: [
      { id: "n1", type: "welcome",  label: "Welcome" },
      { id: "n2", type: "input",    label: "Capture Contact" },
      { id: "n3", type: "action",   label: "Process/Notify" },
      { id: "n4", type: "thank-you",label: "Thank You" }
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ]
  };
}

function customFlow(name: string): Template {
  return {
    id: name,
    name,
    nodes: [
      { id: "n1", type: "welcome",  label: "Welcome" },
      { id: "n2", type: "choice",   label: "Choose Path" },
      { id: "n3", type: "input",    label: "Capture Contact" },
      { id: "n4", type: "action",   label: "Score / Route" },
      { id: "n5", type: "action",   label: "Webhook / CRM" },
      { id: "n6", type: "thank-you",label: "Thank You" }
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3", label: "Path A" },
      { id: "e3", source: "n2", target: "n4", label: "Path B" },
      { id: "e4", source: "n3", target: "n4" },
      { id: "e5", source: "n4", target: "n5" },
      { id: "e6", source: "n5", target: "n6" },
    ]
  };
}

/** Lead qualifier specifics */
const LeadQualifier_basic: Template = {
  id: "LeadQualifier_basic",
  name: "Lead Qualifier (Basic)",
  nodes: [
    { id: "n1", type: "welcome",  label: "Welcome" },
    { id: "n2", type: "input",    label: "10 Questions (Editable)" },
    { id: "n3", type: "action",   label: "Score 0–100 + Notify" },
    { id: "n4", type: "thank-you",label: "Thank You" }
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n3" },
    { id: "e3", source: "n3", target: "n4" },
  ]
};

const LeadQualifier_custom: Template = {
  id: "LeadQualifier_custom",
  name: "Lead Qualifier (Custom)",
  nodes: [
    { id: "n1", type: "welcome",  label: "Welcome" },
    { id: "n2", type: "choice",   label: "Conditional Branching" },
    { id: "n3", type: "input",    label: "Custom Fields (Unlimited)" },
    { id: "n4", type: "action",   label: "Advanced Scoring" },
    { id: "n5", type: "action",   label: "Webhook → CRM" },
    { id: "n6", type: "thank-you",label: "Thank You" }
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n3", label: "Path A" },
    { id: "e3", source: "n2", target: "n4", label: "Path B" },
    { id: "e4", source: "n3", target: "n4" },
    { id: "e5", source: "n4", target: "n5" },
    { id: "e6", source: "n5", target: "n6" },
  ]
};

/** Other bots */
const AppointmentBooking_basic      = basicFlow("AppointmentBooking_basic");
const AppointmentBooking_custom     = customFlow("AppointmentBooking_custom");
const CustomerSupport_basic         = basicFlow("CustomerSupport_basic");
const CustomerSupport_custom        = customFlow("CustomerSupport_custom");
const Waitlist_basic                = basicFlow("Waitlist_basic");
const Waitlist_custom               = customFlow("Waitlist_custom");
const SocialMedia_basic             = basicFlow("SocialMedia_basic");
const SocialMedia_custom            = customFlow("SocialMedia_custom");

export const Templates: Template[] = [
  LeadQualifier_basic,
  LeadQualifier_custom,
  AppointmentBooking_basic,
  AppointmentBooking_custom,
  CustomerSupport_basic,
  CustomerSupport_custom,
  Waitlist_basic,
  Waitlist_custom,
  SocialMedia_basic,
  SocialMedia_custom
];
