"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import { apiFetch } from "../../lib/api";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth as firebaseAuth } from "../../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { res, data } = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        localStorage.setItem("token", (data.data as any).token);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      if (!firebaseAuth) {
        throw new Error("Firebase is not yet configured. Please add your API key to .env.local");
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();

      // Send to our backend to get app-specific JWT
      const { res, data } = await apiFetch("/auth/firebase-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      if (res.ok) {
        localStorage.setItem("token", (data.data as any).token);
        router.push("/dashboard");
      } else {
        setError(data.message || "Sync with backend failed");
      }
    } catch (err) {
      console.error("Google login error:", err);
      // Don't show Firebase-internal errors directly to users if we can help it
      const msg = err instanceof Error ? err.message : "Google login failed";
      setError(msg.includes("auth/invalid-api-key") ? "Firebase configuration is incorrect (Invalid API Key)." : msg);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Welcome back</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Sign in to your MyOrbisVoice account</p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#f97316]">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.02] px-4 py-2.5 text-sm text-[rgba(240,244,250,0.7)] hover:border-white/[0.2] hover:bg-white/[0.05] transition disabled:opacity-50"
              >
                <span className="text-lg">G</span>
                {loading ? "Processing..." : "Sign in with Google"}
              </button>
              <div className="flex items-center gap-3 text-xs text-[rgba(240,244,250,0.35)]">
                <div className="h-px flex-1 bg-white/[0.06]" />
                or
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#14b8a6]">Gmail or Username</label>
                <input
                  type="text"
                  placeholder="Gmail address or username"
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
