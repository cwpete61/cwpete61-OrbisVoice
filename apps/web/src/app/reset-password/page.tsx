"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import { API_BASE } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Password reset successful!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[#f0f4fa]">Set New Password</h1>
        <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Choose a strong password for your account</p>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
        {message ? (
          <div className="text-center">
            <div className="mb-4 rounded-lg border border-[#14b8a6]/30 bg-[#14b8a6]/10 p-4 text-sm text-[#14b8a6]">
              {message}
            </div>
            <p className="text-xs text-[rgba(240,244,250,0.4)]">Redirecting to login in 3 seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#f97316]">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">New Password</label>
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Confirm New Password</label>
              <PasswordInput
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token}
              className="btn-primary mt-2 w-full py-2.5"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#05080f]">
      <PublicNav />
      <div className="flex flex-grow items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-[#f0f4fa]">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
