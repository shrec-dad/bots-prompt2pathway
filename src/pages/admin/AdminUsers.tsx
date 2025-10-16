import React, { useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";
import { useAuthStore, type Role } from "@/store/authStore";
import { Trash2, Mail, UserPlus } from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role; // "admin" | "editor" | "viewer"
  active: boolean; // simple enable/disable toggle
};

const STORE_KEY = "admins:list";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminUsers() {
  const me = useAuthStore((s) => s.user);
  const setRoleOnMe = useAuthStore((s) => s.setRole);

  // seed: make sure current user exists as an admin on first load
  const [items, setItems] = useState<AdminUser[]>(() => {
    const existing = getJSON<AdminUser[]>(STORE_KEY, []);
    if (existing.length) return existing;

    const seed: AdminUser[] = me
      ? [
          {
            id: me.id || uid(),
            name: me.name || "Demo Admin",
            email: me.email || "admin@example.com",
            role: me.role || "admin",
            active: true,
          },
        ]
      : [];
    setJSON(STORE_KEY, seed);
    return seed;
  });

  /** helpers */
  function save(next: AdminUser[]) {
    setItems(next);
    setJSON(STORE_KEY, next);
  }

  function addUser(u: Omit<AdminUser, "id">) {
    const next = [...items, { ...u, id: uid() }];
    save(next);
  }

  function removeUser(id: string) {
    const next = items.filter((x) => x.id !== id);
    save(next);
  }

  function updateUser(id: string, patch: Partial<AdminUser>) {
    const next = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
    save(next);

    // keep in-memory auth store in sync if editing yourself
    const edited = next.find((x) => x.id === id);
    if (edited && me && me.email === edited.email && patch.role) {
      setRoleOnMe(patch.role as Role);
    }
  }

  const [form, setForm] = useState({ name: "", email: "", role: "viewer" as Role });

  const counts = useMemo(() => {
    return {
      total: items.length,
      admins: items.filter((x) => x.role === "admin").length,
      disabled: items.filter((x) => !x.active).length,
    };
  }, [items]);

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Team (Admins)</h1>
          <p className="text-foreground/80">
            Manage who can access the admin dashboard and what they can do.
          </p>
        </div>
        <div className="rounded-xl border-[3px] border-black/80 bg-white px-4 py-2 text-sm font-semibold shadow-[0_6px_0_rgba(0,0,0,0.8)]">
          Total: {counts.total} • Admins: {counts.admins} • Disabled: {counts.disabled}
        </div>
      </div>

      {/* add user */}
      <div className="rounded-2xl border-[3px] border-black/80 bg-white p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        {/* header stripe */}
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="text-lg font-bold mb-3">Add teammate</div>
        <form
          className="grid gap-3 sm:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.email) return;
            addUser({ name: form.name, email: form.email, role: form.role, active: true });
            setForm({ name: "", email: "", role: "viewer" });
          }}
        >
          <input
            required
            placeholder="Full name"
            className="rounded-lg border p-2 sm:col-span-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="rounded-lg border p-2 sm:col-span-2"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="flex gap-3 sm:col-span-5">
            <select
              className="rounded-lg border p-2"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 font-bold text-white"
            >
              <UserPlus className="h-4 w-4" /> Add user
            </button>
          </div>
        </form>
      </div>

      {/* list */}
      <div className="rounded-2xl border-[3px] border-black/80 bg-white shadow-[0_6px_0_rgba(0,0,0,0.8)]">
        {/* header stripe */}
        <div className="h-2 rounded-md bg-black mx-5 mt-5 mb-4" />
        <div className="overflow-x-auto px-5 pb-5">
          <table className="min-w-full text-sm rounded-2xl overflow-hidden">
            <thead className="bg-muted/40 text-left border-b-2 border-black/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const isMe = me && me.email === u.email;
                return (
                  <tr key={u.id} className="border-t-2 border-black/60">
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border p-1"
                        value={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={u.active}
                        onChange={(e) => updateUser(u.id, { active: e.target.checked })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted/50"
                          onClick={() =>
                            alert(
                              `Reset password email would be sent to ${u.email} (frontend stub).`
                            )
                          }
                          title="Send reset password"
                        >
                          <Mail className="h-4 w-4" />
                          Reset
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            if (isMe) {
                              alert("You can’t delete your own account while logged in.");
                              return;
                            }
                            if (confirm(`Delete ${u.name}?`)) removeUser(u.id);
                          }}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr className="border-t-2 border-black/60">
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                    No admins yet. Add your first teammate above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

