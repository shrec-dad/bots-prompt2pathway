// src/pages/admin/Builder.tsx

import React, { useMemo, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { useAdminStore } from "@/lib/AdminStore";
import templates, { type TemplateKey } from "@/lib/templates";
import { NODE_TYPES } from "@/components/builder/nodeTypes";

/* ────────────────────────────────────────────────────────────────────────── */
/* Small UI helpers                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ title: string; hint?: string }> = ({
  title,
  hint,
}) => (
  <div className="flex items-center justify-between px-5 py-4 border-b">
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────── */
/* KPI right-rail cards                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const StatCard: React.FC<{
  label: string;
  value: string;
  delta?: string;
}> = ({ label, value, delta }) => (
  <div className="rounded-xl border border-border bg-background p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    {delta ? (
      <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
    ) : null}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────── */
/* Builder                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const PLANS = ["basic", "custom"] as const;
type Plan = (typeof PLANS)[number];

const Builder: React.FC = () => {
  const { currentBot, botPlan, includeNurture, setBotPlan, setIncludeNurture } =
    useAdminStore();

  // Force a fresh ReactFlow instance when plan changes (avoids stale layout)
  const [rfKey, setRfKey] = useState(0);
  const plan = (botPlan ?? "basic") as Plan;

  // Compute the template key like "LeadQualifier_basic"
  const tplKey = useMemo<TemplateKey | null>(() => {
    if (!currentBot) return null;
    const key = `${currentBot}_${plan}` as TemplateKey;
    return key in templates ? key : null;
  }, [currentBot, plan]);

  // Build nodes/edges from template
  const { nodes, edges } = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    if (!tplKey) return { nodes: [], edges: [] };
    const t = templates[tplKey];
    // templates store can be either a function () => {nodes, edges} or an object; normalize it.
    const out = typeof t === "function" ? t() : t;
    return out ?? { nodes: [], edges: [] };
  }, [tplKey, rfKey]);

  /* ─────────── layout: two columns (canvas left, KPIs right) ─────────── */
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* ── LEFT: Canvas + Config ─────────────────────────────────────── */}
        <div className="space-y-6">
          <Card className="h-[560px] overflow-hidden">
            <SectionTitle
              title="Bot Builder"
              hint={currentBot ? `${currentBot} • ${plan}` : "Select a bot"}
            />

            <div className="relative h-[500px]">
              {tplKey ? (
                <ReactFlow
                  key={rfKey}
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={NODE_TYPES}
                  fitView
                >
                  <MiniMap className="!bg-muted !rounded-md" />
                  <Controls />
                  <Background />
                </ReactFlow>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <div className="text-xl font-semibold text-foreground">
                      Canvas not ready
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose a different Bot/Plan combination or add a template
                      entry for:{" "}
                      <code className="rounded bg-muted px-1 py-[2px]">
                        {currentBot ? `${currentBot}_${plan}` : "—"}
                      </code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Configuration" />

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              {/* Plan toggles */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Bot Plan
                </div>
                <div className="flex gap-2">
                  {PLANS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setBotPlan(p);
                        setRfKey((k) => k + 1);
                      }}
                      className={`h-9 rounded-lg px-3 text-sm font-medium ${
                        plan === p
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                      type="button"
                    >
                      {p === "basic" ? "Basic Bot" : "Custom Bot"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nurture toggle */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Follow-up / Nurture
                </div>
                <label className="inline-flex select-none items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={!!includeNurture}
                    onChange={(e) => setIncludeNurture(e.target.checked)}
                  />
                  <span className="text-sm text-foreground">
                    Add follow-up after interaction
                  </span>
                </label>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  Upsell option: automatically nurture leads via Email/SMS/chat
                  after they interact with this bot.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT: KPI panel (replaces the old “blank box”) ───────────── */}
        <aside className="space-y-4">
          <Card>
            <SectionTitle title="Key Metrics" hint="last 30 days" />
            <div className="grid gap-3 p-4">
              <StatCard label="Active Bots" value="12" delta="+2 this month" />
              <StatCard label="Total Leads" value="1,247" delta="+12% MoM" />
              <StatCard
                label="Conversations"
                value="3,891"
                delta="+8% MoM"
              />
              <StatCard
                label="Conversion Rate"
                value="23.4%"
                delta="+2.1% MoM"
              />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Shortcuts" />
            <div className="p-4">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                <li>Preview this bot</li>
                <li>Export flow</li>
                <li>Duplicate bot</li>
                <li>Open Knowledge Base</li>
              </ul>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Builder;


  
         
       
