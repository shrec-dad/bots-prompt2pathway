// src/pages/admin/Integrations.tsx
import React from "react";

function Integrations() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-bold text-black">Integrations</h1>
        <p className="mt-2 text-black">
          Connect your bot to tools like email, CRM, and calendars.
        </p>
      </div>

      {/* List of Integrations */}
      <div className="border-2 border-black rounded-xl p-6 bg-gradient-to-r from-green-200 via-blue-200 to-indigo-200">
        <h2 className="font-bold text-lg text-black">Available Integrations</h2>
        <ul className="mt-2 space-y-2">
          <li className="border-2 border-black rounded-md p-3 bg-white text-black font-semibold">
            📧 Email Integration
          </li>
          <li className="border-2 border-black rounded-md p-3 bg-white text-black font-semibold">
            📅 Calendar Integration
          </li>
          <li className="border-2 border-black rounded-md p-3 bg-white text-black font-semibold">
            💼 CRM Integration
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Integrations;

