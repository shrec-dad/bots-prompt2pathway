// src/routes.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// Optional: if you have a Bots page file, we’ll route it. If not, this can be added later.
// import BotsPage from "./pages/admin/Bots";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 800 }}>Page not found</h2>
      <p>Check the URL or use the admin sidebar.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default to your admin shell */}
        <Route path="/" element={<Navigate to="/admin/knowledge" replace />} />

        {/* Admin shell pages (match your sidebar) */}
        <Route path="/admin/knowledge" element={<KnowledgePage />} />
        <Route path="/admin/builder" element={<BuilderPage />} />
        {/* <Route path="/admin/bots" element={<BotsPage />} /> */}

        {/* Your admin tabs under /admin/* so the sidebar can link to them */}
        <Route path="/admin/branding"
