// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Bot, Puzzle, Book, Settings, Eye } from "lucide-react";

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-2xl border-2 border-black px-4 py-3 transition
       ${isActive ? "bg-gradient-to-r from-purple-200 via-indigo-200 to-teal-200" : "bg-white hover:bg-black/5"}`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="font-semibold">{label}</span>
  </NavLink>
);

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="p-4 space-y-3 border-r-2 border-black">
        <div className="rounded-2xl p-4 border-2 border-black bg-gradient-to-r from-purple-200 via-indigo-200 to-teal-200">
          <div className="text-xl font-black">Admin</div>
          <div className="text-sm opacity-80">Multi-Bot Platform</div>
        </div>

        <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/admin/clients" icon={Users} label="Clients" />
        <NavItem to="/admin/bots" icon={Bot} label="Bots" />
        <NavItem to="/admin/builder" icon={Puzzle} label="Builder" />
        <NavItem to="/admin/knowledge" icon={Book} label="Knowledge" />
        <NavItem to="/admin/nurture" icon={Book} label="Nurture" />
        <NavItem to="/admin/settings" icon={Settings} label="Settings" />
        <NavItem to="/admin/preview" icon={Eye} label="Preview" />
      </aside>

      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
