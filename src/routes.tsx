// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Admin shell (left nav + right content)
import AdminLayout from "./pages/admin/adminlayout";

// Public pages
import Home from "./pages/Index";
import Widget from "./pages/Widget";

// Admin pages
import AdminDashboard from "./pages/admin/Index";
import Clients from "./pages/admin/Clients";
import Bots from "./pages/admin/Bots";
import Builder from "./pages/admin/Builder";
import Knowledge from "./pages/admin/Knowledge"; // <- Capital K
import Nurture from "./pages/admin/Nurture";
import Branding from "./pages/admin/Branding";
import Analytics from "./pages/admin/Analytics";
import Integrations from "./pages/admin/Integrations";
import Settings from "./pages/admin/Settings";
import Preview from "./pages/admin/Preview";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/widget" element={<Widget />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="bots" element={<Bots />} />
        <Route path="builder" element={<Builder />} />
        <Route path="knowledge" element={<Knowledge />} /> {/* ✅ */}
        <Route path="nurture" element={<Nurture />} />
        <Route path="branding" element={<Branding />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="preview" element={<Preview />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
