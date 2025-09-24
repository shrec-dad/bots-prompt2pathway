// src/pages/admin/Settings.tsx
import React from "react";

function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="mt-2 text-black">Adjust your system preferences and account details.</p>
      </div>

      {/* Preferences */}
      <div className="border-2 border-black rounded-xl p-6 bg-gradient-to-r from-orange-200 via-yellow-200 to-pink-200">
        <h2 className="font-bold text-lg text-black">Preferences</h2>
        <button className="mt-4 px-4 py-2 border-2 border-black rounded-md bg-white font-bold text-black">
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default Settings;

