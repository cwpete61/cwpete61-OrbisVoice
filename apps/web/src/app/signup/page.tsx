"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-gradient-to-br from-orbit-blue via-void to-slate flex items-center justify-center">
      <div className="bg-slate/20 border border-slate rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-signal-cyan mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal-cyan text-orbit-blue py-2 rounded font-semibold hover:bg-aurora-green transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-slate mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-signal-cyan hover:text-aurora-green">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
