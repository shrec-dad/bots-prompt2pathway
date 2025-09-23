// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import BackgroundManager from "@/components/BackgroundManager";

// Admin layout + pages (all default exports)
import AdminLayout from "./pages/admin/AdminLayout";
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

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BackgroundManager />
        <BrowserRouter>
          <Routes>
            {/* Always route root to Admin layout Dashboard */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Admin section with sidebar/topbar */}
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

            {/* Any unknown route → Admin Dashboard */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        {/* App-level toasters */}
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
