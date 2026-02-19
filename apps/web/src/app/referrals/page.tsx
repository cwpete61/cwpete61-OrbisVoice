"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";

interface ReferralData {
  code: string;
  shareUrl: string;
}

interface ReferralStats {
  totalReferred: number;
  accepted: number;
  completed: number;
  totalRewards: number;
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      fetchReferralData();
    }
  }, [tokenLoaded]);

  async function fetchReferralData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [codeRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/referral-code`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/referral-stats`, { headers }),
      ]);

      if (!codeRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch referral data");
      }

      const codeData = await codeRes.json();
      const statsData = await statsRes.json();

      setReferralData(codeData.data);
      setStats(statsData.data);
    } catch (err) {
      setError("Failed to load referral data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-8 py-8">

        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f4fa]">Referral Program</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">Earn rewards by inviting others to MyOrbisVoice</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-[rgba(240,244,250,0.4)]">Loading referral data…</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Referral code card */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Your Referral Code</h2>
                {referralData ? (
                  <>
                    <div className="mb-5 rounded-xl border border-white/[0.07] bg-[#05080f] p-5 text-center font-mono">
                      <p className="text-2xl font-bold text-[#14b8a6]">{referralData.code}</p>
                      <p className="mt-1 text-xs text-[rgba(240,244,250,0.35)]">Share this code with friends</p>
                    </div>
                    <div className="flex flex-col gap-3">
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
                <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Your Stats</h2>
                {stats ? (
                  <div className="space-y-3">
                    {[
                      { label: "Total Referred", value: stats.totalReferred, color: "#14b8a6" },
                      { label: "Accepted", value: stats.accepted, color: "#f0f4fa" },
                      { label: "Completed", value: stats.completed, color: "#a78bfa" },
                      { label: "Total Rewards", value: `$${stats.totalRewards}`, color: "#f97316" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#05080f] px-4 py-3">
                        <span className="text-sm text-[rgba(240,244,250,0.5)]">{s.label}</span>
                        <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
              <h2 className="mb-6 text-sm font-semibold text-[#f0f4fa]">How It Works</h2>
              <div className="space-y-5">
                {[
                  { n: "01", title: "Share Your Code", body: "Send your unique referral code to friends and colleagues" },
                  { n: "02", title: "They Sign Up", body: "When they join MyOrbisVoice with your code, they get $10 credit" },
                  { n: "03", title: "You Earn", body: "You receive $5 for every successful referral" },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#14b8a6]/10 text-xs font-bold text-[#14b8a6]">{step.n}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#f0f4fa]">{step.title}</p>
                      <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.45)]">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
