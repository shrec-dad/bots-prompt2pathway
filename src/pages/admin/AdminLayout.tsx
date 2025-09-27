// src/pages/admin/layout/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

/**
 * PURPOSE
 * - Restores the classic Admin layout:
 *   Left: fixed vertical sidebar navigation.
 *   Right: scrollable page content (Dashboard, Bots, Builder, etc.).
 */

const navItems = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/clients", label: "Clients" },
  { to: "/admin/bots", label: "Bots" },
  { to: "/admin/builder", label: "Builder" },
  { to: "/admin/knowledge", label: "Knowledge" },
  { to: "/admin/nurture", label: "Nurture" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/integrations", label: "Integrations" },
  { to: "/admin/branding", label: "Branding" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/preview", label: "Preview" },
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
      {/* LEFT SIDEBAR */}
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
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exact as any}
                  style={({ isActive }) => ({
                    display: "block",
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
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* RIGHT CONTENT */}
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
