// src/pages/admin/adminlayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
// Lucide icons — swap if you were using another set
import {
  LayoutDashboard,
  Users,
  Bot,
  Puzzle,
  BookOpen,
  Inbox,
  BarChart3,
  Plug,
  Palette,
  Settings as SettingsIcon,
  Eye,
} from "lucide-react";

/**
 * Classic Admin Layout:
 * - Sidebar with icons on the left.
 * - Scrollable main content on the right.
 * - Prevents pages from rendering at the bottom.
 */

type NavItem = {
  to: string;
  label: string;
  exact?: boolean;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", exact: true, Icon: LayoutDashboard },
  { to: "/admin/clients", label: "Clients", Icon: Users },
  { to: "/admin/bots", label: "Bots", Icon: Bot },
  { to: "/admin/builder", label: "Builder", Icon: Puzzle },
  { to: "/admin/knowledge", label: "Knowledge", Icon: BookOpen },
  { to: "/admin/nurture", label: "Nurture", Icon: Inbox },
  { to: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/admin/integrations", label: "Integrations", Icon: Plug },
  { to: "/admin/branding", label: "Branding", Icon: Palette },
  { to: "/admin/settings", label: "Settings", Icon: SettingsIcon },
  { to: "/admin/preview", label: "Preview", Icon: Eye },
];

export default function AdminLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#fafafa",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flex: "0 0 260px",
          borderRight: "2px solid #000",
          background:
            "linear-gradient(135deg, rgba(201,180,255,0.35), rgba(180,235,220,0.35))",
          padding: 16,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#333" }}>Lead Qualifier Pro</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#111" }}>
            Admin
          </div>
        </div>

        <nav>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 10,
            }}
          >
            {navItems.map(({ to, label, exact, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={exact as any}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    border: "2px solid #000",
                    borderRadius: 14,
                    textDecoration: "none",
                    color: "#000",
                    background: isActive
                      ? "linear-gradient(135deg, #dcd1ff, #c7f0e7)"
                      : "#fff",
                    fontWeight: 700,
                  })}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      border: "2px solid #000",
                      borderRadius: 10,
                      background: "#fff",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={16} color="#000" />
                  </span>
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: 20,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
