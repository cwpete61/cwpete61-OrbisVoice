"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      alert("Error: " + String(err));
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
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Create your account</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Deploy your first AI voice agent free</p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
            <form onSubmit={handleSignup} className="space-y-4">
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
                <input
                  type="password"
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
