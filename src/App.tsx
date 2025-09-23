// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AdminLayout from "./pages/admin/AdminLayout";

// Admin pages (all default exports)
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

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Admin section with sidebar layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
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
        </Route>

        {/* Default route can redirect to admin */}
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
