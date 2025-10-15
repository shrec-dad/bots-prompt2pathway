// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}
