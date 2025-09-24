// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";

// Heroicons Solid
import {
  ChartBarIcon,
  UserGroupIcon,
  CubeIcon,
  PuzzlePieceIcon,
  BookOpenIcon,
  EnvelopeIcon,
  PaintBrushIcon,
  LinkIcon,
  Cog6ToothIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/24/solid";

const NavItem = ({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "group flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold transition",
        isActive
          ? "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 text-foreground"
          : "text-foreground/80 hover:text-foreground hover:bg-muted/50",
      ].join(" ")
    }
  >
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400/15 via-purple-400/15 to-indigo-400/15">
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
      <aside className="w-72 shrink-0 border-r bg-card/50 backdrop-blur-sm">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pink-600/20">
              <CubeIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-foreground/70">Lead Qualifier Pro</div>
              <div className="text-xl font-extrabold">Admin</div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 pb-24">
          <NavItem to="/admin/dashboard" icon={ChartBarIcon} label="Dashboard" />
          <NavItem to="/admin/clients" icon={UserGroupIcon} label="Clients" />
          <NavItem to="/admin/bots" icon={CubeIcon} label="Bots" />
          <NavItem to="/admin/builder" icon={PuzzlePieceIcon} label="Builder" />
          <NavItem to="/admin/knowledge" icon={BookOpenIcon} label="Knowledge" />
          <NavItem to="/admin/nurture" icon={EnvelopeIcon} label="Nurture" />
          <NavItem to="/admin/branding" icon={PaintBrushIcon} label="Branding" />
          <NavItem to="/admin/integrations" icon={LinkIcon} label="Integrations" />
          <NavItem to="/admin/settings" icon={Cog6ToothIcon} label="Settings" />
          <NavItem
            to="/admin/analytics"
            icon={PresentationChartBarIcon}
            label="Analytics"
          />
        </nav>
      </aside>

      {/* Main */}
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
