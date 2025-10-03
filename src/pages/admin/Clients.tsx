import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { BotKey } from "@/lib/botSettings";
import { listInstances } from "@/lib/instances";

/* =========================
   Types / Storage
   ========================= */

type Client = {
  id: string;
  companyName: string;
  name: string;
  email: string;
  plan: string;
  bots: number;
  leads: number;
  status: "Active" | "Paused";
  lastActivity: string;
  defaultBot?: BotKey;
  notes?: string;
  assignedBots?: string[];   // NEW: holds instance IDs
};

const KEY = "clients:list";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* =========================
   XLSX loader (on-demand)
   ========================= */
declare global { interface Window { XLSX: any; } }

async function ensureXLSX(): Promise<any> {
  if (window.XLSX) return window.XLSX;
  await new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Failed to load XLSX library"));
    document.head.appendChild(el);
  });
  return window.XLSX;
}

const ts = () =>
  new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

/* =========================
   Style helpers
   ========================= */

const headerCard =
  "rounded-2xl border bg-white shadow-sm mb-6 flex items-center justify-between px-5 py-4";
const statCard =
  "rounded-2xl border bg-card px-4 py-3 flex items-center gap-3";
const badge =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-border";
const actionBtn =
  "rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30";
const input =
  "w-full rounded-lg border border-purple-200 bg-white px-3 py-2 font-semibold";

/* =========================
   Component
   ========================= */

