// src/pages/admin/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const linkBase =
  "block w-full rounded-lg px-3 py-2 font-semibold border-2 border-black bg-white hover:bg-neutral-50 transition";
const linkActive =
  "bg-gradient-to-r from-purple-200 via-blue-200 to-teal-200";

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[260px,1fr]">
      {/* Left sidebar */}
      <aside className="border-r-2 border-black bg-white">
        <div className="p-4">
          <div className="mb-4 rounded-xl border-2 border-black bg-gradient-to-r from-purple-200 via-blue-200 to-teal-200 p-4">
            <div className="text-xl font-extrabold text-black">Admin</div>
            <div className="text-sm text-black/80">Multi-Bot Platform</div>
          </div>

          <nav className="space-y-2">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/bots"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Bots
            </NavLink>
            <NavLink
              to="/admin/builder"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Builder
            </NavLink>
            <NavLink
              to="/admin/branding"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Branding
            </NavLink>
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Analytics
            </NavLink>
            <NavLink
              to="/admin/integrations"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Integrations
            </NavLink>
            <NavLink
              to="/admin/clients"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Clients
            </NavLink>
            <NavLink
              to="/admin/nurture"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Nurture
            </NavLink>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Settings
            </NavLink>

            {/* NEW: Preview in nav */}
            <NavLink
              to="/admin/preview"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Preview Widget
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Right content */}
      <main className="p-6 bg-neutral-50">
        <Outlet />
      </main>
    </div>
  );
}
