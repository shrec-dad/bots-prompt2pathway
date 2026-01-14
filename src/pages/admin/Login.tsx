// src/pages/admin/Login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { forgotPasswordAPI, resetPasswordAPI } from "@/api";

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
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);

  const [theme, toggleTheme] = useTheme();
  
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      setShowForgotPassword(true);
    }
  }, [searchParams]);

  async function doLogin(email: string, password: string) {
    setError("");
    setIsLoading(true);
    
    try {
      const res = await login({
        email: email.trim(),
        password
      });

      console.log(res);

      if (res?.user) {
        navigate("/admin", { replace: true });
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      // Handle API errors (e.g., 400 status for invalid credentials)
      const errorMessage = error?.response?.data?.message || "Login failed. Please check your email and password.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForgotPasswordLoading(true);
    setForgotPasswordSuccess(false);

    try {
      await forgotPasswordAPI({ email: forgotPasswordEmail.trim() });
      setForgotPasswordSuccess(true);
      setForgotPasswordEmail("");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to send reset email. Please try again.";
      setError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setResetPasswordLoading(true);
    setResetPasswordSuccess(false);

    try {
      await resetPasswordAPI({ token: resetToken, password: newPassword });
      setResetPasswordSuccess(true);
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-sky-500
                       dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-sky-500
                       dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                       dark:from-sky-600 dark:to-emerald-600"
          >
            {isLoading ? "Logging in..." : "Log In"}
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
            onClick={() => {
              setShowForgotPassword(true);
              setError("");
              setForgotPasswordSuccess(false);
            }}
            className="text-sm text-blue-700 underline hover:opacity-90
                       dark:text-blue-300"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white/95 p-6 shadow-xl backdrop-blur-md
                          dark:border-white/10 dark:bg-slate-800/95">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError("");
                setForgotPasswordSuccess(false);
                setResetToken("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>

            {resetToken ? (
              // Reset Password Form
              <>
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  Reset Password
                </h2>
                {resetPasswordSuccess ? (
                  <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400">
                    Password reset successfully!
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <input
                        type="password"
                        placeholder="New Password"
                        className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                                   focus:outline-none focus:ring-2 focus:ring-sky-500
                                   dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError("");
                        }}
                        required
                        minLength={6}
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                                   focus:outline-none focus:ring-2 focus:ring-sky-500
                                   dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError("");
                        }}
                        required
                        minLength={6}
                      />
                      <button
                        type="submit"
                        disabled={resetPasswordLoading}
                        className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                   dark:from-sky-600 dark:to-emerald-600"
                      >
                        {resetPasswordLoading ? "Resetting..." : "Reset Password"}
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              // Forgot Password Form
              <>
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  Forgot Password
                </h2>
                {forgotPasswordSuccess ? (
                  <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400">
                    If that email exists, a password reset link has been sent. Please check your inbox.
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full rounded-lg border border-gray-300/70 bg-white/80 p-2 text-gray-900 placeholder-gray-500
                                   focus:outline-none focus:ring-2 focus:ring-sky-500
                                   dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-400"
                        value={forgotPasswordEmail}
                        onChange={(e) => {
                          setForgotPasswordEmail(e.target.value);
                          if (error) setError("");
                        }}
                        required
                      />
                      <button
                        type="submit"
                        disabled={forgotPasswordLoading}
                        className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 py-2 font-bold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed
                                   dark:from-sky-600 dark:to-emerald-600"
                      >
                        {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
