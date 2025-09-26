import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/clients" element={<Clients />} />
      <Route path="/admin/bots" element={<Bots />} />
      <Route path="/admin/builder" element={<Builder />} />
      <Route path="/admin/knowledge" element={<Knowledge />} />
      <Route path="/admin/branding" element={<Branding />} />
      <Route path="/admin/nurture" element={<Nurture />} />
      <Route path="/admin/integrations" element={<Integrations />} />
      <Route path="/admin/settings" element={<Settings />} />
      <Route path="/admin/analytics" element={<Analytics />} />
      <Route path="/admin/embed" element={<Embed />} />
    </Routes>
  );
}
