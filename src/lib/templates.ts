// src/lib/templates.ts
import { Node, Edge } from "reactflow";

// Helper factories for nodes
const makeMessage = (id: string, label: string, x: number, y: number) => ({
  id,
  type: "messageNode",
  position: { x, y },
  data: { label },
});

const makeInput = (id: string, label: string, x: number, y: number) => ({
  id,
  type: "inputNode",
  position: { x, y },
  data: { label },
});

const makeChoice = (id: string, label: string, options: string[], x: number, y: number) => ({
  id,
  type: "choiceNode",
  position: { x, y },
  data: { label, options },
});

const makeAction = (id: string, label: string, x: number, y: number) => ({
  id,
  type: "actionNode",
  position: { x, y },
  data: { label },
});

const edge = (id: string, source: string, target: string) => ({
  id,
  source,
  target,
  type: "smoothstep",
});

// -------------------- Templates --------------------

export const templates: Record<
  string,
  { nodes: Node[]; edges: Edge[] }
> = {
  // Lead Qualifier (already working in your build)
  LeadQualifier_basic: {
    nodes: [
      makeMessage("start", "👋 Welcome! Let's qualify your lead.", 0, 0),
      makeInput("q1", "What's your name?", 0, 120),
      makeInput("q2", "What's your email?", 0, 240),
      makeChoice("q3", "Do you have a budget?", ["<$1k", "$1k-$5k", "$5k+"], 0, 360),
      makeMessage("end", "✅ Thanks! We'll review your info.", 0, 480),
    ],
    edges: [
      edge("e1", "start", "q1"),
      edge("e2", "q1", "q2"),
      edge("e3", "q2", "q3"),
      edge("e4", "q3", "end"),
    ],
  },
  LeadQualifier_custom: {
    nodes: [
      makeMessage("start", "👋 Welcome to the advanced lead flow.", 0, 0),
      makeInput("q1", "What's your full name?", 0, 120),
      makeInput("q2", "Email & Phone?", 0, 240),
      makeChoice("q3", "Budget range?", ["<$1k", "$1k-$5k", "$5k-$20k", "$20k+"], 0, 360),
      makeChoice("q4", "Timeline to start?", ["ASAP", "1-3 months", "Later"], 0, 480),
      makeAction("route", "📩 Send lead to CRM", 0, 600),
      makeMessage("end", "✅ Done! You'll get follow-up shortly.", 0, 720),
    ],
    edges: [
      edge("e1", "start", "q1"),
      edge("e2", "q1", "q2"),
      edge("e3", "q2", "q3"),
      edge("e4", "q3", "q4"),
      edge("e5", "q4", "route"),
      edge("e6", "route", "end"),
    ],
  },

  // Appointment Booking
  AppointmentBooking_basic: {
    nodes: [
      makeMessage("start", "📅 Welcome! Let's book your appointment.", 0, 0),
      makeChoice("service", "Which service?", ["Consultation", "Demo", "Support"], 0, 140),
      makeInput("date", "Preferred date?", 0, 280),
      makeInput("time", "Preferred time?", 0, 400),
      makeMessage("end", "✅ Thank you, we'll confirm via email!", 0, 520),
    ],
    edges: [
      edge("e1", "start", "service"),
      edge("e2", "service", "date"),
      edge("e3", "date", "time"),
      edge("e4", "time", "end"),
    ],
  },
  AppointmentBooking_custom: {
    nodes: [
      makeMessage("start", "📅 Welcome to advanced booking.", 0, 0),
      makeChoice("service", "Which service type?", ["Consult", "Training", "VIP"], 0, 140),
      makeInput("staff", "Preferred staff?", 0, 280),
      makeInput("date", "Choose your date", 0, 420),
      makeInput("time", "Choose your time", 0, 540),
      makeAction("payment", "💳 Collect deposit", 0, 660),
      makeMessage("end", "✅ Booking request sent!", 0, 780),
    ],
    edges: [
      edge("e1", "start", "service"),
      edge("e2", "service", "staff"),
      edge("e3", "staff", "date"),
      edge("e4", "date", "time"),
      edge("e5", "time", "payment"),
      edge("e6", "payment", "end"),
    ],
  },

  // Customer Support
  CustomerSupport_basic: {
    nodes: [
      makeMessage("start", "🙋 Welcome to Support!", 0, 0),
      makeChoice("cat", "Choose a category", ["Orders", "Tech", "Billing"], 0, 140),
      makeInput("desc", "Describe your issue", 0, 280),
      makeMessage("end", "✅ Ticket created. Our team will contact you.", 0, 420),
    ],
    edges: [
      edge("e1", "start", "cat"),
      edge("e2", "cat", "desc"),
      edge("e3", "desc", "end"),
    ],
  },
  CustomerSupport_custom: {
    nodes: [
      makeMessage("start", "🙋 Advanced Support Assistant.", 0, 0),
      makeChoice("cat", "Select category", ["Orders", "Tech", "Billing", "Other"], 0, 140),
      makeInput("desc", "Please describe your issue", 0, 280),
      makeChoice("prio", "Priority level?", ["Low", "Medium", "High"], 0, 420),
      makeAction("ticket", "🎫 Create support ticket", 0, 560),
      makeMessage("end", "✅ Your ticket is logged. Expect updates soon.", 0, 700),
    ],
    edges: [
      edge("e1", "start", "cat"),
      edge("e2", "cat", "desc"),
      edge("e3", "desc", "prio"),
      edge("e4", "prio", "ticket"),
      edge("e5", "ticket", "end"),
    ],
  },

  // Waitlist
  Waitlist_basic: {
    nodes: [
      makeMessage("start", "⏳ Join our waitlist!", 0, 0),
      makeInput("name", "What's your name?", 0, 140),
      makeInput("email", "What's your email?", 0, 280),
      makeMessage("end", "✅ You're added to the list!", 0, 420),
    ],
    edges: [
      edge("e1", "start", "name"),
      edge("e2", "name", "email"),
      edge("e3", "email", "end"),
    ],
  },
  Waitlist_custom: {
    nodes: [
      makeMessage("start", "⏳ Advanced Waitlist Flow", 0, 0),
      makeInput("name", "Your full name?", 0, 140),
      makeInput("email", "Your email?", 0, 280),
      makeChoice("interest", "Interest level?", ["High", "Medium", "Low"], 0, 420),
      makeAction("priority", "⭐ Assign priority score", 0, 560),
      makeMessage("end", "✅ You're added with priority!", 0, 700),
    ],
    edges: [
      edge("e1", "start", "name"),
      edge("e2", "name", "email"),
      edge("e3", "email", "interest"),
      edge("e4", "interest", "priority"),
      edge("e5", "priority", "end"),
    ],
  },
};

export default templates;
