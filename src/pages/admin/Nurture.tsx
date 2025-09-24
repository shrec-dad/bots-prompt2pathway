// src/pages/admin/Nurture.tsx
import React from "react";

function Nurture() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-bold text-black">Nurture</h1>
        <p className="mt-2 text-black">
          Manage follow-up sequences, drip campaigns, and nurture flows to keep leads engaged.
        </p>
      </div>

      {/* Campaigns Section */}
      <div className="border-2 border-black rounded-xl p-6 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200">
        <h2 className="font-bold text-lg text-black">Campaigns</h2>
        <p className="text-black mt-1">No campaigns yet. Create one to start nurturing leads.</p>
        <button className="mt-4 px-4 py-2 border-2 border-black rounded-md bg-white font-bold text-black">
          + Create Campaign
        </button>
      </div>
    </div>
  );
}

export default Nurture;
