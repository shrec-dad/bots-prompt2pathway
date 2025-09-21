import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

export const BotPlanPanel: React.FC = () => {
  const {
    currentBot,
    botPlan,
    setBotPlan,
    includeNurture,
    setIncludeNurture,
  } = useAdminStore();

  return (
    <section className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">
        {currentBot} Configuration
      </h2>

      {/* Basic vs Custom */}
      <div className="space-y-2">
        <label className="block font-medium text-gray-700">Bot Plan</label>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-md border ${
              botPlan === "basic"
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setBotPlan("basic")}
          >
            Basic Bot
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${
              botPlan === "custom"
                ? "bg-pink-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setBotPlan("custom")}
          >
            Custom Bot
          </button>
        </div>
      </div>

      {/* Nurture Add-on */}
      {(currentBot === "LeadQualifier" || currentBot === "Waitlist") && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-medium text-gray-700">
            <input
              type="checkbox"
              checked={includeNurture}
              onChange={(e) => setIncludeNurture(e.target.checked)}
              className="h-4 w-4 text-pink-500 border-gray-300 rounded"
            />
            Add Follow-up / Nurture Bot
          </label>
          <p className="text-sm text-gray-500">
            Upsell option: automatically nurture leads via email, SMS, or chat
            after they interact with your {currentBot}.
          </p>
        </div>
      )}
    </section>
  );
};

