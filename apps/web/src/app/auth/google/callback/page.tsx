"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing Google sign-in...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
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

    processedRef.current = true;

    const completeLogin = async () => {
      try {
        let endpoint = "/auth/google/callback"; // Default to sign-in
        let body = { code };
        let method = "POST";

        // Check for state to determine if this is Gmail or Calendar linking
        const state = searchParams.get("state");
        if (state) {
          try {
            const decodedState = JSON.parse(atob(state));
            if (decodedState.type === 'gmail') {
              endpoint = "/auth/google/gmail/callback";
              body = { code, state } as any; // Pass state back for verification
              setStatus("Linking Gmail...");
            } else if (decodedState.type === 'calendar') {
              endpoint = "/auth/google/calendar/callback";
              body = { code, state } as any;
              setStatus("Linking Calendar...");
            }
          } catch (e) {
            console.error("Failed to parse state", e);
          }
        }

        const token = localStorage.getItem("token"); // Needed for linking
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          method,
          headers,
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (res.ok) {
          if (endpoint === "/auth/google/callback") {
            // Sign-in flow
            localStorage.setItem("token", data.data.token);
            router.push("/dashboard");
          } else {
            // Linking flow
            router.push("/settings"); // Redirect back to settings
          }
        } else {
          setStatus(data.message || "Google sign-in/linking failed.");
        }
      } catch (err) {
        setStatus("Google authentication failed.");
        console.error(err);
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

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  );
}
