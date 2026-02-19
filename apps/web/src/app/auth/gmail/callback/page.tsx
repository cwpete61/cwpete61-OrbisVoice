"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GmailCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing Gmail authorization...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus(`Gmail authorization failed: ${error}`);
      setTimeout(() => {
        window.close() || router.push("/settings");
      }, 2000);
      return;
    }

    if (!code) {
      setStatus("Missing authorization code.");
      setTimeout(() => {
        window.close() || router.push("/settings");
      }, 2000);
      return;
    }

    const completeEmailConnect = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/gmail/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          const data = await res.json();
          setStatus(`✓ Gmail connected successfully! Email: ${data.data?.gmailEmail || ""}`);
          
          // Close popup or redirect back to settings
          setTimeout(() => {
            window.close() || router.push("/settings?tab=gmail");
          }, 1500);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setStatus(`Connection failed: ${errorData.message || "Unknown error"}`);
          
          setTimeout(() => {
            window.close() || router.push("/settings");
          }, 2000);
        }
      } catch (err) {
        setStatus("Gmail connection failed. Please try again.");
        setTimeout(() => {
          window.close() || router.push("/settings");
        }, 2000);
      }
    };

    completeEmailConnect();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center px-4">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8 text-center max-w-md">
        <h1 className="text-lg font-semibold text-[#f0f4fa] mb-2">Gmail Authorization</h1>
        <p className="text-sm text-[rgba(240,244,250,0.5)]">{status}</p>
        <p className="text-xs text-[rgba(240,244,250,0.35)] mt-4">This window will close automatically...</p>
      </div>
    </div>
  );
}
