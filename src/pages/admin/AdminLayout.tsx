// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";

// Lucide icons (already in project)
import {
  LayoutDashboard,
  Users2,
  Bot,
  Puzzle,
  BookOpen,
  Mail,
  Palette,
  Link2,
  Settings,
  BarChart3,
} from "lucide-react";

const NavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "group flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold transition",
        isActive
          ? "bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-emerald-500/20 text-foreground"
          : "text-foreground/85 hover:text-foreground hover:bg-muted/50",
      ].join(" ")
    }
  >
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-border bg-gradient-to-br from-violet-500/15 via-indigo-500/15 to-emerald-500/15">
      {icon}
    </span>
    <span>{label}</span>
  </NavLink>
);

export default function AdminLayout() {
  const { currentBot, setCurrentBot } = useAdminStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 shrink-0 border-r bg-card/50 backdrop-blur-sm">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20">
              <Bot size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm text-foreground/70">Lead Qualifier Pro</div>
              <div className="text-xl font-extrabold">Admin</div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 pb-28">
          <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} strokeWidth={2.2} />} label="Dashboard" />
          <NavItem to="/admin/clients" icon={<Users2 size={20} strokeWidth={2.2} />} label="Clients" />
          <NavItem to="/admin/bots" icon={<Bot size={20} strokeWidth={2.2} />} label="Bots" />
          <NavItem to="/admin/builder" icon={<Puzzle size={20} strokeWidth={2.2} />} label="Builder" />
          <NavItem to="/admin/knowledge" icon={<BookOpen size={20} strokeWidth={2.2} />} label="Knowledge" />
          <NavItem to="/admin/nurture" icon={<Mail size={20} strokeWidth={2.2} />} label="Nurture" />
          <NavItem to="/admin/branding" icon={<Palette size={20} strokeWidth={2.2} />} label="Branding" />
          <NavItem to="/admin/integrations" icon={<Link2 size={20} strokeWidth={2.2} />} label="Integrations" />
          <NavItem to="/admin/settings" icon={<Settings size={20} strokeWidth={2.2} />} label="Settings" />
          <NavItem to="/admin/analytics" icon={<BarChart3 size={20} strokeWidth={2.2} />} label="Analytics" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="text-sm font-semibold text-foreground/80">You are editing</div>
            <select
              value={currentBot}
              onChange={(e) => setCurrentBot(e.target.value as any)}
              className="rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm focus:outline-none"
            >
              <option value="LeadQualifier">Lead Qualifier</option>
              <option value="AppointmentBooking">Appointment Booking</option>
              <option value="CustomerSupport">Customer Support</option>
              <option value="Waitlist">Waitlist</option>
              <option value="SocialMedia">Social Media</option>
            </select>
          </div>
        </header>

        <section className="w-full flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
