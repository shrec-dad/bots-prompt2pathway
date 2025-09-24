// src/pages/admin/Analytics.tsx
import React from "react";

function Analytics() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white">
        <h1 className="text-2xl font-bold text-black">Analytics</h1>
        <p className="mt-2 text-black">Track performance, usage, and engagement metrics.</p>
      </div>

      {/* Metrics Section */}
      <div className="border-2 border-black rounded-xl p-6 bg-gradient-to-r from-purple-200 via-blue-200 to-green-200">
        <h2 className="font-bold text-lg text-black">Metrics</h2>
        <ul className="mt-2 space-y-2">
          <li className="border-2 border-black rounded-md p-3 bg-white text-black font-semibold">
            Conversations: 0
          </li>
          <li className="border-2 border-black rounded-md p-3 bg-white text-black font-semibold">
            Leads Captured: 0
          </li>
          <li className="border-2 border-black rounded-md p-3 bg-white text-black font-semibold">
            Appointments Booked: 0
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Analytics;
