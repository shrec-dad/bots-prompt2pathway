import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  // Pre-fill email so you can just click "Continue as demo"
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
    // NOTE: password is ignored on purpose for the temporary frontend-only login
    doLogin(email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">Admin Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password is OPTIONAL and not validated during demo */}
          <input
            type="password"
            placeholder="Password (ignored in demo)"
            className="w-full rounded border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // no "required" here on purpose
          />

          <button
            type="submit"
            className="w-full rounded bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white hover:opacity-90 transition"
          >
            Log In
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => doLogin("admin@example.com")}
            className="w-full rounded border py-2 font-semibold hover:bg-gray-50 transition"
          >
            Continue as demo (no password)
          </button>

          <button
            onClick={() =>
              alert("🔐 Forgot password emails will work after the backend is added.")
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
