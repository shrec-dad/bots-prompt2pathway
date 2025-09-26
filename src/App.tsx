// src/App.tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ borderBottom: "2px solid black", background: "white" }}>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12 }}>
          {[
            ["/branding", "Branding"],
            ["/nurture", "Nurture"],
            ["/integrations", "Integrations"],
            ["/settings", "Settings"],
            ["/analytics", "Analytics"],
            ["/embed", "Embed"],
            ["/admin/knowledge", "Knowledge"],
            ["/admin/builder", "Builder"],
          ].map(([to, label]) => (
            <a
              key={to as string}
              href={to as string}
              style={{
                padding: "6px 12px",
                border: "2px solid black",
                borderRadius: 10,
                textDecoration: "none",
                color: "black",
                fontWeight: 700,
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
      <AppRoutes />
    </BrowserRouter>
  );
}
