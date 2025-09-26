// src/pages/EmbedPage.tsx
import React from "react";
import "../styles/admin-shared.css";
import EmbedGenerator from "../components/EmbedGenerator";

export default function EmbedPage() {
  return (
    <div className="admin-page bg-grad-purple">
      <div className="h-row">
        <div className="h-title">Embed</div>
      </div>
      <EmbedGenerator />
    </div>
  );
}
