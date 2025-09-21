import React from "react";
import { useAdminStore } from "@/lib/AdminStore";

export const Builder: React.FC = () => {
  const { currentBot, botPlan } = useAdminStore();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Builder</h1>
      <p className="text-gray-600">
        Editing <span className="font-semibold">{currentBot}</span> — Plan:{" "}
        <span className="font-semibold">{botPlan === "basic" ? "Basic" : "Custom"}</span>
      </p>

      <div className="rounded-xl border bg-white p-6">
        {/* React Flow canvas or node palette goes here */}
        <div className="text-sm text-gray-500">Canvas coming soon…</div>
      </div>
    </div>
  );
};

export default Builder;
