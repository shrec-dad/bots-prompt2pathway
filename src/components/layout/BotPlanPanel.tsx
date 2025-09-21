// src/components/layout/BotPlanPanel.tsx
import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

const BotPlanPanel: React.FC = () => {
  const {
    currentBot,
    botPlan,
    setBotPlan,
    includeNurture,
    setIncludeNurture,
  } = useAdminStore();

  return (
    <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        {currentBot} Configuration
      </h2>

      {/* Bot Plan */}
      <div className="mb-6">
        <p className="font-medium mb-2">Bot Plan</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setBotPlan("basic")}
            className={`rounded-lg px-4 py-2 ${
              botPlan === "basic"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Basic Bot
          </button>

          <button
            type="button"
            onClick={() => setBotPlan("custom")}
            className={`rounded-lg px-4 py-2 ${
              botPlan === "custom"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Custom Bot
          </button>
        </div>
      </div>

      {/* Nurture add-on */}
      <div className="mt-4">
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={includeNurture}
            onChange={(e) => setIncludeNurture(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </label>
        <span className="ml-3 font-medium">Add Follow-up / Nurture Bot</span>
        <p className="text-sm text-gray-500 mt-1">
          Upsell option: automatically nurture leads via email, SMS, or chat
          after they interact with this bot.
        </p>
      </div>
    </section>
  );
};

export default BotPlanPanel;

       
      
