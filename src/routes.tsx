// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Admin shell + pages
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Bots from "@/pages/admin/Bots";
import Builder from "@/pages/admin/Builder";
import Branding from "@/pages/admin/Branding";
import Analytics from "@/pages/admin/Analytics";
import Integrations from "@/pages/admin/Integrations";
import Clients from "@/pages/admin/Clients";
import Knowledge from "@/pages/admin/Knowledge";
import Nurture from "@/pages/admin/Nurture";
import Settings from "@/pages/admin/Settings";
import Preview from "@/pages/admin/Preview";
import Embed from "@/pages/admin/Embed"; // Make sure this file exists

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Index />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="bots" element={<Bots />} />
        <Route path="builder" element={<Builder />} />
        <Route path="branding" element={<Branding />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="nurture" element={<Nurture />} />
        <Route path="settings" element={<Settings />} />
        <Route path="preview" element={<Preview />} />
        <Route path="embed" element={<Embed />} />
      </Route>

      {/* Redirects (optional) */}
      <Route path="/admin/preview/*" element={<Navigate to="/admin/preview" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
