// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bot,
  Puzzle,
  Book,
  Workflow,
  Settings,
  Eye,
  LineChart,
  Plug,
  Code2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/bots", label: "Bots", icon: Bot },
  { to: "/admin/builder", label: "Builder", icon: Puzzle },
  { to: "/admin/knowledge", label: "Knowledge", icon: Book },
  { to: "/admin/nurture", label: "Nurture", icon: Workflow },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/preview", label: "Preview", icon: Eye },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/integrations", label: "Integrations", icon: Plug },
  { to: "/admin/embed", label: "Embed Code", icon: Code2 },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  function handleLogout() {
    logout();
    // Go straight to the guarded login route
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-muted/10">
      <aside className="w-[320px] shrink-0 border-r bg-white flex flex-col">
        <div
          className="p-6 border-b"
          style={{
            background:
              "linear-gradient(90deg, var(--grad-from), var(--grad-via), var(--grad-to))",
            color: "var(--grad-text)",
            fontWeight: "800",
          }}
        >
          <div className="text-2xl">Admin</div>
          <div className="text-sm opacity-90">Multi-Bot Platform</div>
        </div>

        <nav className="p-4 space-y-3 flex-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border px-4 py-3 transition
                 ${
                   isActive
                     ? "bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 border-foreground"
                     : "bg-white hover:bg-muted/40"
                 }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background:
                        "linear-gradient(90deg, var(--grad-from), var(--grad-via), var(--grad-to))",
                    }
                  : {}
              }
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{
                background: "linear-gradient(90deg, var(--grad-from), var(--grad-via), var(--grad-to))",
                color: "var(--grad-text)"
              }}>
              {user?.name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.name || "Admin"}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-3 p-2 rounded-full hover:bg-muted/50 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-red-500" />
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
