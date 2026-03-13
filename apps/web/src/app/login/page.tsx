"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import { apiFetch } from "../../lib/api";
import { Turnstile } from "@marsidev/react-turnstile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const router = useRouter();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { res, data } = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken }),
      });
      if (res.ok) {
        localStorage.setItem("token", (data.data as any).token);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login failed");
        if ((data as any).data?.unverified) {
          setUnverifiedEmail((data as any).data.email);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { res, data } = await apiFetch<{ url: string }>("/auth/google/url");
      if (res.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.message || "Failed to start Google login");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to start Google login. Please try again.");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendStatus("loading");
    try {
      const { res, data } = await apiFetch("/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      if (res.ok) {
        setResendStatus("success");
      } else {
        setResendStatus("error");
        setError(data.message || "Failed to resend verification email");
      }
    } catch (err) {
      setResendStatus("error");
      setError("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#05080f]">
      <PublicNav />
      <div className="flex flex-grow items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#14b8a6]">
              <div className="h-5 w-5 rounded-sm bg-[#05080f]" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Welcome back</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Sign in to your MyOrbisVoice account</p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#f97316]">
                  {error}
                  {unverifiedEmail && (
                    <div className="mt-2 pt-2 border-t border-[#f97316]/20">
                      {resendStatus === "success" ? (
                        <p className="text-xs text-[#14b8a6]">Verification link resent! Please check your inbox.</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendStatus === "loading"}
                          className="text-xs font-bold underline hover:text-[#f0f4fa] transition disabled:opacity-50"
                        >
                          {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Email or Username</label>
                <input
                  type="text"
                  placeholder="Email address or username"
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
                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-xs font-medium text-[#14b8a6] hover:underline transition">
                    Forgot email or password?
                  </Link>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token: string) => setCaptchaToken(token)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full py-2.5"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

          </div>

          <p className="mt-5 text-center text-sm text-[rgba(240,244,250,0.4)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#14b8a6] hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
