// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";

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
        "flex items-center gap-3 rounded-xl px-4 py-3 text-base transition",
        isActive
          ? "bg-gradient-to-r from-green-500/20 to-orange-500/20 text-foreground"
          : "text-muted-foreground hover:bg-muted/50",
      ].join(" ")
    }
  >
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
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
      <aside className="w-80 shrink-0 border-r bg-card/50 backdrop-blur-sm">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20">
              🤖
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lead Qualifier Pro</div>
              <div className="text-xl font-semibold">Admin</div>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 pb-6">
          <NavItem to="/admin" icon={"📊"} label="Dashboard" />
          <NavItem to="/admin/clients" icon={"👥"} label="Clients" />
          <NavItem to="/admin/bots" icon={"🧰"} label="Bots" />
          <NavItem to="/admin/builder" icon={"🧩"} label="Builder" />
          <NavItem to="/admin/knowledge" icon={"📚"} label="Knowledge" />
          <NavItem to="/admin/nurture" icon={"✉️"} label="Nurture" />
          <NavItem to="/admin/branding" icon={"🎨"} label="Branding" />
          <NavItem to="/admin/integrations" icon={"🔗"} label="Integrations" />
          <NavItem to="/admin/settings" icon={"⚙️"} label="Settings" />
        </nav>
      </aside>

      {/* RIGHT – MAIN COLUMN (full width) */}
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* STICKY TOP BAR WITH BOT DROPDOWN */}
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="text-sm text-muted-foreground">You are editing</div>
            <div className="relative z-50 pointer-events-auto">
              <select
                value={currentBot}
                onChange={(e) => setCurrentBot(e.target.value as any)}
                className="rounded-xl border bg-card px-4 py-2 text-sm shadow-sm focus:outline-none"
              >
                <option value="LeadQualifier">Lead Qualifier</option>
                <option value="AppointmentBooking">Appointment Booking</option>
                <option value="CustomerSupport">Customer Support</option>
                <option value="Waitlist">Waitlist</option>
                <option value="SocialMedia">Social Media</option>
              </select>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT – full width, no side panel */}
        <section className="w-full flex-1 overflow-auto p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
