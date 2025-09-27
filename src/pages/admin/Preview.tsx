// src/pages/admin/Preview.tsx
import React from "react";

export default function Preview() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Bot Preview</h1>
        <p className="text-gray-600 text-sm">
          This is what your customers will see when they interact with your bot.
        </p>
      </div>

      {/* Bot Preview Container */}
      <div className="w-full max-w-md h-[600px] border-2 border-black rounded-xl overflow-hidden shadow-lg bg-white">
        <iframe
          src="/widget" // this assumes you have a widget route or embed endpoint
          title="Bot Preview"
          className="w-full h-full"
          style={{ border: "none" }}
        />
      </div>

      {/* Notes */}
      <div className="mt-4 text-xs text-gray-500 text-center max-w-sm">
        The preview uses the same widget embed code your customers will see when
        you place the bot on a public site.
      </div>
    </div>
  );
}
