// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import BackgroundManager from "@/components/BackgroundManager";
import AdminLayout from "./pages/admin/AdminLayout";

import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Bots from "./pages/admin/Bots";
import Builder from "./pages/admin/Builder";
import Knowledge from "./pages/admin/Knowledge"; // ✅ NEW

// Optional: simple placeholders if these exist later
const NotFound = () => (
  <div className="p-6">
    <h1 className="text-2xl font-extrabold">Not Found</h1>
    <p className="text-foreground/70 font-semibold">The page you’re looking for doesn’t exist.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundManager />
      <Routes>
        {/* Redirect root to /admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="bots" element={<Bots />} />
          <Route path="builder" element={<Builder />} />

          {/* ✅ NEW ROUTE */}
          <Route path="knowledge" element={<Knowledge />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
