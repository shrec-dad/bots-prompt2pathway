// src/App.tsx - FINAL WITH LOGIN & PROTECTED ADMIN ROUTES
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ✅ Auth components
import ProtectedRoute from "@/components/ProtectedRoute";
const Login = lazy(() => import("@/pages/admin/Login"));

// Public
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Widget = lazy(() => import("@/pages/Widget"));

// Admin
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Bots = lazy(() => import("@/pages/admin/Bots"));
const Builder = lazy(() => import("@/pages/admin/Builder"));
const Branding = lazy(() => import("@/pages/admin/Branding"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const Integrations = lazy(() => import("@/pages/admin/Integrations"));
const Clients = lazy(() => import("@/pages/admin/Clients"));
const Knowledge = lazy(() => import("@/pages/admin/Knowledge"));
const Nurture = lazy(() => import("@/pages/admin/Nurture"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const Preview = lazy(() => import("@/pages/admin/Preview"));
const Embed = lazy(() => import("@/pages/admin/Embed"));
const ReceptionistSettings = lazy(() => import("@/pages/admin/ReceptionistSettings"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        <Routes>
          {/* --------------------- PUBLIC ROUTES --------------------- */}
          <Route path="/" element={<Index />} />
          <Route path="/widget" element={<Widget />} />

          {/* --------------------- AUTH ROUTES --------------------- */}
          <Route path="/admin/login" element={<Login />} />

          {/* --------------------- PROTECTED ADMIN ROUTES --------------------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
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
            <Route path="receptionist" element={<ReceptionistSettings />} />
          </Route>

          {/* Redirect Preview deep links */}
          <Route
            path="/admin/preview/*"
            element={<Navigate to="/admin/preview" replace />}
          />

          {/* --------------------- 404 --------------------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
