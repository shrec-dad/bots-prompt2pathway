// src/pages/admin/Embed.tsx
import React from "react";
import "../../styles/admin-shared.css";
import EmbedGenerator from "../../components/EmbedGenerator";

export default function Embed() {
  return (
    <div className="admin-page bg-grad-purple">
      <div className="h-row">
        <div className="h-title">Embed</div>
      </div>
      <EmbedGenerator />
    </div>
  );
}
