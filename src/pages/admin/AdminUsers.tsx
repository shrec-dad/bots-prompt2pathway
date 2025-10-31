import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuthStore, type Role } from "@/store/authStore";
import { Trash2, Mail, UserPlus } from "lucide-react";
import { fetchUsers, addUser, updateUser, deleteUser } from '@/store/usersSlice';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role; // "admin" | "editor" | "viewer"
  active: boolean; // simple enable/disable toggle
};

export default function AdminUsers() {
  const me = useAuthStore((s) => s.user);
  const setRoleOnMe = useAuthStore((s) => s.setRole);

  const dispatch = useDispatch();
  const users = useSelector((state: RootState) => state.users.list);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);


  async function handleAddUser(u: Omit<AdminUser, "id">) {
    try {
      await dispatch(addUser(u)).unwrap();
      dispatch(fetchUsers());  
    } catch(err) {

    }
  }

  async function removeUser(id: string) {
    try {
      await dispatch(deleteUser(id)).unwrap();
      dispatch(fetchUsers());  
    } catch(err) {

    }
  }

  async function handleUpdateUser(id: string, patch: Partial<AdminUser>) {
    try {
      await dispatch(updateUser({ id, data: patch})).unwrap();
      if (me && me.id === id && patch.role) {
        setRoleOnMe(patch.role as Role);
      }
      dispatch(fetchUsers());  
    } catch(err) {

    }
  }

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" as Role });

  const counts = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((x) => x.role === "admin").length,
      disabled: users.filter((x) => !x.active).length,
    };
  }, [users]);

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
            if (!form.name || !form.email || !form.password) return;
            handleAddUser({ name: form.name, email: form.email, password: form.password, role: form.role, active: true });
            setForm({ name: "", email: "", password: "", role: "viewer" });
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
          <input
            required
            type="password"
            placeholder="Password"
            className="rounded-lg border p-2 sm:col-span-2"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />

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
              {users.map((u) => {
                const isMe = me && me.email === u.email;
                return (
                  <tr key={u._id} className="border-t-2 border-black/60">
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border p-1"
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u._id, { role: e.target.value as Role })}
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
                        onChange={(e) => handleUpdateUser(u._id, { active: e.target.checked })}
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
                            if (confirm(`Delete ${u.name}?`)) removeUser(u._id);
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
              {users.length === 0 && (
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

