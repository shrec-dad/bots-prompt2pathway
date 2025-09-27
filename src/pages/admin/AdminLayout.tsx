// src/pages/admin/AdminLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
// ...other imports

export default function AdminLayout() {
  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen">
      <aside className="border-r bg-white">
        <nav className="p-4 space-y-2">
          <NavLink to="/admin" className="nav-item">Dashboard</NavLink>
          <NavLink to="/admin/bots" className="nav-item">Bots</NavLink>
          <NavLink to="/admin/builder" className="nav-item">Builder</NavLink>
          <NavLink to="/admin/branding" className="nav-item">Branding</NavLink>
          <NavLink to="/admin/analytics" className="nav-item">Analytics</NavLink>
          <NavLink to="/admin/integrations" className="nav-item">Integrations</NavLink>
          <NavLink to="/admin/clients" className="nav-item">Clients</NavLink>
          <NavLink to="/admin/nurture" className="nav-item">Nurture</NavLink>
          <NavLink to="/admin/settings" className="nav-item">Settings</NavLink>

          {/* Add this */}
          <NavLink to="/admin/preview" className="nav-item">Preview Widget</NavLink>
        </nav>
      </aside>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
