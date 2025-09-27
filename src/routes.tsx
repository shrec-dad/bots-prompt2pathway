// src/routes.tsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AdminLayout from "./pages/admin/adminlayout";

import Home from "./pages/Index";
import Widget from "./pages/Widget";

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
      { index: true, element: <AdminDashboard /> },
      { path: "clients", element: <Clients /> },
      { path: "bots", element: <Bots /> },
      { path: "builder", element: <Builder /> },
      { path: "knowledge", element: <Knowledge /> },   // ✅ this route
      { path: "nurture", element: <Nurture /> },
      { path: "branding", element: <Branding /> },
      { path: "analytics", element: <Analytics /> },
      { path: "integrations", element: <Integrations /> },
      { path: "settings", element: <Settings /> },
      { path: "preview", element: <Preview /> },
    ],
  },
  { path: "/widget", element: <Widget /> },
]);
