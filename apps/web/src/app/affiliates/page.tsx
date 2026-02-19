"use client";

import { useEffect, useState } from "react";
import AffiliateShell from "../components/AffiliateShell";
import Link from "next/link";

interface ApiResponse {
  ok: boolean;
  message?: string;
  data?: any;
}

export default function AffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAffiliateStatus();
  }, []);

  const fetchAffiliateStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAffiliate(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch affiliate status:", err);
      setError("Failed to load partner data");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <AffiliateShell>
        <div className="flex h-screen items-center justify-center">
          <p className="text-sm text-[rgba(240,244,250,0.4)]">Loading partner data…</p>
        </div>
      </AffiliateShell>
    );
  }

  if (!affiliate || !affiliate.id) {
    return (
      <AffiliateShell>
        <div className="mx-auto max-w-6xl px-8 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v.01M12 9v4m-7.9 6h15.8c1.1 0 1.9-.9 1.9-2V7c0-1.1-.9-2-1.9-2H4.1C3 5 2.1 5.9 2.1 7v10c0 1.1.9 2 1.9 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#f0f4fa]">Access Restricted</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.4)]">This area is for authorized partners only.</p>
          <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition">
            Return to Dashboard
          </Link>
        </div>
      </AffiliateShell>
    );
  }

  return (
    <AffiliateShell>
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#f0f4fa]">Partner Dashboard</h1>
          <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Manage your referrals and view earnings performance.</p>
        </div>

        {affiliate.status === "PENDING" ? (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
            <h2 className="text-lg font-semibold text-yellow-500">Application Under Review</h2>
            <p className="mt-2 text-sm text-[rgba(240,244,250,0.5)]">
              Your partner account is currently being reviewed. We'll notify you once it's fully active.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-xs font-medium text-yellow-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
              Pending Activation
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Affiliate Link Card */}
            <div className="rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#f0f4fa]">Your Professional Referral Link</h3>
                  <p className="mt-1 text-xs text-[rgba(240,244,250,0.5)]">Share this link to track your professional referrals</p>
                </div>
                <div className="flex flex-1 max-w-xl items-center gap-3 rounded-xl border border-white/[0.08] bg-[#05080f] px-4 py-3">
                  <span className="flex-1 truncate font-mono text-sm text-[#14b8a6]">
                    {typeof window !== 'undefined' ? `${window.location.origin}/a/${affiliate.slug}` : `/a/${affiliate.slug}`}
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/a/${affiliate.slug}`)}
                    className="rounded-lg bg-[#14b8a6]/10 px-3 py-1.5 text-xs font-medium text-[#14b8a6] hover:bg-[#14b8a6]/20 transition"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Referrals", value: affiliate.totalReferrals, icon: "👥" },
                { label: "Conversions", value: affiliate.convertedReferrals, icon: "🎯" },
                { label: "Unpaid Balance", value: `$${affiliate.balance.toFixed(2)}`, icon: "💰" },
                { label: "Total Earned", value: `$${affiliate.totalEarnings.toFixed(2)}`, icon: "📈" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 transition hover:border-white/[0.15]">
                  <div className="mb-3 text-2xl">{stat.icon}</div>
                  <div className="text-2xl font-bold text-[#f0f4fa]">{stat.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.35)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Referral Table */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c111d]">
              <div className="border-b border-white/[0.07] px-6 py-4">
                <h3 className="text-sm font-semibold text-[#f0f4fa]">Conversion History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111827] text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">
                    <tr>
                      <th className="px-6 py-4">ID / Referee</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Commission</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {affiliate.referrals?.length > 0 ? (
                      affiliate.referrals.map((ref: any) => (
                        <tr key={ref.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-6 py-4 font-mono text-xs text-[#f0f4fa]">
                            {ref.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${ref.status === "CONVERTED"
                              ? "bg-green-500/10 text-green-400"
                              : ref.status === "PENDING"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-red-500/10 text-red-400"
                              }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#f0f4fa]">
                            ${ref.commissionAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-[rgba(240,244,250,0.4)]">
                            {new Date(ref.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[rgba(240,244,250,0.3)]">
                          No professional referrals recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AffiliateShell>
  );
}
