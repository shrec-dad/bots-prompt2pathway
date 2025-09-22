// src/lib/templates.ts
// Registry of prebuilt flows used by the Builder.
// Keys MUST match the pattern `${currentBot}_${plan.toLowerCase()}`
// Example: "LeadQualifier_basic", "LeadQualifier_custom"

import type { Node, Edge } from "reactflow";

export type Template = { nodes: Node[]; edges: Edge[] };
export type TemplateKey = "LeadQualifier_basic" | "LeadQualifier_custom";

/** simple id factory so every node/edge has a unique, stable-ish id */
const makeId = (() => {
  let n = 1;
  return () => String(n++);
})();

// ----- small helpers to build nodes quickly -----

const message = (label: string, text: string, x: number, y: number): Node => ({
  id: makeId(),
  type: "message",
  position: { x, y },
  data: { title: label, text },
});

const inputNode = (
  label: string,
  placeholder: string,
  x: number,
  y: number
): Node => ({
  id: makeId(),
  type: "inputNode",
  position: { x, y },
  data: { label, placeholder },
});

const choice = (
  label: string,
  options: string[],
  x: number,
  y: number
): Node => ({
  id: makeId(),
  type: "choiceNode",
  position: { x, y },
  data: { label, options },
});

const action = (
  label: string,
  actionName: string,
  destination: string,
  x: number,
  y: number
): Node => ({
  id: makeId(),
  type: "actionNode",
  position: { x, y },
  data: { label, action: actionName, destination },
});

const edge = (from: Node, to: Node, lbl?: string): Edge => ({
  id: makeId(),
  source: from.id,
  target: to.id,
  label: lbl,
  type: "smoothstep",
});

// ----- TEMPLATES -----

/** Basic Lead Qualifier:
 *  Message -> Input(email) -> Choice(budget) -> Action(notify)
 */
const LeadQualifier_basic = (): Template => {
  const a = message("Lead Qualifier", "Welcome! How can I help?", 100, 220);
  const b = inputNode(
    "What's your email?",
    "name@company.com",
    430,
    200
  );
  const c = choice("Budget range?", ["< $1k", "$1k–$3k", "$3k+"], 430, 360);
  const d = action("Notify team", "sendEmail", "admin@example.com", 820, 260);

  return {
    nodes: [a, b, c, d],
    edges: [edge(a, b), edge(b, c), edge(c, d, "submit")],
  };
};

/** Custom Lead Qualifier:
 *  Message -> Input(name) -> Input(email optional) -> Choice(timeline) -> Action(score+route)
 *  (Slightly richer, more steps and different copy)
 */
const LeadQualifier_custom = (): Template => {
  const a = message(
    "Lead Qualifier (Custom)",
    "Quick few questions to route you best.",
    80,
    200
  );
  const b = inputNode("Your name", "Jane Doe", 420, 170);
  const c = inputNode("Email (optional)", "jane@company.com", 420, 270);
  const d = choice(
    "Timeline",
    ["ASAP", "2–4 weeks", "Later"],
    420,
    380
  );
  const e = action(
    "Score + route",
    "scoreAndRoute",
    "crm@internal",
    820,
    280
  );

  return {
    nodes: [a, b, c, d, e],
    edges: [edge(a, b), edge(b, c), edge(c, d), edge(d, e, "submit")],
  };
};

// ----- PUBLIC REGISTRY -----
// IMPORTANT: keys must be exactly the string Builder computes:
// `${currentBot}_${plan.toLowerCase()}`

export const templates: Record<TemplateKey, Template> = {
  LeadQualifier_basic: LeadQualifier_basic(),
  LeadQualifier_custom: LeadQualifier_custom(),
};

export default templates;

