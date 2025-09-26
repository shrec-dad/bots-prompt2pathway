// src/lib/templates.ts
// Export all basic and custom flows so Builder can load them safely

export const templates = {
  // -----------------------
  // Appointment Booking Bot
  // -----------------------
  AppointmentBooking_basic: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Service selection" }, position: { x: 0, y: 120 } },
      { id: "end", type: "output", data: { label: "Thank you" }, position: { x: 0, y: 240 } },
    ],
    edges: [
      { id: "ab-e1", source: "welcome", target: "q1" },
      { id: "ab-e2", source: "q1", target: "end" },
    ],
  },
  AppointmentBooking_custom: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Service selection" }, position: { x: 0, y: 120 } },
      { id: "q2", data: { label: "Staff / Resources" }, position: { x: 0, y: 240 } },
      { id: "q3", data: { label: "Payments / Recurring setup" }, position: { x: 0, y: 360 } },
      { id: "end", type: "output", data: { label: "Confirmation" }, position: { x: 0, y: 480 } },
    ],
    edges: [
      { id: "ac-e1", source: "welcome", target: "q1" },
      { id: "ac-e2", source: "q1", target: "q2" },
      { id: "ac-e3", source: "q2", target: "q3" },
      { id: "ac-e4", source: "q3", target: "end" },
    ],
  },

  // -----------------------
  // Customer Support Bot
  // -----------------------
  CustomerSupport_basic: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "FAQ / Category selector" }, position: { x: 0, y: 120 } },
      { id: "end", type: "output", data: { label: "Ticket created" }, position: { x: 0, y: 240 } },
    ],
    edges: [
      { id: "csb-e1", source: "welcome", target: "q1" },
      { id: "csb-e2", source: "q1", target: "end" },
    ],
  },
  CustomerSupport_custom: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "FAQ / Category selector" }, position: { x: 0, y: 120 } },
      { id: "q2", data: { label: "AI-powered response / Sentiment" }, position: { x: 0, y: 240 } },
      { id: "q3", data: { label: "Escalation / CRM Ticket" }, position: { x: 0, y: 360 } },
      { id: "end", type: "output", data: { label: "Case resolved" }, position: { x: 0, y: 480 } },
    ],
    edges: [
      { id: "csc-e1", source: "welcome", target: "q1" },
      { id: "csc-e2", source: "q1", target: "q2" },
      { id: "csc-e3", source: "q2", target: "q3" },
      { id: "csc-e4", source: "q3", target: "end" },
    ],
  },

  // -----------------------
  // Waitlist Bot
  // -----------------------
  Waitlist_basic: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Capture name & email" }, position: { x: 0, y: 120 } },
      { id: "end", type: "output", data: { label: "Added to Waitlist" }, position: { x: 0, y: 240 } },
    ],
    edges: [
      { id: "wb-e1", source: "welcome", target: "q1" },
      { id: "wb-e2", source: "q1", target: "end" },
    ],
  },
  Waitlist_custom: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Capture name & email" }, position: { x: 0, y: 120 } },
      { id: "q2", data: { label: "Referral tracking" }, position: { x: 0, y: 240 } },
      { id: "q3", data: { label: "VIP Fast Track" }, position: { x: 0, y: 360 } },
      { id: "end", type: "output", data: { label: "Confirmation" }, position: { x: 0, y: 480 } },
    ],
    edges: [
      { id: "wc-e1", source: "welcome", target: "q1" },
      { id: "wc-e2", source: "q1", target: "q2" },
      { id: "wc-e3", source: "q2", target: "q3" },
      { id: "wc-e4", source: "q3", target: "end" },
    ],
  },

  // -----------------------
  // Social Media Bot
  // -----------------------
  SocialMedia_basic: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Platform selector" }, position: { x: 0, y: 120 } },
      { id: "end", type: "output", data: { label: "Auto-response sent" }, position: { x: 0, y: 240 } },
    ],
    edges: [
      { id: "smb-e1", source: "welcome", target: "q1" },
      { id: "smb-e2", source: "q1", target: "end" },
    ],
  },
  SocialMedia_custom: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Platform selector" }, position: { x: 0, y: 120 } },
      { id: "q2", data: { label: "Content recommendation / Contest" }, position: { x: 0, y: 240 } },
      { id: "q3", data: { label: "Analytics & Collaboration" }, position: { x: 0, y: 360 } },
      { id: "end", type: "output", data: { label: "Engagement complete" }, position: { x: 0, y: 480 } },
    ],
    edges: [
      { id: "smc-e1", source: "welcome", target: "q1" },
      { id: "smc-e2", source: "q1", target: "q2" },
      { id: "smc-e3", source: "q2", target: "q3" },
      { id: "smc-e4", source: "q3", target: "end" },
    ],
  },
};
