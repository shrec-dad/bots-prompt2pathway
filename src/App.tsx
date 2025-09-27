// src/App.tsx
import React from "react";
import AppRoutes from "./routes"; // this file must NOT create a BrowserRouter

export default function App() {
  // App is a thin shell that renders your route tree.
  return <AppRoutes />;
}
