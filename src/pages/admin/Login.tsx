// src/pages/admin/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    login(email); // ✅ temporary fake login
    navigate("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
  type="password"
  placeholder="Password (not required)"
  className="w-full border rounded px-3 py-2 mb-4"
/>
          />
          <button
            type="submit"
            className="w-full rounded bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white"
          >
            Log In
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            onClick={() => alert("🔜 Forgot password feature will trigger backend email reset")}
            className="text-blue-600 underline"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
