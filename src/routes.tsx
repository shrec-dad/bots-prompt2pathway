// src/routes.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * IMPORTANT: These imports assume the files live at the paths below.
 * - If any file is in a different folder, adjust the import path for that one file.
 */

// Admin core pages you built
import BrandingPage from "./pages/BrandingPage";
import NurturePage from "./pages/NurturePage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SettingsPage from "./pages/admin/Settings";     // ✅ lives in src/pages/admin/Settings.tsx
import AnalyticsPage from "./pages/AnalyticsPage";
import EmbedPage from "./pages/EmbedPage";

// Admin: Knowledge & Builder (Lovable originals / your restores)
import KnowledgePage from "./pages/admin/Knowledge";    // ✅ expected at src/pages/admin/Knowledge.tsx
import BuilderPage from "./pages/admin/Builder";        // ✅ expected at src/pages/admin/Builder.tsx

// Tiny inline NotFound so this file is standalone
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
    <BrowserRouter>
      <Routes>
        {/* Default route → go to Branding */}
        <Route path="/" element={<Navigate to="/branding" replace />} />

        {/* Public/Admin main tabs you requested */}
        <Route path="/branding" element={<BrandingPage />} />
        <Route path="/nurture" element={<NurturePage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/embed" element={<EmbedPage />} />

        {/* Admin area (Lovable originals + your restore) */}
        <Route path="/admin" element={<Navigate to="/admin/knowledge" replace />} />
        <Route path="/admin/knowledge" element={<KnowledgePage />} />
        <Route path="/admin/builder" element={<BuilderPage />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
