// src/pages/admin/Embed.tsx
import React from "react";

export default function Embed() {
  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border-2 border-black bg-gradient-to-r from-purple-100 via-indigo-100 to-teal-100 p-5 shadow-[0_6px_0_#000]">
        <h1 className="text-2xl font-extrabold">Embed Code</h1>
        <p className="text-black/70 mt-1">
          This is the placeholder Embed page. If you can read this, the route
          <code className="ml-1">/admin/embed</code> works.
        </p>
      </div>
    </div>
  );
}
