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
  const [commissionRate, setCommissionRate] = useState<number>(30);

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

      const [profileRes, statsRes, stripeRes, programRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/stripe/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/program-details`),
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

      if (programRes.ok) {
        const prData = await programRes.json();
        setCommissionRate(prData.data?.commissionRate || 30);
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

  // Admins are allowed to view the dashboard layout without being redirected.

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-8 py-10">
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
        <div className="mb-8 flex space-x-1 border-b border-white/[0.05] pb-px overflow-x-auto thin-scrollbar">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "overview"
              ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
              : "border-b-2 border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
              }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "profile"
              ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
              : "border-b-2 border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
              }`}
          >
            Profile & Tax Info
          </button>
          <button
            onClick={() => setActiveTab("banking")}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "banking"
              ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
              : "border-b-2 border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
              }`}
          >
            Banking Setup
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${activeTab === "help"
              ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
              : "border-b-2 border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
              }`}
          >
            Help & Resources
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

        {activeTab === "banking" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
              <h2 className="text-xl font-bold text-[#f0f4fa] mb-2">Automated Payouts via Stripe</h2>
              <p className="text-sm text-[rgba(240,244,250,0.6)] mb-8 max-w-2xl">
                We use Stripe Connect to route your earned commissions directly and securely into your bank account. Connect your account to enable transfers.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-white/[0.05] bg-[#111827] p-6 gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`mt-1 sm:mt-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stripeStatus?.payoutsEnabled ? "bg-green-500/10 text-green-500" : "bg-white/[0.05] text-[#f0f4fa]/30"}`}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#f0f4fa]">
                      {stripeStatus?.payoutsEnabled ? "Stripe Account Active" : "Action Required"}
                    </h3>
                    <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)] max-w-md">
                      {stripeStatus?.payoutsEnabled
                        ? "Your banking details are verified. Commissions will be automatically deposited."
                        : "You must complete Stripe onboarding to receive your affiliate payouts."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="shrink-0 rounded-lg bg-[#635BFF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#524ae3] transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(99,91,255,0.39)]"
                >
                  {stripeLoading ? "Loading Secure Portal..." : (stripeStatus?.payoutsEnabled ? "Manage Banking Info" : "Connect Bank Account")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            {/* Document Upload Area inside Profile */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-[#f0f4fa] mb-2">W-9 / 1099 Form Upload</h2>
              <p className="text-sm text-[rgba(240,244,250,0.6)] mb-6">
                Please securely upload your completed W-9 form for the current tax year.
              </p>

              <div className="mt-2 flex justify-center rounded-xl border border-dashed border-white/[0.1] px-6 py-10 hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/5 transition cursor-pointer group">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-white/20 group-hover:text-[#14b8a6]/50 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <div className="mt-4 flex text-sm leading-6 text-gray-400 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-[#14b8a6] hover:text-[#0d9488]">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500 mt-2">PDF, JPG up to 10MB (Coming soon)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "help" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
              <h2 className="text-xl font-bold text-white mb-6">Partner Program FAQ</h2>

              <div className="space-y-6">
                <div className="border-b border-white/[0.05] pb-6">
                  <h3 className="text-base font-semibold text-white mb-2">How does the {commissionRate}% lifetime commission work?</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Whenever a user clicks your tracking link, we place a multi-month cookie on their device. If they sign up for a paid plan or upgrade from a free tier down the road, {commissionRate}% of their subscription payment is automatically diverted to your account balance. This applies for as long as they remain a paying customer.
                  </p>
                </div>

                <div className="border-b border-white/[0.05] pb-6">
                  <h3 className="text-base font-semibold text-white mb-2">When do payouts happen?</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Payouts are processed automatically via Stripe Connect. Balances are settled on a Net-30 basis to account for standard SaaS refund periods. Once cleared, funds are directly deposited into your linked bank account. Minimum payout threshold is $50.00.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white mb-2">Why do you need my W-9 / TIN?</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    As a legitimate US-based operation, we are required by the IRS to issue 1099-NEC forms for any partner earning $600 or more in a calendar year. Your information is securely stored and exclusively utilized for end-of-year tax compliance.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/[0.02] p-6 lg:p-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Still need help?</h3>
                <p className="text-sm text-[rgba(240,244,250,0.6)]">Our priority partner support team is standing by.</p>
              </div>
              <a href="mailto:support@orbisvoice.com" className="rounded-lg bg-white/[0.05] border border-white/[0.1] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.1] transition-colors">
                Contact Support
              </a>
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
