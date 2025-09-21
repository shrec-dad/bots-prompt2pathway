// src/components/layout/Topbar.tsx
import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

const Topbar: React.FC = () => {
  const { currentBot, setCurrentBot } = useAdminStore();

  return (
    <header className="flex items-center justify-between bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 shadow-md">
      {/* Left: title */}
      <div className="text-white font-semibold text-xl">
        Multi-Bot Dashboard
      </div>

      {/* Right: bot selector */}
      <div>
        <select
          value={currentBot}
          onChange={(e) => setCurrentBot(e.target.value as any)}
          className="rounded-lg px-3 py-2 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
        >
          <option value="LeadQualifier">Lead Qualifier</option>
          <option value="AppointmentBooking">Appointment Booking</option>
          <option value="CustomerSupport">Customer Support</option>
          <option value="Waitlist">Waitlist</option>
          <option value="SocialMedia">Social Media</option>
        </select>
      </div>
    </header>
  );
};

export default Topbar;
