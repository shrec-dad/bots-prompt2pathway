// src/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✅ Keep ONLY this import first to confirm the router works
import KnowledgePage from "./pages/admin/Knowledge";

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
    <Routes>
      <Route path="/" element={<Navigate to="/admin/knowledge" replace />} />
      <Route path="/admin/knowledge" element={<KnowledgePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
