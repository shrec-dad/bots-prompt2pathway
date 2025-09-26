// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// LAYOUT
import AdminLayout from "./pages/admin/AdminLayout";

// ADMIN PAGES (all under src/pages/admin)
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Bots from "./pages/admin/Bots";
import Builder from "./pages/admin/Builder";
import Knowledge from "./pages/admin/Knowledge";
import Branding from "./pages/admin/Branding";
import Nurture from "./pages/admin/Nurture";
import Integrations from "./pages/admin/Integrations";
import Settings from "./pages/admin/Settings";
import Analytics from "./pages/admin/Analytics";
import Embed from "./pages/admin/Embed";

export default function AppRoutes() {
  return (
    <Routes>
      {/* send root to admin dashboard */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* LAYOUT ROUTE: everything under /admin uses AdminLayout */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* index of /admin -> /admin/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="bots" element={<Bots />} />
        <Route path="builder" element={<Builder />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="nurture" element={<Nurture />} />
        <Route path="branding" element={<Branding />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="embed" element={<Embed />} />
      </Route>

      {/* catch-all: go back to dashboard */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
