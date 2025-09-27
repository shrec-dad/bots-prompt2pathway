// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bot,
  Puzzle,
  BookOpen,
  Workflow,
  Settings,
  Eye,
} from "lucide-react";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        {/* Fixed-width sidebar + flexible content */}
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <aside className="rounded-2xl border bg-card overflow-hidden h-fit md:sticky md:top-6">
            <div className="p-5 border-b bg-gradient-to-r from-purple-200 via-indigo-200 to-teal-200">
              <div className="text-2xl font-black">Admin</div>
              <div className="text-sm text-foreground/70">Multi-Bot Platform</div>
            </div>

            <nav className="p-3">
              <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" end />
              <NavItem to="/admin/clients" icon={Users} label="Clients" />
              <NavItem to="/admin/bots" icon={Bot} label="Bots" />
              <NavItem to="/admin/builder" icon={Puzzle} label="Builder" />
              <NavItem to="/admin/knowledge" icon={BookOpen} label="Knowledge" />
              <NavItem to="/admin/nurture" icon={Workflow} label="Nurture" />
              <NavItem to="/admin/settings" icon={Settings} label="Settings" />
              <NavItem to="/admin/preview" icon={Eye} label="Preview" />
            </nav>
          </aside>

          <main className="rounded-2xl border bg-card p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  end = false,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 w-full rounded-xl px-4 py-3 mb-3 border transition",
          isActive
            ? "bg-gradient-to-r from-purple-100 to-teal-100 border-black"
            : "bg-white/70 hover:bg-white border-black",
        ].join(" ")
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="font-semibold">{label}</span>
    </NavLink>
  );
}