export default function Clients() {
  const initial = useMemo<Client[]>(
    () => getJSON<Client[]>(KEY, []),
    []
  );

  const [clients, setClients] = useState<Client[]>(initial);

  // Add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<string>("Starter"); // free text
  const [defaultBot, setDefaultBot] = useState<BotKey>("Waitlist");

  // Edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [eCompanyName, setECompanyName] = useState("");
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePlan, setEPlan] = useState<string>("Starter"); // free text
  const [eStatus, setEStatus] = useState<Client["status"]>("Active");
  const [eBots, setEBots] = useState(0);
  const [eLeads, setELeads] = useState(0);
  const [eDefaultBot, setEDefaultBot] = useState<BotKey>("Waitlist");
  const [eNotes, setENotes] = useState("");

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "Active").length;
  const totalBots = clients.reduce((a, c) => a + c.bots, 0);
  const totalLeads = clients.reduce((a, c) => a + c.leads, 0);

  function saveList(next: Client[]) {
    setClients(next);
    setJSON(KEY, next);
  }

  /* ---------- Excel (.xlsx) Download ---------- */
  async function downloadXlsx() {
    if (!clients.length) {
      alert("No clients to export yet.");
      return;
    }

    const XLSX = await ensureXLSX();

    const headers = [
      "id",
      "companyName",
      "name",
      "email",
      "plan",
      "bots",
      "leads",
      "status",
      "lastActivity",
      "defaultBot",
      "notes",
    ];

    const rows = clients.map((c) => [
      c.id,
      c.companyName || "",
      c.name || "",
      c.email || "",
      c.plan || "",
      c.bots ?? 0,
      c.leads ?? 0,
      c.status,
      c.lastActivity || "",
      c.defaultBot || "",
      (c.notes || "").replace(/\n/g, " "),
    ]);

    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_${ts()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- Add ---------- */
  function addClient() {
    if (!companyName.trim()) return alert("Please enter a company name.");
    if (!name.trim()) return alert("Please enter a contact name.");
    if (!email.trim()) return alert("Please enter a contact email.");

    const newClient: Client = {
      id: uid(),
      companyName: companyName.trim(),
      name: name.trim(),
      email: email.trim(),
      plan: plan.trim(),
      bots: 0,
      leads: 0,
      status: "Active",
      lastActivity: "just now",
      defaultBot,
    };

    saveList([newClient, ...clients]);

    // reset form
    setCompanyName("");
    setName("");
    setEmail("");
    setPlan("Starter");
    setDefaultBot("Waitlist");
    setOpenAdd(false);
  }

  /* ---------- Edit ---------- */
  function openEditModal(c: Client) {
    setEditId(c.id);
    setECompanyName(c.companyName);
    setEName(c.name);
    setEEmail(c.email);
    setEPlan(c.plan);
    setEStatus(c.status);
    setEBots(c.bots);
    setELeads(c.leads);
    setEDefaultBot(c.defaultBot || "Waitlist");
    setENotes(c.notes || "");
    setOpenEdit(true);
  }

  function saveEdit() {
    if (!editId) return;

    const next = clients.map((c) =>
      c.id !== editId
        ? c
        : {
            ...c,
            companyName: eCompanyName.trim() || c.companyName,
            name: eName.trim() || c.name,
            email: eEmail.trim() || c.email,
            plan: ePlan.trim(),
            status: eStatus,
            bots: eBots,
            leads: eLeads,
            defaultBot: eDefaultBot,
            notes: eNotes,
            lastActivity: "updated now",
          }
    );

    saveList(next);
    setOpenEdit(false);
    setEditId(null);
  }

  function removeClient(id: string) {
    if (!confirm("Delete this client? This only affects local data.")) return;
    saveList(clients.filter((c) => c.id !== id));
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
        <div className="flex items-center gap-2">
          <button
            className={actionBtn}
            onClick={downloadXlsx}
            aria-label="Download clients Excel"
            title="Download Excel (.xlsx)"
          >
            ⬇︎ Export XLSX
          </button>
          <button className={actionBtn} onClick={() => setOpenAdd(true)}>
            + Add Client
          </button>
        </div>
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
                      {c.companyName}
                    </div>
                    <div className="text-sm font-semibold text-foreground/80">
                      {c.name} • {c.email}
                    </div>
                    <div className="text-xs font-bold text-foreground/70 mt-1">
                      Plan: <span className="font-semibold">{c.plan || "—"}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground/70 mt-1">
                      Default Bot:{" "}
                      <span className="font-semibold">
                        {c.defaultBot || "Waitlist"}
                      </span>
                    </div>
                    {c.notes ? (
                      <div className="text-xs font-semibold text-foreground/70 mt-1 line-clamp-1">
                        Notes: {c.notes}
                      </div>
                    ) : null}
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

                  <span
                    className={`${badge} ${
                      c.status === "Active" ? "bg-emerald-100" : "bg-amber-100"
                    }`}
                  >
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
                      className="rounded-xl px-3 py-1.5 font-bold ring-1 ring-border bg-white hover:bg-indigo-50"
                      onClick={() => openEditModal(c)}
                    >
                      Edit
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
      {openAdd && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[640px] max-w-[94vw] rounded-2xl border-2 border-black bg-white shadow-2xl">
            <div className="rounded-t-2xl p-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white flex items-center justify-between">
              <div className="text-lg font-extrabold">Add Client</div>
              <button
                className="px-2 py-1 font-bold bg-white/90 text-black rounded-lg"
                onClick={() => setOpenAdd(false)}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-bold uppercase text-purple-700">Company Name</div>
                <input
                  className={input}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corporation"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Contact Name</div>
                  <input
                    className={input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Contact Email</div>
                  <input
                    className={input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@acme.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Plan</div>
                  <input
                    className={input}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Starter / Pro / Custom…"
                  />
                </div>

                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Default Bot</div>
                  <select
                    className={input}
                    value={defaultBot}
                    onChange={(e) => setDefaultBot(e.target.value as BotKey)}
                  >
                    <option value="LeadQualifier">Lead Qualifier</option>
                    <option value="AppointmentBooking">Appointment Booking</option>
                    <option value="CustomerSupport">Customer Support</option>
                    <option value="Waitlist">Waitlist</option>
                    <option value="SocialMedia">Social Media</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                  onClick={() => setOpenAdd(false)}
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

      {/* Edit Client Modal */}
      {openEdit && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[700px] max-w-[96vw] rounded-2xl border-2 border-black bg-white shadow-2xl">
            <div className="rounded-t-2xl p-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white flex items-center justify-between">
              <div className="text-lg font-extrabold">Edit Client</div>
              <button
                className="px-2 py-1 font-bold bg-white/90 text-black rounded-lg"
                onClick={() => setOpenEdit(false)}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-bold uppercase text-purple-700">Company Name</div>
                <input
                  className={input}
                  value={eCompanyName}
                  onChange={(e) => setECompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Contact Name</div>
                  <input className={input} value={eName} onChange={(e) => setEName(e.target.value)} />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Contact Email</div>
                  <input className={input} value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Plan</div>
                  <input className={input} value={ePlan} onChange={(e) => setEPlan(e.target.value)} />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Status</div>
                  <select
                    className={input}
                    value={eStatus}
                    onChange={(e) => setEStatus(e.target.value as Client["status"])}
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Default Bot</div>
                  <select
                    className={input}
                    value={eDefaultBot}
                    onChange={(e) => setEDefaultBot(e.target.value as BotKey)}
                  >
                    <option value="LeadQualifier">Lead Qualifier</option>
                    <option value="AppointmentBooking">Appointment Booking</option>
                    <option value="CustomerSupport">Customer Support</option>
                    <option value="Waitlist">Waitlist</option>
                    <option value="SocialMedia">Social Media</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Bots</div>
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={eBots}
                    onChange={(e) => setEBots(Number(e.target.value || 0))}
                  />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase text-purple-700">Leads</div>
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={eLeads}
                    onChange={(e) => setELeads(Number(e.target.value || 0))}
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-bold uppercase text-purple-700">Notes</div>
                <textarea
                  className={input}
                  rows={3}
                  value={eNotes}
                  onChange={(e) => setENotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-rose-50"
                  onClick={() => {
                    if (!editId) return;
                    removeClient(editId);
                    setOpenEdit(false);
                  }}
                >
                  Delete Client
                </button>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                    onClick={() => setOpenEdit(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-xl px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 shadow-[0_3px_0_#000] active:translate-y-[1px]"
                    onClick={saveEdit}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
