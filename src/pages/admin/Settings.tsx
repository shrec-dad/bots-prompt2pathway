// src/pages/admin/Settings.tsx
import React, { useMemo, useState, useEffect } from "react";
import { getJSON, setJSON } from "../../lib/storage"; // adjust if storage lives elsewhere
import "../../styles/admin-shared.css";

type Settings = {
  basicOrCustom: "basic" | "custom";
  domainWhitelist: string;
  darkMode: boolean;
  language: string;
};

const KEY = "appSettings";

export default function Settings() {
  const initial = useMemo<Settings>(
    () =>
      getJSON(KEY, {
        basicOrCustom: "basic",
        domainWhitelist: "example.com",
        darkMode: false,
        language: "en",
      }),
    []
  );

  const [s, setS] = useState<Settings>(initial);

  const save = () => {
    setJSON(KEY, s);
    alert("Settings saved!");
  };

  // Apply dark mode by toggling a CSS class on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (s.darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [s.darkMode]);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-r from-green-200 via-blue-200 to-purple-200 min-h-screen">
      {/* Header */}
      <div className="border-2 border-black rounded-xl p-6 bg-white shadow">
        <h1 className="text-2xl font-bold text-black">⚙️ Settings</h1>
        <p className="mt-2 text-black">
          Adjust system preferences and account details.
        </p>
      </div>

      {/* Preferences */}
      <div className="border-2 border-black rounded-xl p-6 bg-white shadow space-y-4">
        <h2 className="font-bold text-lg text-black">Preferences</h2>

        {/* Mode toggle */}
        <label className="block text-black font-semibold">
          Mode
          <select
            className="ml-2 border-2 border-black rounded p-1"
            value={s.basicOrCustom}
            onChange={(e) =>
              setS({ ...s, basicOrCustom: e.target.value as Settings["basicOrCustom"] })
            }
          >
            <option value="basic">Basic</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {/* Domain whitelist */}
        <label className="block text-black font-semibold">
          Domain Whitelist
          <input
            className="ml-2 border-2 border-black rounded p-1 w-full"
            placeholder="example.com, clientsite.com"
            value={s.domainWhitelist}
            onChange={(e) => setS({ ...s, domainWhitelist: e.target.value })}
          />
        </label>

        {/* Language */}
        <label className="block text-black font-semibold">
          Language
          <select
            className="ml-2 border-2 border-black rounded p-1"
            value={s.language}
            onChange={(e) => setS({ ...s, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </label>

        {/* Dark mode */}
        <label className="flex items-center text-black font-semibold gap-2">
          <input
            type="checkbox"
            checked={s.darkMode}
            onChange={(e) => setS({ ...s, darkMode: e.target.checked })}
          />
          Dark Mode
        </label>

        {/* Save button */}
        <button
          className="mt-4 px-4 py-2 border-2 border-black rounded-md bg-black text-white font-bold"
          onClick={save}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
