// src/pages/admin/Preview.tsx
import React from "react";

export default function Preview() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bot Preview</h1>
        <p className="text-gray-600 text-sm">
          This is what customers will see. The preview loads the same widget route you’ll embed on a public site.
        </p>
      </div>

      <div className="w-full max-w-md h-[620px] rounded-xl overflow-hidden border-2 border-black bg-white shadow-lg">
        {/* The widget itself */}
        <iframe
          src="/widget"
          title="Bot Widget Preview"
          className="w-full h-full"
          style={{ border: "none" }}
        />
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Tip: adjust colors/logo in <span className="font-semibold">Branding</span>, then refresh this page.
      </p>
    </div>
  );
}
