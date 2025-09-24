// src/pages/admin/Branding.tsx
import React from "react";

function Branding() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-bold text-black">Branding</h1>
        <p className="mt-2 text-black">
          Customize the look and feel of your bot with logos, colors, and themes.
        </p>
      </div>

      {/* Upload Logo */}
      <div className="border-2 border-black rounded-xl p-6 bg-gradient-to-r from-yellow-200 via-green-200 to-teal-200">
        <h2 className="font-bold text-lg text-black">Upload Logo</h2>
        <button className="mt-4 px-4 py-2 border-2 border-black rounded-md bg-white font-bold text-black">
          + Upload Logo
        </button>
      </div>
    </div>
  );
}

export default Branding;
