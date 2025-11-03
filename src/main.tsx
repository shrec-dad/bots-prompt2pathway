// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import App from "./App";
import { store } from './store';
import "./index.css";

import "@/styles/theme.css";
import ThemeManager from "./ThemeManager";

import { ensureMigrations } from "@/lib/storageVersion";
ensureMigrations();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeManager />
      <App />
    </Provider>
  </React.StrictMode>
);
