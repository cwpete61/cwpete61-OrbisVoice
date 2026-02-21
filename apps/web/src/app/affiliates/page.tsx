"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";

function AffiliateDashboardContent() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, [tokenLoaded]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [profileRes, statsRes, stripeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/stripe/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
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
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.data);
      }

      if (stripeRes.ok) {
        const stData = await stripeRes.json();
        setStripeStatus(stData.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Partner Portal.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
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
      alert("Network error.");
    } finally {
      setStripeLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="flex h-screen items-center justify-center">
          <p className="text-sm text-[rgba(240,244,250,0.4)]">Loading Partner Portal...</p>
        </div>
      </DashboardShell>
    );
  }

  if (profile && !profile.isAffiliate && !profile.isAdmin) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="flex h-screen flex-col items-center justify-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14b8a6]/10 text-[#14b8a6]">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#f0f4fa]">Access Restricted</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.4)]">
            This dashboard is exclusively for approved Partners.
          </p>
          <a href="/partner/apply" className="mt-6 rounded-lg bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488]">
            Apply for Partner Program
          </a>
        </div>
      </DashboardShell>
    );
  }

  // Handle admins viewing the page (they can see layout but have their own admin dash)
  if (profile?.isAdmin && !stats?.isAffiliate) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="flex h-screen flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-[#f0f4fa]">Admin Redirect</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.4)]">
            Use the Referral Agents tab to manage partners.
          </p>
          <a href="/referral-agents" className="mt-6 rounded-lg bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488]">
            Go to Partner Management
          </a>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Partner Portal</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">
              Manage your links, track your stats, and setup your payouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stripeStatus && stripeStatus.payoutsEnabled ? (
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                Payouts Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500"></span>
                Payouts Inactive
              </span>
            )}
          </div>
        </div>

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
            <div className="grid gap-6 md:grid-cols-4">
              <div className="rounded-xl border border-white/[0.05] bg-[#0c111d] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.5)]">Total Clicks</p>
                <p className="mt-2 text-3xl font-bold text-[#f0f4fa]">{stats?.clicks || 0}</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-[#0c111d] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.5)]">Conversions</p>
                <p className="mt-2 text-3xl font-bold text-[#f0f4fa]">{stats?.sales || 0}</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-[#0c111d] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.5)]">Revenue Driven</p>
                <p className="mt-2 text-3xl font-bold text-[#f0f4fa]">${(stats?.revenue || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-[#0c111d] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.5)]">Your Balance</p>
                <p className="mt-2 text-3xl font-bold text-[#14b8a6]">${(stats?.balance || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
              <h2 className="text-sm font-semibold text-[#f0f4fa] mb-4">Your Partner Link</h2>
              <div className="flex gap-2">
                <input
                  readOnly
                  type="text"
                  value={stats?.shareUrl || ""}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-3 text-sm text-[#f0f4fa] outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(stats?.shareUrl || "");
                    alert("Link copied!");
                  }}
                  className="rounded-lg bg-white/[0.05] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.1] transition"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* Stripe Connect Section */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-[#f0f4fa]">Stripe Connect</h2>
              <p className="mt-1 text-sm text-[rgba(240,244,250,0.6)] mb-6">
                Link your bank account via Stripe to receive automated payouts directly to your account.
              </p>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#111827] p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stripeStatus?.payoutsEnabled ? "bg-green-500/10 text-green-500" : "bg-white/[0.05] text-[#f0f4fa]/30"}`}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f0f4fa]">{stripeStatus?.payoutsEnabled ? "Connected & Active" : "Not Connected"}</h3>
                    <p className="text-xs text-[rgba(240,244,250,0.5)]">
                      {stripeStatus?.payoutsEnabled ? "Ready to receive automated payouts." : "Action required to verify your identity and link a bank."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="rounded-lg bg-[#635BFF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#524ae3] disabled:opacity-50"
                >
                  {stripeLoading ? "Loading..." : (stripeStatus?.payoutsEnabled ? "Manage Stripe Account" : "Connect with Stripe")}
                </button>
              </div>
            </div>

            {/* Manual Banking / Tax Info */}
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

export default function AffiliatePage() {
  return (
    <Suspense>
      <AffiliateDashboardContent />
    </Suspense>
  );
}
