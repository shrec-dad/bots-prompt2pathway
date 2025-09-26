// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Only imports that match your files (from what you shared)
import BrandingPage from "./pages/BrandingPage";
import NurturePage from "./pages/NurturePage";
import EmbedPage from "./pages/EmbedPage";

import SettingsPage from "./pages/admin/Settings";
import IntegrationsPage from "./pages/admin/Integrations";
import AnalyticsPage from "./pages/admin/Analytics";

import KnowledgePage from "./pages/admin/Knowledge";
import BuilderPage from "./pages/admin/Builder";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 800 }}>Page not found</h2>
      <p>Use the left sidebar.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/branding" replace />} />

      <Route path="/branding" element={<BrandingPage />} />
      <Route path="/nurture" element={<NurturePage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/embed" element={<EmbedPage />} />

      <Route path="/admin/knowledge" element={<KnowledgePage />} />
      <Route path="/admin/builder" element={<BuilderPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
