import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

export const Topbar: React.FC = () => {
  const { currentBot, setCurrentBot } = useAdminStore();

  return (
    <header className="flex items-center justify-between bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 shadow-md">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-xl">Multi-Bot Dashboard</span>
        <select
          value={currentBot}
          onChange={(e) => setCurrentBot(e.target.value)}
          className="rounded-lg px-3 py-2 text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="LeadQualifier">Lead Qualifier Bot</option>
          <option value="AppointmentBooking">Appointment Booking Bot</option>
          <option value="CustomerSupport">Customer Support Bot</option>
          <option value="Waitlist">Waitlist Bot</option>
          <option value="SocialMedia">Social Media Bot</option>
        </select>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <button className="rounded-md bg-white/20 px-4 py-2 text-sm font-medium text-white shadow hover:bg-white/30 transition">
          Test Bot
        </button>
        <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-purple-600 shadow hover:bg-gray-100 transition">
          Save
        </button>
      </div>
    </header>
  );
};

