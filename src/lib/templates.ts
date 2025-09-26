// src/lib/templates.ts
// Named export: Builder.tsx expects { templates }

export const templates = {
  AppointmentBooking_basic: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Service selection" }, position: { x: 0, y: 100 } },
      { id: "end", type: "output", data: { label: "Thank you" }, position: { x: 0, y: 200 } },
    ],
    edges: [
      { id: "e1", source: "welcome", target: "q1" },
      { id: "e2", source: "q1", target: "end" },
    ],
  },

  AppointmentBooking_custom: {
    nodes: [
      { id: "welcome", type: "input", data: { label: "Welcome" }, position: { x: 0, y: 0 } },
      { id: "q1", data: { label: "Service selection" }, position: { x: 0, y: 100 } },
      { id: "q2", data: { label: "Staff / Resources" }, position: { x: 0, y: 200 } },
      { id: "end", type: "output", data: { label: "Thank you" }, position: { x: 0, y: 300 } },
    ],
    edges: [
      { id: "e1", source: "welcome", target: "q1" },
      { id: "e2", source: "q1", target: "q2" },
      { id: "e3", source: "q2", target: "end" },
    ],
  },
};

