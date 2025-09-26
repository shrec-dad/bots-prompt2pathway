// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages in /src/pages
import BrandingPage from "./pages/BrandingPage";
import NurturePage from "./pages/NurturePage";
import EmbedPage from "./pages/EmbedPage";

// Pages in /src/pages/admin
import SettingsPage from "./pages/admin/Settings";
import IntegrationsPage from "./pages/admin/Integrations";
import AnalyticsPage from "./pages/admin/Analytics";
import KnowledgePage from "./pages/admin/Knowledge";
import BuilderPage from "./pages/admin/Builder";

// Tiny 404
function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 800 }}>Page not found</h2>
      <p>Check the URL or use the admin tabs.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/branding" replace />} />

      {/* Main admin tabs you asked for */}
      <Route path="/branding" element={<BrandingPage />} />
      <Route path="/nurture" element={<NurturePage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/embed" element={<EmbedPage />} />

      {/* Lovable admin area */}
      <Route path="/admin" element={<Navigate to="/admin/knowledge" replace />} />
      <Route path="/admin/knowledge" element={<KnowledgePage />} />
      <Route path="/admin/builder" element={<BuilderPage />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
