// src/routes.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Admin Pages
import BrandingPage from "./pages/BrandingPage";
import NurturePage from "./pages/NurturePage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SettingsPage from "./pages/admin/Settings";   // ✅ fixed path
import AnalyticsPage from "./pages/AnalyticsPage";
import EmbedPage from "./pages/EmbedPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/branding" replace />} />

        {/* Admin routes */}
        <Route path="/branding" element={<BrandingPage />} />
        <Route path="/nurture" element={<NurturePage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/embed" element={<EmbedPage />} />
      </Routes>
    </BrowserRouter>
  );
}
