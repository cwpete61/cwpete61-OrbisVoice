"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import { apiFetch } from "../../lib/api";
// import { Turnstile } from "@marsidev/react-turnstile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  // const [captchaToken, setCaptchaToken] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { res, data } = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // Removed captchaToken
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

  /* 
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
  */

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
    } catch (_err) {
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
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">
              Sign in to your MyOrbisVoice account
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#f97316]">
                  {error}
                  {unverifiedEmail && (
                    <div className="mt-2 pt-2 border-t border-[#f97316]/20">
                      {resendStatus === "success" ? (
                        <p className="text-xs text-[#14b8a6]">
                          Verification link resent! Please check your inbox.
                        </p>
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
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">
                  Email or Username
                </label>
                <input
                  type="text"
                  placeholder="Email address or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                  required
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">
                  Password
                </label>
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none transition focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30"
                  required
                />
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#14b8a6] hover:underline transition"
                  >
                    Forgot email or password?
                  </Link>
                </div>
              </div>

              {/* Cloudflare Turnstile CAPTCHA - Disabled
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => {
                  setError("Turnstile verification failed. Please try again.");
                  setCaptchaToken("");
                }}
                onExpire={() => setCaptchaToken("")}
                className="mx-auto"
              /> */}

              <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5">
                {loading ? "Signing in…" : "Sign In"}
              </button>

              {/* Google Login - Disabled
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.07]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0c111d] px-2 text-[rgba(240,244,250,0.35)]">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[#f0f4fa] transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button> */}
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-[rgba(240,244,250,0.4)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#14b8a6] hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
