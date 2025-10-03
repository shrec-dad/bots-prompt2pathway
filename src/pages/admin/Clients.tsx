import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

type Client = {
  id: string;
  name: string;
  email: string;
  plan: "Starter" | "Professional" | "Enterprise";
  bots: number;
  leads: number;
  status: "Active" | "Paused";
  lastActivity: string; // human-ish text, e.g. "2 hours ago"
};

const KEY = "clients:list";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const headerCard =
  "rounded-2xl border bg-white shadow-sm mb-6 flex items-center justify-between px-5 py-4";
const statCard =
  "rounded-2xl border bg-card px-4 py-3 flex items-center gap-3";
const badge =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-border";
const actionBtn =
  "rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30";

export default function Clients() {
  const initial = useMemo<Client[]>(
    () =>
      getJSON<Client[]>(KEY, []), // no demo rows anymore
    []
  );

  const [clients, setClients] = useState<Client[]>(initial);
  const [open, setOpen] = useState(false);

  // add client form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Client["plan"]>("Starter");

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "Active").length;
  const totalBots = clients.reduce((a, c) => a + c.bots, 0);
  const totalLeads = clients.reduce((a, c) => a + c.leads, 0);

  function saveList(next: Client[]) {
    setClients(next);
    setJSON(KEY, next);
  }

  function addClient() {
    if (!name.trim()) return alert("Please enter a client name.");
    if (!email.trim()) return alert("Please enter a client email.");

    const now = new Date();
    const newClient: Client = {
      id: uid(),
      name: name.trim(),
      email: email.trim(),
      plan,
      bots: 0,
      leads: 0,
      status: "Active",
      lastActivity: "just now",
    };

    const next = [newClient, ...clients];
    saveList(next);

    // reset form
    setName("");
    setEmail("");
    setPlan("Starter");
    setOpen(false);
  }

  function removeClient(id: string) {
    if (!confirm("Remove this client? This only affects local data.")) return;
    const next = clients.filter((c) => c.id !== id);
    saveList(next);
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className={headerCard}>
        <div>
          <div className="text-3xl font-extrabold">Clients</div>
          <div className="text-sm text-foreground/70">
            Manage your clients and their bot configurations.
          </div>
        </div>
        <button className={actionBtn} onClick={() => setOpen(true)}>
          + Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={statCard}>
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-purple-100 ring-1 ring-border font-bold">
            👥
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Total Clients
            </div>
            <div className="text-xl font-extrabold">{totalClients}</div>
          </div>
        </div>
        <div className={statCard}>
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-emerald-100 ring-1 ring-border font-bold">
            📈
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Active Clients
            </div>
            <div className="text-xl font-extrabold">{activeClients}</div>
          </div>
        </div>
        <div className={statCard}>
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-sky-100 ring-1 ring-border font-bold">
            🤖
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Total Bots
            </div>
            <div className="text-xl font-extrabold">{totalBots}</div>
          </div>
        </div>
        <div className={statCard}>
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-rose-100 ring-1 ring-border font-bold">
            🚀
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Total Leads
            </div>
            <div className="text-xl font-extrabold">{totalLeads}</div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="text-xl font-extrabold mb-2">All Clients</div>
        <div className="text-sm font-semibold text-foreground/80 mb-4">
          Overview of all your clients and their activity
        </div>

        {clients.length === 0 ? (
          <div className="rounded-xl border-2 border-black bg-gradient-to-r from-amber-200 via-sky-200 to-violet-200 p-5 font-semibold">
            No clients yet. Use <b>+ Add Client</b> to create your first one.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clients.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white ring-1 ring-border text-2xl">
                    🏢
                  </div>
                  <div>
                    <div className="text-lg font-extrabold tracking-tight">
                      {c.name}
                    </div>
                    <div className="text-sm font-semibold text-foreground/80">
                      {c.email}
                    </div>
                    <div className="text-xs font-bold text-foreground/70 mt-1">
                      Joined: <span className="font-semibold">{c.lastActivity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-extrabold">{c.bots}</div>
                    <div className="text-xs font-semibold uppercase text-foreground/70">
                      Bots
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-extrabold">{c.leads}</div>
                    <div className="text-xs font-semibold uppercase text-foreground/70">
                      Leads
                    </div>
                  </div>

                  <span className={`${badge} ${c.plan === "Enterprise" ? "bg-purple-100" : c.plan === "Professional" ? "bg-blue-100" : "bg-emerald-100"}`}>
                    {c.plan}
                  </span>
                  <span className={`${badge} ${c.status === "Active" ? "bg-emerald-100" : "bg-amber-100"}`}>
                    {c.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-xl px-3 py-1.5 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                      onClick={() => alert("Open client detail (future).")}
                    >
                      Open
                    </button>
                    <button
                      className="rounded-xl px-3 py-1.5 font-bold ring-1 ring-border bg-white hover:bg-rose-50"
                      onClick={() => removeClient(c.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[520px] max-w-[94vw] rounded-2xl border-2 border-black bg-white shadow-2xl">
            <div className="rounded-t-2xl p-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white flex items-center justify-between">
              <div className="text-lg font-extrabold">Add Client</div>
              <button
                className="px-2 py-1 font-bold bg-white/90 text-black rounded-lg"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-bold uppercase text-purple-700">
                  Name
                </div>
                <input
                  className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <div className="text-sm font-bold uppercase text-purple-700">
                  Email
                </div>
                <input
                  className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="text-sm font-bold uppercase text-purple-700">
                  Plan
                </div>
                <select
                  className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold"
                  value={plan}
                  onChange={(e) =>
                    setPlan(e.target.value as Client["plan"])
                  }
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                  onClick={addClient}
                >
                  Save Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
