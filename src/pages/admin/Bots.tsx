import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminStore } from "@/lib/AdminStore";

type BotCard = {
  key: "LeadQualifier" | "AppointmentBooking" | "CustomerSupport" | "Waitlist" | "SocialMedia";
  name: string;
  type: string;
  status: "Active" | "Draft";
  leads: number;
  conv: string;
  tags?: string[];
};

const BOTS: BotCard[] = [
  { key: "LeadQualifier", name: "Lead Qualifier Pro", type: "Lead Qualifier", status: "Active", leads: 245, conv: "28.4%", tags: ["Nurture"] },
  { key: "AppointmentBooking", name: "Appointment Scheduler", type: "Appointment Booking", status: "Active", leads: 158, conv: "41.2%" },
  { key: "CustomerSupport", name: "Support Assistant", type: "Customer Support", status: "Active", leads: 89, conv: "15.7%" },
  { key: "Waitlist", name: "Waitlist Manager", type: "Waitlist", status: "Draft", leads: 0, conv: "0%" },
  { key: "SocialMedia", name: "Social Media Concierge", type: "Social Media", status: "Draft", leads: 0, conv: "—" },
];

export const Bots: React.FC = () => {
  const nav = useNavigate();
  const { setCurrentBot } = useAdminStore();

  const openBot = (key: BotCard["key"]) => {
    setCurrentBot(key);
    nav("/admin/builder");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bots</h1>
        <p className="text-gray-500">Manage all your bots and their configurations</p>
      </div>

      {/* Filters (non-functional placeholders for now) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Search bots…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm"
        />
        <div className="flex gap-2">
          <select className="rounded-lg border px-3 py-2 text-sm shadow-sm">
            <option>All Types</option>
            <option>Lead Qualifier</option>
            <option>Appointment Booking</option>
            <option>Customer Support</option>
            <option>Waitlist</option>
            <option>Social Media</option>
          </select>
          <select className="rounded-lg border px-3 py-2 text-sm shadow-sm">
            <option>All Status</option>
            <option>Active</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {BOTS.map((b) => (
          <button
            key={b.key}
            onClick={() => openBot(b.key)}
            className="text-left rounded-2xl border bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 grid place-items-center text-indigo-600">🤖</div>
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-gray-500">{b.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {b.tags?.includes("Nurture") && (
                  <span className="px-2 py-1 rounded-full bg-pink-100 text-pink-700 text-xs">Nurture</span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    b.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Leads</div>
                <div className="font-semibold">{b.leads}</div>
              </div>
              <div>
                <div className="text-gray-500">Conversion</div>
                <div className="font-semibold">{b.conv}</div>
              </div>
            </div>

            <div className="mt-4 text-indigo-600 text-sm font-medium">Open in Builder →</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Bots;

 
    
 
  



    
                 
           
          
                  
                      
             
             
