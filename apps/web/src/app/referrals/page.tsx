"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import Link from "next/link";

interface ReferralData {
  code: string;
  shareUrl: string;
}

interface ReferralStats {
  totalReferred: number;
  accepted: number;
  completed: number;
  totalRewards: number;
  availableRewards: number;
  pendingRewards: number;
  referrals: any[];
}

function ReferralsContent() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      fetchReferralData();
      fetchStripeStatus();
    }
  }, [tokenLoaded]);

  const fetchStripeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/stripe/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStripeStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch Stripe status:", err);
    }
  };

  const handleStripeOnboard = async () => {
    setStripeLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/stripe/onboard`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        alert(data.message || "Failed to generate onboarding link.");
      }
    } catch (err) {
      console.error("Failed to start Stripe onboarding:", err);
      alert("Network error.");
    } finally {
      setStripeLoading(false);
    }
  };

  async function fetchReferralData() {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [codeRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/referral-code`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/referral-stats`, { headers }),
      ]);

      if (codeRes.status === 401 || statsRes.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!codeRes.ok || !statsRes.ok) {
        const codeError = !codeRes.ok ? await codeRes.json() : null;
        const statsError = !statsRes.ok ? await statsRes.json() : null;
        const errorMsg = codeError?.message || statsError?.message || "Failed to fetch referral data";
        throw new Error(errorMsg);
      }

      const codeData = await codeRes.json();
      const statsData = await statsRes.json();

      setReferralData(codeData.data);
      setStats(statsData.data);
    } catch (err: any) {
      setError(err.message || "Failed to load referral data");
      console.error("Referral fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="flex h-screen items-center justify-center">
          <p className="text-sm text-[rgba(240,244,250,0.4)]">Loading referral data…</p>
        </div>
      </DashboardShell>
    );
  }

  // Cross-check: If user is an affiliate, they shouldn't use the regular referral system
  if (stats && (stats as any).isAffiliate) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="mx-auto max-w-2xl px-8 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14b8a6]/10 text-[#14b8a6]">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#f0f4fa]">Professional Partner Detected</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.4)]">
            As a professional affiliate, please use your dedicated Partner Portal to manage links and view earnings.
          </p>
          <Link href="/affiliates" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#14b8a6] px-6 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition">
            Go to Partner Portal
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-8 py-8">

        {/* URL Params feedback */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get("stripe_return") === "true" && (
          <div className="mb-6 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-3 text-sm text-[#10b981]">
            Welcome back from Stripe! Your account status is updating.
          </div>
        )}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get("stripe_refresh") === "true" && (
          <div className="mb-6 rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 px-4 py-3 text-sm text-[#f97316]">
            Your Stripe connection session expired. Please try again.
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#f0f4fa]">Referral Program</h1>
            <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">Earn rewards by inviting others to MyOrbisVoice</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {referralData && (
          <div className="mb-6 rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-[#f0f4fa]">Your Custom Referral Link</h2>
                <p className="mt-1 text-xs text-[rgba(240,244,250,0.5)]">Share this link directly with your network</p>
              </div>
              <div className="flex flex-1 max-w-2xl items-center gap-2 rounded-xl border border-white/[0.08] bg-[#05080f] px-4 py-3">
                <span className="flex-1 truncate font-mono text-sm text-[#14b8a6]">
                  {referralData.shareUrl}
                </span>
                <button
                  onClick={() => copyToClipboard(referralData.shareUrl)}
                  className="rounded-lg bg-[#14b8a6]/10 px-3 py-1.5 text-xs font-medium text-[#14b8a6] hover:bg-[#14b8a6]/20 transition"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Payout Method Card */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 text-center flex flex-col justify-center">
            <h2 className="mb-5 text-left text-sm font-semibold text-[#f0f4fa]">Payout Method</h2>

            {stripeStatus?.status === 'active' ? (
              <div className="flex items-center gap-3 text-sm text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 p-4 rounded-xl text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/20">✓</div>
                <div>
                  <p className="font-semibold">Stripe Connected</p>
                  <p className="text-xs text-[rgba(16,185,129,0.7)]">ID: {stripeStatus.accountId}</p>
                </div>
              </div>
            ) : stripeStatus?.status === 'pending' ? (
              <div className="flex flex-col gap-4 bg-[#f97316]/5 border border-[#f97316]/20 p-5 rounded-xl text-left">
                <div className="flex items-center gap-3 text-sm text-[#f97316]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f97316]/20 py-2">⏳</div>
                  <div>
                    <p className="font-semibold">Verification Pending</p>
                    <p className="text-xs text-[rgba(249,115,22,0.7)]">Your Stripe account is missing some details.</p>
                  </div>
                </div>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-medium text-white hover:bg-[#ea580c] transition w-fit mx-auto disabled:opacity-50"
                >
                  {stripeLoading ? "Loading..." : "Resume Onboarding"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-5 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01]">
                <div>
                  <p className="text-sm font-medium text-[#f0f4fa]">Set up automatic payouts</p>
                  <p className="text-xs text-[rgba(240,244,250,0.5)] mt-1 max-w-[250px] mx-auto text-center">Connect your bank account securely via Stripe to receive your earnings automatically.</p>
                </div>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="rounded-lg bg-[#635BFF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#5851E5] transition shadow-md shadow-[#635BFF]/20"
                >
                  {stripeLoading ? "Connecting..." : "Connect with Stripe"}
                </button>
              </div>
            )}
            <p className="mt-4 text-[10px] text-[rgba(240,244,250,0.3)]">Payouts are processed securely by Stripe.</p>
          </div>

          {/* Referral code card */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 text-center flex flex-col justify-center">
            <h2 className="mb-5 text-left text-sm font-semibold text-[#f0f4fa]">Your Referral Code</h2>
            {referralData ? (
              <>
                <div className="mb-5 rounded-xl border border-white/[0.07] bg-[#05080f] p-5 font-mono">
                  <p className="text-2xl font-bold text-[#14b8a6]">{referralData.code}</p>
                  <p className="mt-1 text-xs text-[rgba(240,244,250,0.35)]">Share this code with friends</p>
                </div>
                <div className="flex flex-col gap-3 mt-auto">
                  <button
                    onClick={() => copyToClipboard(referralData.code)}
                    className="btn-primary w-full text-sm"
                  >
                    {copied ? "✓ Copied" : "Copy Code"}
                  </button>
                  <button
                    onClick={() => copyToClipboard(referralData.shareUrl)}
                    className="btn-secondary w-full text-sm"
                  >
                    Copy Share Link
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[rgba(240,244,250,0.4)]">No referral code found.</p>
            )}
          </div>

          {/* Stats card */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Performance Metrics</h2>
            {stats ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Referrals", value: stats.totalReferred, color: "#14b8a6" },
                  { label: "Accepted", value: stats.accepted, color: "#f0f4fa" },
                  { label: "Completed", value: stats.completed, color: "#a78bfa" },
                  { label: "Total Earnings", value: `$${stats.totalRewards.toFixed(2)}`, color: "#f97316" },
                  { label: "Available", value: `$${stats.availableRewards.toFixed(2)}`, color: "#10b981" },
                  { label: "Pending (1-Cycle)", value: `$${stats.pendingRewards.toFixed(2)}`, color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col rounded-lg border border-white/[0.05] bg-[#05080f] p-4">
                    <span className="text-xs text-[rgba(240,244,250,0.5)]">{s.label}</span>
                    <span className="mt-1 text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Referrals Table */}
        <div className="mb-8 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Referral History</h2>
          {stats?.referrals && stats.referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.05] text-[rgba(240,244,250,0.4)]">
                    <th className="pb-3 pl-2">Date</th>
                    <th className="pb-3">Referrer</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {stats.referrals.map((ref: any) => (
                    <tr key={ref.id} className="text-[#f0f4fa]">
                      <td className="py-4 pl-2 text-[rgba(240,244,250,0.6)]">{new Date(ref.createdAt).toLocaleDateString()}</td>
                      <td className="py-4">{ref.code}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${ref.status === 'completed'
                          ? 'border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]'
                          : 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]'
                          }`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right font-semibold text-[#14b8a6]">+${ref.rewardAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[rgba(240,244,250,0.4)]">You haven't referred anyone yet. Start sharing your link!</p>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="mb-6 text-sm font-semibold text-[#f0f4fa]">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Share Your Code", body: "Send your unique referral code to friends and colleagues" },
              { n: "02", title: "They Sign Up", body: "When they join MyOrbisVoice with your code, they get immediate access" },
              { n: "03", title: "You Earn", body: "You receive recurring commission for every successful referral" },
            ].map((step) => (
              <div key={step.n} className="flex flex-col gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14b8a6]/10 text-xs font-bold text-[#14b8a6]">{step.n}</span>
                <div>
                  <p className="text-sm font-semibold text-[#f0f4fa]">{step.title}</p>
                  <p className="mt-1 text-xs text-[rgba(240,244,250,0.45)] leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function ReferralsPage() {
  return (
    <Suspense>
      <ReferralsContent />
    </Suspense>
  );
}
