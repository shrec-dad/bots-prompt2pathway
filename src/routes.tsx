// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Bots from "./pages/Bots";
import Builder from "./pages/admin/Builder";
import Knowledge from "./pages/Knowledge";
import BrandingPage from "./pages/BrandingPage";
import NurturePage from "./pages/NurturePage";
import IntegrationsPage from "./pages/admin/Integrations";
import SettingsPage from "./pages/admin/Settings";
import AnalyticsPage from "./pages/admin/Analytics";
import EmbedPage from "./pages/EmbedPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/bots" element={<Bots />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/knowledge" element={<Knowledge />} />
      <Route path="/branding" element={<BrandingPage />} />
      <Route path="/nurture" element={<NurturePage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/embed" element={<EmbedPage />} />
    </Routes>
  );
}
