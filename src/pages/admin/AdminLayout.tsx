// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Users,
  Bot,
  Puzzle,
  BookOpen,
  Mail,
  Paintbrush,
  Link,
  Settings,
} from "lucide-react";
import { useAdminStore } from "@/lib/AdminStore";

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold transition",
        isActive
          ? "bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 text-foreground"
          : "text-muted-foreground hover:bg-gradient-to-r hover:from-red-500/10 hover:via-orange-500/10 hover:to-yellow-500/10",
      ].join(" ")
    }
  >
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/15 via-orange-500/15 to-yellow-500/15">
      <Icon className="h-5 w-5" />
    </span>
    <span>{label}</span>
  </NavLink>
);

export default function AdminLayout() {
  const { currentBot, setCurrentBot } = useAdminStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 border-r bg-card/50 backdrop-blur-sm">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20">
              🤖
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lead Qualifier Pro</div>
              <div className="text-xl font-bold">Admin</div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 pb-6">
          <NavItem to="/admin" icon={BarChart3} label="Dashboard" />
          <NavItem to="/admin/clients" icon={Users} label="Clients" />
          <NavItem to="/admin/bots" icon={Bot} label="Bots" />
          <NavItem to="/admin/builder" icon={Puzzle} label="Builder" />
          <NavItem to="/admin/knowledge" icon={BookOpen} label="Knowledge" />
          <NavItem to="/admin/nurture" icon={Mail} label="Nurture" />
          <NavItem to="/admin/branding" icon={Paintbrush} label="Branding" />
          <NavItem to="/admin/integrations" icon={Link} label="Integrations" />
          <NavItem to="/admin/settings" icon={Settings} label="Settings" />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="text-sm font-bold text-muted-foreground">You are editing</div>
            <div className="relative z-50 pointer-events-auto">
              <select
                value={currentBot}
                onChange={(e) => setCurrentBot(e.target.value as any)}
                className="rounded-xl border bg-card px-4 py-2 text-sm font-bold shadow-sm focus:outline-none"
              >
                <option
