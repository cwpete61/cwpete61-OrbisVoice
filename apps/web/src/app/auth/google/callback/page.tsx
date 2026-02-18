"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing Google sign-in...");

  useEffect(() => {
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    if (error) {
      setStatus("Google sign-in failed. Please try again.");
      return;
    }

    if (!code) {
      setStatus("Missing authorization code.");
      return;
    }

    const completeLogin = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.data.token);
          router.push("/dashboard");
        } else {
          setStatus(data.message || "Google sign-in failed.");
        }
      } catch (err) {
        setStatus("Google sign-in failed.");
      }
    };

    completeLogin();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center px-4">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8 text-center">
        <h1 className="text-lg font-semibold text-[#f0f4fa]">Google Authentication</h1>
        <p className="mt-2 text-sm text-[rgba(240,244,250,0.5)]">{status}</p>
      </div>
    </div>
  );
}
