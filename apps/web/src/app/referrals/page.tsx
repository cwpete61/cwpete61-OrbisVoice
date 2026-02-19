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
  referrals: any[];
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
            {/* Referral Link Card */}
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

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Referral code card */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 text-center">
                <h2 className="mb-5 text-left text-sm font-semibold text-[#f0f4fa]">Your Referral Code</h2>
                {referralData ? (
                  <>
                    <div className="mb-5 rounded-xl border border-white/[0.07] bg-[#05080f] p-5 font-mono">
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
                <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Performance Metrics</h2>
                {stats ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Referrals", value: stats.totalReferred, color: "#14b8a6" },
                      { label: "Accepted", value: stats.accepted, color: "#f0f4fa" },
                      { label: "Completed", value: stats.completed, color: "#a78bfa" },
                      { label: "Earnings", value: `$${stats.totalRewards}`, color: "#f97316" },
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
                  { n: "02", title: "They Sign Up", body: "When they join MyOrbisVoice with your code, they get $10 credit" },
                  { n: "03", title: "You Earn", body: "You receive $5 for every successful referral" },
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
          </>
        )}
      </div>
    </DashboardShell>
  );
}
