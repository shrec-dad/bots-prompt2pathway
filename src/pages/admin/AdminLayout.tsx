// src/pages/admin/AdminLayout.tsx - FINAL WITH LOGOUT BUTTON
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
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

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
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t">
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
