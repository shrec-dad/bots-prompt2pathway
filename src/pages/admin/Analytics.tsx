import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

type Metrics = {
  conversations: number;
  leadsCaptured: number;
  appointments: number;
  avgResponseSec: number;   // average first response time
  csat: number;             // 0..100
  messagesPerConversation: number;
  conversionRate: number;   // 0..100
  bounceRate: number;       // 0..100
};

const KEY = "analytics:metrics";

const header = "rounded-2xl border bg-white shadow-sm px-5 py-4 mb-6";
const block = "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100";
const row = "rounded-xl border bg-white px-4 py-3 font-extrabold";

export default function Analytics() {
  const initial = useMemo<Metrics>(
    () =>
      getJSON<Metrics>(KEY, {
        conversations: 0,
        leadsCaptured: 0,
        appointments: 0,
        avgResponseSec: 0,
        csat: 0,
        messagesPerConversation: 0,
        conversionRate: 0,
        bounceRate: 0,
      }),
    []
  );

  const [m, setM] = useState<Metrics>(initial);

  function save(next: Partial<Metrics>) {
    const merged = { ...m, ...next };
    setM(merged);
    setJSON(KEY, merged);
  }

  function reset() {
    if (!confirm("Reset metrics to zero?")) return;
    const zero: Metrics = {
      conversations: 0,
      leadsCaptured: 0,
      appointments: 0,
      avgResponseSec: 0,
      csat: 0,
      messagesPerConversation: 0,
      conversionRate: 0,
      bounceRate: 0,
    };
    setM(zero);
    setJSON(KEY, zero);
  }

  const input =
    "w-32 rounded-lg border px-3 py-1.5 font-bold text-right";

  return (
    <div className="w-full">
      <div className={header}>
        <div className="text-3xl font-extrabold">Analytics</div>
        <div className="text-sm text-foreground/70">
          Track performance, usage, and engagement metrics.
        </div>
      </div>

      <div className={block}>
        <div className="text-xl font-extrabold mb-3">Metrics</div>

        <div className="grid grid-cols-1 gap-3">
          {/* Primary Three */}
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Conversations</span>
              <input
                className={input}
                type="number"
                value={m.conversations}
                onChange={(e) => save({ conversations: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Leads Captured</span>
              <input
                className={input}
                type="number"
                value={m.leadsCaptured}
                onChange={(e) => save({ leadsCaptured: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Appointments Booked</span>
              <input
                className={input}
                type="number"
                value={m.appointments}
                onChange={(e) => save({ appointments: Number(e.target.value || 0) })}
              />
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Avg First Response (sec)</span>
              <input
                className={input}
                type="number"
                value={m.avgResponseSec}
                onChange={(e) => save({ avgResponseSec: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>CSAT (%)</span>
              <input
                className={input}
                type="number"
                value={m.csat}
                onChange={(e) => save({ csat: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Messages / Conversation</span>
              <input
                className={input}
                type="number"
                value={m.messagesPerConversation}
                onChange={(e) =>
                  save({ messagesPerConversation: Number(e.target.value || 0) })
                }
              />
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Conversion Rate (%)</span>
              <input
                className={input}
                type="number"
                value={m.conversionRate}
                onChange={(e) => save({ conversionRate: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <div className={row}>
            <div className="flex items-center justify-between">
              <span>Bounce Rate (%)</span>
              <input
                className={input}
                type="number"
                value={m.bounceRate}
                onChange={(e) => save({ bounceRate: Number(e.target.value || 0) })}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-rose-50"
            onClick={reset}
          >
            Reset Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
