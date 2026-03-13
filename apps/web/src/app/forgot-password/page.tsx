"use client";

import Link from "next/link";
import { useState } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import { API_BASE } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "If an account exists, a reset link has been sent.");
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#05080f]">
      <PublicNav />
      <div className="flex flex-grow items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Reset Password</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Enter your email to receive a password reset link</p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
            {message ? (
              <div className="text-center">
                <div className="mb-4 rounded-lg border border-[#14b8a6]/30 bg-[#14b8a6]/10 p-4 text-sm text-[#14b8a6]">
                  {message}
                </div>
                <Link href="/login" className="text-sm font-semibold text-[#14b8a6] hover:underline">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#f97316]">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Email or Username</label>
                  <input
                    type="text"
                    placeholder="email@example.com or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-2 w-full py-2.5"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <div className="text-center mt-4">
                  <Link href="/login" className="text-xs text-[rgba(240,244,250,0.4)] hover:text-[#14b8a6] transition">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
