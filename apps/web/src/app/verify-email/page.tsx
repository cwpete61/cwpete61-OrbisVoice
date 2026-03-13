"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import { apiFetch } from "../../lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setTimeout(() => {
        setStatus("error");
        setMessage("Invalid or missing verification token.");
      }, 0);
      return;
    }

    const verify = async () => {
      try {
        const { res, data } = await apiFetch("/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: searchParams.get("email") }),
        });

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#14b8a6]/20 text-[#14b8a6]">
          {status === "loading" && (
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {status === "success" && (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === "error" && (
            <svg className="h-6 w-6 text-[#f97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[#f0f4fa]">
          {status === "loading" && "Verifying email..."}
          {status === "success" && "Verification Complete"}
          {status === "error" && "Verification Failed"}
        </h1>
        <p className="mt-2 text-[rgba(240,244,250,0.6)]">{message}</p>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8 text-center">
        {status === "success" ? (
          <Link href="/login" className="btn-primary block w-full py-2.5">
            Continue to Login
          </Link>
        ) : status === "error" ? (
          <Link href="/signup" className="text-[#14b8a6] hover:underline transition text-sm">
            Back to Sign Up
          </Link>
        ) : (
          <p className="text-sm text-[rgba(240,244,250,0.4)]">Please wait while we confirm your email address...</p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#05080f]">
      <PublicNav />
      <div className="flex flex-grow items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#14b8a6]/20 text-[#14b8a6]">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Loading...</h1>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
