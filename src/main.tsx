// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/*  ✅ NEW: load theme css + apply saved (or default) palette  */
import "@/styles/theme.css";
import { applyTheme } from "@/lib/theme";
applyTheme();

// ✅ Keep your migrations at the top, too
import { ensureMigrations } from "@/lib/storageVersion";
ensureMigrations();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
