import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

export const AdminHeader: React.FC = () => {
  const { currentBot, setCurrentBot } = useAdminStore();

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white text-lg">
            🤖
          </div>
          <div className="hidden sm:block">
            <div className="text-sm text-gray-500">Lead Qualifier Pro</div>
            <div className="font-semibold">Admin</div>
          </div>
        </div>

        {/* This is the dropdown you’ve been clicking – now it’s wired */}
        <select
          value={currentBot}
          onChange={(e) => setCurrentBot(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
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

            
            
         
