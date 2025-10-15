import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");

  function doLogin(targetEmail: string) {
    login({
      id: crypto.randomUUID(),
      name: "Admin",
      email: targetEmail.trim() || "admin@example.com",
      role: "admin",
    });
    navigate("/admin", { replace: true });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-300 via-sky-200 to-emerald-200">
      {/* Optional decorative blur ball for extra depth */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-400/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-400/30 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/30 backdrop-blur-md p-6 shadow-xl">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300/60 bg-white/70 p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (ignored in demo)"
            className="w-full rounded-lg border border-gray-300/60 bg-white/70 p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white hover:opacity-90 transition"
          >
            Log In
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => doLogin("admin@example.com")}
            className="w-full rounded-lg border border-gray-400/50 bg-white/50 py-2 font-semibold hover:bg-white/70 transition"
          >
            Continue as demo (no password)
          </button>

          <button
            onClick={() =>
              alert("🔐 Forgot password emails will be added after backend setup.")
            }
            className="text-blue-600 underline text-sm"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
