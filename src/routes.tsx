// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import AdminLayout from "./pages/admin/AdminLayout";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Bots from "./pages/admin/Bots";
import Builder from "./pages/admin/Builder";
import Knowledge from "./pages/admin/Knowledge";
import Nurture from "./pages/admin/Nurture";
import Branding from "./pages/admin/Branding";
import Integrations from "./pages/admin/Integrations";
import Settings from "./pages/admin/Settings";
import Analytics from "./pages/admin/Analytics";

// ── Pick ONE of these depending on where your file lives ───────────────────────
// If you moved it under /admin:
import EmbedPage from "./pages/admin/Embed";
// If it’s still at src/pages/EmbedPage.tsx, use this instead:
// import EmbedPage from "./pages/EmbedPage";
// ──────────────────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect to admin dashboard */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* All admin pages share the sidebar/header via AdminLayout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="bots" element={<Bots />} />
        <Route path="builder" element={<Builder />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="nurture" element={<Nurture />} />
        <Route path="branding" element={<Branding />} /> {/* << ONLY branding route */}
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="embed" element={<EmbedPage />} />
      </Route>

      {/* Catch-all → admin dashboard */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
