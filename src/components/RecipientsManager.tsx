// src/components/RecipientsManager.tsx
import React, { useState, useRef } from "react";
import type { Recipient, CSVImportResult } from "@/types/nurture-types";

/** ───────────────────────────────────────────────────────────────────────────
 * Props
 * ───────────────────────────────────────────────────────────────────────────*/

type Props = {
  recipients: Recipient[];
  onAddRecipients: (recipients: Omit<Recipient, "_id">[]) => void;
  onDeleteRecipients: (ids: string[]) => void;
  onClose: () => void;
};

/** ───────────────────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────────────────────*/

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone: string): boolean {
  // Simple validation: digits, spaces, +, -, ()
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^\+?\d{10,15}$/.test(cleaned);
}

/** Parse CSV text into recipients */
function parseCSV(text: string): CSVImportResult {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) {
    return { success: 0, failed: 0, duplicates: 0, errors: [], imported: [] };
  }

  // Expect header: email,name,company,phone
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const emailIdx = header.findIndex((h) => h.includes("email"));
  const nameIdx = header.findIndex((h) => h.includes("name"));
  const companyIdx = header.findIndex((h) => h.includes("company"));
  const phoneIdx = header.findIndex((h) => h.includes("phone"));

  if (emailIdx === -1) {
    return {
      success: 0,
      failed: lines.length - 1,
      duplicates: 0,
      errors: [{ row: 0, reason: "CSV must have an 'email' column" }],
      imported: [],
    };
  }

  const imported: Omit<Recipient, "_id">[] = [];
  const errors: Array<{ row: number; reason: string }> = [];
  const seen = new Set<string>();
  let duplicates = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = i + 1; // human-readable row number
    const cols = lines[i].split(",").map((c) => c.trim());

    const email = cols[emailIdx]?.toLowerCase() || "";
    if (!email) {
      errors.push({ row, reason: "Missing email" });
      continue;
    }
    if (!validateEmail(email)) {
      errors.push({ row, reason: `Invalid email: ${email}` });
      continue;
    }
    if (seen.has(email)) {
      duplicates++;
      continue;
    }
    seen.add(email);

    const name = nameIdx >= 0 ? cols[nameIdx] || "" : "";
    const company = companyIdx >= 0 ? cols[companyIdx] || "" : "";
    const phone = phoneIdx >= 0 ? cols[phoneIdx] || "" : "";

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      errors.push({ row, reason: `Invalid phone: ${phone}` });
      continue;
    }

    imported.push({
      email,
      name: name || undefined,
      company: company || undefined,
      phone: phone || undefined,
      status: "active"
    });
  }

  return {
    success: imported.length,
    failed: errors.length,
    duplicates,
    errors,
    imported,
  };
}

/** ───────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────*/

