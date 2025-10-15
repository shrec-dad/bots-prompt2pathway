// src/pages/admin/AdminLayout.tsx - FINAL WITH ROLE-BASED MENU
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
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type Role = "admin" | "editor" | "viewer";

const allLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "editor", "viewer"], end: true },
  { to: "/admin/clients", label: "Clients", icon: Users, roles: ["admin", "editor"] },
  { to: "/admin/bots", label: "Bots", icon: Bot, roles: ["admin", "editor"] },
  { to: "/admin/builder", label: "Builder", icon: Puzzle, roles: ["admin", "editor"] },
  { to: "/admin/knowledge", label: "Knowledge", icon: Book, roles: ["admin", "editor"] },
  { to: "/admin/nurture", label: "Nurture", icon: Workflow, roles: ["admin"] },
  { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { to: "/admin/preview", label: "Preview", icon: Eye, roles: ["admin", "editor"] },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart, roles: ["admin"] },
  { to: "/admin/integrations", label: "Integrations", icon: Plug, roles: ["admin"] },
  { to: "/admin/embed", label: "Embed Code", icon: Code2, roles: ["admin", "editor"] },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  const role: Role = (user?.role as Role) || "viewer"; // default to viewer if missing

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const visibleLinks = allLinks.filter((link) => link.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-muted/10">
      {/* SIDEBAR */}
      <aside className="w-[320px] shrink-0 border-r bg-white flex flex-col justify-between">
        {/* Header */}
        <div>
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

          {/* Navigation */}
          <nav className="p-4 space-y-3">
            {visibleLinks.map(({ to, label, icon: Icon, end }) => (
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
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer / User Info + Logout */}
        <div className="p-4 border-t">
          {user && (
            <div className="mb-3 px-2">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold text-gray-800">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500 mt-1 uppercase">{role}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 border hover:bg-red-50 transition"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-600">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
