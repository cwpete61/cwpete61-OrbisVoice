"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const affiliateSlug = localStorage.getItem("affiliate_slug") || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          username,
          password,
          referralCode,
          affiliateSlug
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.data.token);
        router.push("/dashboard");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/url`);
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.data.url;
      } else {
        setError(data.message || "Google sign-up unavailable");
      }
    } catch (err) {
      setError("Error: " + String(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#05080f]">
      <PublicNav />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#14b8a6]">
              <div className="h-5 w-5 rounded-sm bg-[#05080f]" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Create your account</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Deploy your first AI voice agent free</p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
            <form onSubmit={handleSignup} className="space-y-4">
              {referralCode && (
                <div className="rounded-lg border border-[#14b8a6]/30 bg-[#14b8a6]/10 p-3 text-xs text-[#14b8a6] flex items-center gap-2">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Referral code <span className="font-bold">{referralCode}</span> applied! You'll get $10 credit.
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#f97316]">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.02] px-4 py-2.5 text-sm text-[rgba(240,244,250,0.7)] hover:border-white/[0.2] hover:bg-white/[0.05] transition"
              >
                <span className="text-base">G</span>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-[rgba(240,244,250,0.35)]">
                <div className="h-px flex-1 bg-white/[0.06]" />
                or
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Full name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Username</label>
                <input
                  type="text"
                  placeholder="jane_smith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                  minLength={3}
                  required
                />
                <p className="mt-1 text-xs text-[rgba(240,244,250,0.35)]">3+ characters, letters, numbers, underscore, hyphen</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Work email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full py-2.5"
              >
                {loading ? "Creating account…" : "Create Account — Free"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-[rgba(240,244,250,0.3)]">No credit card required</p>
          </div>

          <p className="mt-5 text-center text-sm text-[rgba(240,244,250,0.4)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#14b8a6] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