export default function RecipientsManager({ recipients, onAddRecipients, onDeleteRecipients, onClose }: Props) {
  const [view, setView] = useState<"list" | "add" | "import">("list");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Add single recipient
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [addPhone, setAddPhone] = useState("");

  // Import CSV
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  /** Filter recipients by search */
  const filtered = recipients.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.email.toLowerCase().includes(s) ||
      r.name?.toLowerCase().includes(s) ||
      r.company?.toLowerCase().includes(s)
    );
  });

  /** Add single recipient */
  const handleAddRecipient = () => {
    if (!addEmail.trim()) {
      alert("Email is required.");
      return;
    }
    if (!validateEmail(addEmail)) {
      alert("Invalid email format.");
      return;
    }
    if (addPhone && !validatePhone(addPhone)) {
      alert("Invalid phone format.");
      return;
    }

    // Check duplicate
    const exists = recipients.some((r) => r.email.toLowerCase() === addEmail.toLowerCase());
    if (exists) {
      alert("This email already exists in your recipients list.");
      return;
    }

    const newRecipient: Omit<Recipient, "_id"> = {
      email: addEmail.trim(),
      name: addName.trim() || undefined,
      company: addCompany.trim() || undefined,
      phone: addPhone.trim() || undefined,
      status: "active"
    };

    onAddRecipients([newRecipient]);
    setAddEmail("");
    setAddName("");
    setAddCompany("");
    setAddPhone("");
    setView("list");
    alert("Recipient added!");
  };

  /** Import CSV */
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseCSV(text);
      setImportResult(result);

      if (result.success > 0) {
        // Merge with existing, avoiding duplicates
        const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));
        const newRecipients = result.imported.filter(
          (r) => !existingEmails.has(r.email.toLowerCase())
        );
        const duplicatesWithExisting = result.imported.length - newRecipients.length;

        onAddRecipients(newRecipients);
        alert(
          `Imported ${newRecipients.length} recipients.\n` +
            (duplicatesWithExisting > 0
              ? `Skipped ${duplicatesWithExisting} duplicates with existing list.\n`
              : "") +
            (result.failed > 0 ? `Failed: ${result.failed}\n` : "") +
            (result.duplicates > 0 ? `Duplicates in CSV: ${result.duplicates}` : "")
        );
        setView("list");
      } else {
        alert(`Import failed. ${result.failed} rows had errors.`);
      }
    } catch (err) {
      alert("Failed to read CSV file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /** Bulk delete selected */
  const handleBulkDelete = () => {
    if (selected.size === 0) {
      alert("No recipients selected.");
      return;
    }
    if (!confirm(`Delete ${selected.size} recipients?`)) return;

    onDeleteRecipients(Array.from(selected));
    
    setSelected(new Set());
    alert("Recipients deleted.");
  };

  /** Export as CSV */
  const handleExportCSV = () => {
    const header = "email,name,company,phone,status\n";
    const rows = recipients
      .map(
        (r) =>
          `${r.email},${r.name || ""},${r.company || ""},${r.phone || ""},${r.status}`
      )
      .join("\n");

    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recipients_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Toggle selection */
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r._id)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border-[3px] border-black/80 shadow-[0_8px_0_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-black/80 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-black">Recipients Manager</h2>
            <p className="text-sm text-foreground/70">Manage your nurture campaign contacts</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 px-5 pt-4 border-b">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 font-bold rounded-t-lg ${
              view === "list"
                ? "bg-white border-2 border-b-0 border-black/80"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            List ({recipients.length})
          </button>
          <button
            onClick={() => setView("add")}
            className={`px-4 py-2 font-bold rounded-t-lg ${
              view === "add"
                ? "bg-white border-2 border-b-0 border-black/80"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Add Single
          </button>
          <button
            onClick={() => setView("import")}
            className={`px-4 py-2 font-bold rounded-t-lg ${
              view === "import"
                ? "bg-white border-2 border-b-0 border-black/80"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Import CSV
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === "list" && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by email, name, or company..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  onClick={handleExportCSV}
                  className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-white hover:bg-gray-50"
                  disabled={recipients.length === 0}
                >
                  Export CSV
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="rounded-lg px-3 py-2 font-bold ring-1 ring-black bg-rose-50 hover:bg-rose-100"
                  disabled={selected.size === 0}
                >
                  Delete Selected ({selected.size})
                </button>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-foreground/60">
                  {recipients.length === 0
                    ? "No recipients yet. Add some to get started!"
                    : "No recipients match your search."}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-black/80 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-purple-100 to-indigo-100 border-b-2 border-black/80">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={selected.size === filtered.length && filtered.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-3 text-left font-extrabold">Email</th>
                        <th className="p-3 text-left font-extrabold">Name</th>
                        <th className="p-3 text-left font-extrabold">Company</th>
                        <th className="p-3 text-left font-extrabold">Phone</th>
                        <th className="p-3 text-left font-extrabold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r._id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selected.has(r._id)}
                              onChange={() => toggleSelect(r._id)}
                            />
                          </td>
                          <td className="p-3 font-semibold">{r.email}</td>
                          <td className="p-3">{r.name || "—"}</td>
                          <td className="p-3">{r.company || "—"}</td>
                          <td className="p-3">{r.phone || "—"}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                r.status === "active"
                                  ? "bg-green-100 text-green-900"
                                  : r.status === "inactive"
                                  ? "bg-gray-100 text-gray-900"
                                  : "bg-rose-100 text-rose-900"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "add" && (
            <div className="max-w-md space-y-4">
              <div>
                <label className="block mb-1 text-sm font-extrabold uppercase text-purple-700">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border px-3 py-2 font-semibold"
                  placeholder="recipient@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-extrabold uppercase text-purple-700">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 font-semibold"
                  placeholder="John Doe"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-extrabold uppercase text-purple-700">
                  Company
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 font-semibold"
                  placeholder="Acme Inc"
                  value={addCompany}
                  onChange={(e) => setAddCompany(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-extrabold uppercase text-purple-700">
                  Phone (optional, for SMS)
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border px-3 py-2 font-semibold"
                  placeholder="+1 234 567 8900"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                />
              </div>
              <button
                onClick={handleAddRecipient}
                className="w-full rounded-xl px-4 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_4px_0_#000] active:translate-y-[1px]"
              >
                Add Recipient
              </button>
            </div>
          )}

          {view === "import" && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-4">
                <div className="font-extrabold mb-2">CSV Format Requirements</div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>First row must be headers</li>
                  <li>
                    <strong>Required column:</strong> <code>email</code>
                  </li>
                  <li>
                    <strong>Optional columns:</strong> <code>name</code>, <code>company</code>,{" "}
                    <code>phone</code>
                  </li>
                  <li>Example: email,name,company,phone</li>
                </ul>
              </div>

              <div className="rounded-xl border-2 border-black/80 p-4">
                <label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">Click to upload CSV</div>
                    <div className="text-sm text-foreground/70">or drag and drop</div>
                  </div>
                  <input
                    id="csv-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                </label>
              </div>

              {importResult && (
                <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
                  <div className="font-extrabold mb-2">Import Results</div>
                  <div className="text-sm space-y-1">
                    <div>✅ Success: {importResult.success}</div>
                    <div>❌ Failed: {importResult.failed}</div>
                    <div>🔁 Duplicates: {importResult.duplicates}</div>
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-bold">View Errors</summary>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          {importResult.errors.slice(0, 10).map((err, i) => (
                            <li key={i}>
                              Row {err.row}: {err.reason}
                            </li>
                          ))}
                          {importResult.errors.length > 10 && (
                            <li>...and {importResult.errors.length - 10} more</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
