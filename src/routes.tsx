// src/routes.tsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

// Admin shell (your left-nav + right content)
import AdminLayout from "./pages/admin/adminlayout";

// Public pages
import Home from "./pages/Index";
import Widget from "./pages/Widget";

// Admin pages
import AdminDashboard from "./pages/admin/Index";
import Clients from "./pages/admin/Clients";
import Bots from "./pages/admin/Bots";
import Builder from "./pages/admin/Builder";
import Knowledge from "./pages/admin/Knowledge";
import Nurture from "./pages/admin/Nurture";
import Branding from "./pages/admin/Branding";
import Analytics from "./pages/admin/Analytics";
import Integrations from "./pages/admin/Integrations";
import Settings from "./pages/admin/Settings";
import Preview from "./pages/admin/Preview";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },   // /admin
      { path: "clients", element: <Clients /> },      // /admin/clients
      { path: "bots", element: <Bots /> },            // /admin/bots
      { path: "builder", element: <Builder /> },      // /admin/builder
      { path: "knowledge", element: <Knowledge /> },  // ✅ /admin/knowledge
      { path: "nurture", element: <Nurture /> },      // /admin/nurture
      { path: "branding", element: <Branding /> },    // /admin/branding
      { path: "analytics", element: <Analytics /> },  // /admin/analytics
      { path: "integrations", element: <Integrations /> }, // /admin/integrations
      { path: "settings", element: <Settings /> },    // /admin/settings
      { path: "preview", element: <Preview /> },      // /admin/preview
    ],
  },

  { path: "/widget", element: <Widget /> },
]);
