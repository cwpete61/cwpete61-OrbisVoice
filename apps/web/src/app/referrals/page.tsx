"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

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
  const [profile, setProfile] = useState<any>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Settings form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    phone: "",
    address: "",
    unit: "",
    city: "",
    state: "",
    zip: "",
    tinSsn: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      fetchData();
      fetchStripeStatus();
    }
  }, [tokenLoaded]);

  const fetchStripeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/affiliates/stripe/status`, {
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
      const res = await fetch(`${API_BASE}/affiliates/stripe/onboard`, {
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

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, codeRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, { headers }),
        fetch(`${API_BASE}/users/me/referral-code`, { headers }),
        fetch(`${API_BASE}/users/me/referral-stats`, { headers }),
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

      const pData = await profileRes.json();
      const codeData = await codeRes.json();
      const statsData = await statsRes.json();

      setProfile(pData.data);
      setFormData({
        firstName: pData.data.firstName || "",
        lastName: pData.data.lastName || "",
        businessName: pData.data.businessName || "",
        phone: pData.data.phone || "",
        address: pData.data.address || "",
        unit: pData.data.unit || "",
        city: pData.data.city || "",
        state: pData.data.state || "",
        zip: pData.data.zip || "",
        tinSsn: pData.data.tinSsn || "",
      });

      setReferralData(codeData.data);
      setStats(statsData.data);
    } catch (err: any) {
      setError(err.message || "Failed to load referral data");
      console.error("Referral fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update tax information.");

      setSaveMessage("Partner information updated successfully.");
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

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

        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Referral Program</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">
              Earn rewards by inviting others to MyOrbisVoice
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex space-x-1 border-b border-white/[0.05] pb-px">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "overview"
              ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
              : "border-b-2 border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
              }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "settings"
              ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
              : "border-b-2 border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
              }`}
          >
            Banking & Tax Settings
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8">
            {referralData && (
              <div className="rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-6 backdrop-blur-sm">
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                        className="rounded-lg bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488]"
                      >
                        {copied ? "✓ Copied" : "Copy Code"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[rgba(240,244,250,0.4)]">No referral code found.</p>
                )}
              </div>

              <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Performance Metrics</h2>
                {stats ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: "Referrals", value: stats.totalReferred, color: "#14b8a6" },
                      { label: "Accepted", value: stats.accepted, color: "#f0f4fa" },
                      { label: "Completed", value: stats.completed, color: "#a78bfa" },
                      { label: "Total Earnings", value: `$${stats.totalRewards.toFixed(2)}`, color: "#f97316" },
                      { label: "Available", value: `$${stats.availableRewards.toFixed(2)}`, color: "#10b981" },
                      { label: "Pending", value: `$${stats.pendingRewards.toFixed(2)}`, color: "#f59e0b" },
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

            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
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
                <p className="text-xs text-[rgba(240,244,250,0.4)]">You haven&apos;t referred anyone yet. Start sharing your link!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-[#f0f4fa]">Stripe Connect</h2>
              <p className="mt-1 text-sm text-[rgba(240,244,250,0.6)] mb-6">
                Link your bank account via Stripe to receive automated payouts directly to your account.
              </p>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#111827] p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stripeStatus?.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-white/[0.05] text-[#f0f4fa]/30"}`}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f0f4fa]">{stripeStatus?.status === 'active' ? "Connected & Active" : "Not Connected"}</h3>
                    <p className="text-xs text-[rgba(240,244,250,0.5)]">
                      {stripeStatus?.status === 'active' ? "Ready to receive automated payouts." : "Action required to verify your identity and link a bank."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="rounded-lg bg-[#635BFF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#524ae3] disabled:opacity-50"
                >
                  {stripeLoading ? "Loading..." : (stripeStatus?.status === 'active' ? "Manage Stripe Account" : "Connect with Stripe")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-[#f0f4fa]">Tax & Information Parameters</h2>
              <p className="mt-1 text-sm text-[rgba(240,244,250,0.6)] mb-6">
                Please maintain your accurate personal and corporate intelligence here in order to comply with domestic tax treaties and 1099 distributions.
              </p>

              {saveError && (
                <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {saveError}
                </div>
              )}
              {saveMessage && (
                <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                  {saveMessage}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">First Name</label>
                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Last Name</label>
                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Business Name (Optional)</label>
                    <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Phone / Cell</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-6 sm:col-span-4 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Street Address</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                  <div className="col-span-6 sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Unit / Apt</label>
                    <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-6 sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">State</label>
                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Zip Code</label>
                    <input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">TIN OR SSN</label>
                  <input type="text" value={formData.tinSsn} onChange={(e) => setFormData({ ...formData, tinSsn: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-[#14b8a6] outline-none" />
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={savingSettings} className="rounded-lg bg-[#14b8a6] px-6 py-2.5 text-sm font-semibold text-[#05080f] transition hover:bg-[#0d9488] disabled:opacity-50">
                    {savingSettings ? "Saving Settings..." : "Save Information"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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