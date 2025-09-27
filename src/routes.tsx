// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Widget from "@/pages/Widget";

import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Bots from "@/pages/admin/Bots";
import Builder from "@/pages/admin/Builder";
import Branding from "@/pages/admin/Branding";
import Analytics from "@/pages/admin/Analytics";
import Integrations from "@/pages/admin/Integrations";
import Clients from "@/pages/admin/Clients";
import Nurture from "@/pages/admin/Nurture";
import Knowledge from "@/pages/admin/Knowledge";
import Settings from "@/pages/admin/Settings";
import Preview from "@/pages/admin/Preview";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Index />} />
      <Route path="/widget" element={<Widget />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* index renders Dashboard at /admin */}
        <Route index element={<Dashboard />} />

        {/* alias so /admin/dashboard also works */}
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="bots" element={<Bots />} />
        <Route path="builder" element={<Builder />} />
        <Route path="branding" element={<Branding />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="clients" element={<Clients />} />
        <Route path="nurture" element={<Nurture />} />
        <Route path="settings" element={<Settings />} />
        <Route path="preview" element={<Preview />} />
      </Route>

      {/* legacy redirect (optional) */}
      <Route path="/admin/preview/*" element={<Navigate to="/admin/preview" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
