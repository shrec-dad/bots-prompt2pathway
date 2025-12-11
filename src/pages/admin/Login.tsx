// src/pages/admin/Login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

type Theme = "light" | "dark";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    // const saved = localStorage.getItem("theme") as Theme | null;
    // if (saved === "light" || saved === "dark") return saved;
    // fall back to system preference
    // return window.matchMedia("(prefers-color-scheme: dark)").matches
    //   ? "dark"
    //   : "light";
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [theme, toggleTheme] = useTheme();
  
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  async function doLogin(email: string, password: string) {
    try {
      const res = await login({
        email: email.trim(),
        password
      });

      console.log(res);

      if (res?.user) {
        navigate("/admin", { replace: true });
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      // Handle API errors (e.g., 400 status for invalid credentials)
      const errorMessage = error?.response?.data?.message || "Login failed. Please check your email and password.";
      alert(errorMessage);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  // Background classes swap with theme
  const bg = useMemo(
    () =>
      "relative flex min-h-screen items-center justify-center " +
      "bg-gradient-to-br " +
      "from-indigo-300 via-sky-200 to-emerald-200 " + // light
      "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900", // dark
    []
  );

  return (
    <div className={bg}>
      {/* Theme toggle */}
      {/* <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-full border border-white/40 bg-white/60 px-3 py-1 text-sm font-semibold shadow-sm backdrop-blur hover:bg-white/80 transition
                 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button> */}

      {/* Soft blobs for depth (auto-dim in dark) */}
      <div className="pointer-events-none absolute left-10 top-10 h-64 w-64 rounded-full bg-purple-400/30 blur-3xl dark:bg-purple-500/15" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-500/10" />

      {/* Frosted card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/30 bg-white/40 p-6 shadow-xl backdrop-blur-md
                      dark:border-white/10 dark:bg-white/10">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-sky-500
                       dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-sky-500
                       dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white hover:opacity-90 transition
                       dark:from-sky-600 dark:to-emerald-600"
          >
            Log In
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          {/* <button
            onClick={() => doLogin()}
            className="w-full rounded-lg border border-gray-400/50 bg-white/60 py-2 font-semibold hover:bg-white/80 transition
                       dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Continue as demo (no password)
          </button> */}

          <button
            onClick={() =>
              alert("🔐 Forgot password emails will be added after backend setup.")
            }
            className="text-sm text-blue-700 underline hover:opacity-90
                       dark:text-blue-300"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
