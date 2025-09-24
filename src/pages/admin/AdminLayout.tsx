// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";

// Phosphor icons
import {
  SquaresFour,
  Users,
  Robot,
  PuzzlePiece,
  BookOpenText,
  EnvelopeSimple,
  PaintBrushBroad,
  LinkSimple,
  GearSix,
  ChartBar,
} from "@phosphor-icons/react";

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
          ? "bg-gradient-to-r from-sky-500/20 via-cyan-500/20 to-emerald-500/20 text-foreground"
          : "text-foreground/80 hover:text-foreground hover:bg-muted/50",
      ].join(" ")
    }
  >
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/15 via-cyan-400/15 to-emerald-400/15">
      <Icon size={22} weight="bold" />
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
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600/20">
              <Robot size={28} weight="fill" />
            </div>
            <div>
              <div className="text-sm text-foreground/70">Lead Qualifier Pro</div>
              <div className="text-xl font-extrabold">Admin</div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 pb-24">
          <NavItem to="/admin/dashboard" icon={SquaresFour} label="Dashboard" />
          <NavItem to="/admin/clients" icon={Users} label="Clients" />
          <NavItem to="/admin/bots" icon={Robot} label="Bots" />
          <NavItem to="/admin/builder" icon={PuzzlePiece} label="Builder" />
          <NavItem to="/admin/knowledge" icon={BookOpenText} label="Knowledge" />
          <NavItem to="/admin/nurture" icon={EnvelopeSimple} label="Nurture" />
          <NavItem to="/admin/branding" icon={PaintBrushBroad} label="Branding" />
          <NavItem to="/admin/integrations" icon={LinkSimple} label="Integrations" />
          <NavItem to="/admin/settings" icon={GearSix} label="Settings" />
          <NavItem to="/admin/analytics" icon={ChartBar} label="Analytics" />
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
