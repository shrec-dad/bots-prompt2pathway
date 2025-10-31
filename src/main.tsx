// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import App from "./App";
import { store } from './store';
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
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
