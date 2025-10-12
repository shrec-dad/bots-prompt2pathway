// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, Bot, Puzzle, Book, Workflow,
  Settings as SettingsIcon, Eye, LineChart, Plug, Code2
} from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/bots", label: "Bots", icon: Bot },
  { to: "/admin/builder", label: "Builder", icon: Puzzle },
  { to: "/admin/knowledge", label: "Knowledge", icon: Book },
  { to: "/admin/nurture", label: "Nurture", icon: Workflow },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { to: "/admin/preview", label: "Preview", icon: Eye },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/integrations", label: "Integrations", icon: Plug },
  { to: "/admin/embed", label: "Embed Code", icon: Code2 }, // <-- EXACT MATCH
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-muted/10">
      <aside className="w-[320px] shrink-0 border-r bg-white">
        {/* Header uses platform gradient + auto-contrast text */}
        <div className="p-6 border-b gradient-header">
          <div className="text-2xl font-bold">Admin</div>
          <div className="text-sm opacity-90">Multi-Bot Platform</div>
        </div>

        <nav className="p-4 space-y-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  isActive
                    ? "border-foreground"
                    : "bg-white hover:bg-muted/40"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      // Use gradient background + readable text for active item
                      background:
                        "linear-gradient(90deg, var(--grad-from), var(--grad-via), var(--grad-to))",
                      color: "var(--grad-text)",
                      fontWeight: 800 as any,
                    }
                  : undefined
              }
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
