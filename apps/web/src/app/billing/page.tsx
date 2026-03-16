"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE, apiFetch } from "@/lib/api";

import PricingTable, { AllTierName, TIER_CONFIGS } from "../components/PricingTable";
import UsageChart from "../components/UsageChart";

interface SubscriptionData {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionEnds: string | null;
  usageLimit: number;
  usageCount: number;
  usageResetAt: string;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usagePercent: number;
  shouldReset: boolean;
  creditBalance: number;
  bonusCredits: number;
  tierInfo: {
    conversations: number;
    price: number;
  };
}

function BillingContent() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [availableTiers, setAvailableTiers] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<AllTierName | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // Extract token from URL if present (from OAuth callback)
  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        syncBilling().then(() => {
          fetchSubscription();
          fetchAvailableTiers();
          fetchPackages();
        });
      } else {
        fetchSubscription();
        fetchAvailableTiers();
        fetchPackages();
      }
    }
  }, [tokenLoaded]);

  const fetchData = () => {
    fetchSubscription();
    fetchAvailableTiers();
    fetchPackages();
  };

  const syncBilling = async () => {
    try {
      setSyncing(true);
      setSyncMessage("Synchronizing your subscription with Stripe...");
      const { res, data } = await apiFetch("/billing/sync", {
        method: "POST",
      });

      if (res.ok) {
        setSyncMessage(data.message || "Subscription updated successfully.");
        await fetchSubscription(); 
      } else {
        console.error("Sync failed with status:", res.status, data);
        setSyncMessage("Sync failed. Please contact support.");
      }
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncMessage("Cannot connect to sync service.");
    } finally {
      setSyncing(false);
      // Keep message for a few seconds
      setTimeout(() => setSyncMessage(""), 5000);
    }
  };

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/billing/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setSubscription(data.data);
        setBillingEmail(data.data.billingEmail || "");
      } else {
        setError(data.message || "Failed to load subscription data");
      }
    } catch (err: any) {
      setError("Unable to connect to billing service");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTiers = async () => {
    try {
      const res = await fetch(`${API_BASE}/billing/tiers`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTiers(data.data);
      }
    } catch (err: any) {
      console.error("Failed to load tiers:", err);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/packages`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load packages:", err);
    }
  };

  const handleUpgrade = async (tier: AllTierName) => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data);
        setError(data.error || "Failed to start checkout");
        setSelectedTier(null);
      }
    } catch (err: any) {
      console.error("Checkout exception:", err);
      setError(err.message);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/billing/subscription`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchSubscription();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to cancel subscription");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBuyPackage = async (pkg: any) => {
    if (!confirm(`Are you sure you want to purchase ${pkg.name} for $${pkg.price}?`)) return;

    setPurchasingPackage(pkg.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/billing/purchase-package`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (res.ok) {
        alert(`Successfully purchased ${pkg.name}. Credits have been added to your account.`);
        fetchSubscription(); // Refresh to show new credit balance
      } else {
        const data = await res.json();
        setError(data.error || "Failed to purchase package");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasingPackage(null);
    }
  };

  if (loading) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="px-8 py-8">
          <div className="text-center py-12">
            <p className="text-[rgba(240,244,250,0.5)]">Loading billing information...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="px-8 py-8">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-red-400 font-medium mb-4">{error}</p>
            <button
              onClick={() => { setError(""); setLoading(true); fetchData(); }}
              className="text-xs font-bold uppercase tracking-widest text-[#14b8a6] hover:text-[#0ea5e9] transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!subscription || !availableTiers) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="px-8 py-8">
          <div className="text-center py-12">
            <p className="text-[rgba(240,244,250,0.5)]">No subscription data found.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const currentTier: AllTierName = subscription.subscriptionTier as AllTierName;
  const usagePercent = subscription.usagePercent;
  const isOverLimit = usagePercent >= 100 && (subscription.creditBalance + (subscription.bonusCredits || 0)) <= 0;

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-8 py-8">
        {/* Page header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-black text-white tracking-tight">Billing & Infrastructure</h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor your revenue operations and scale your AI workforce
          </p>
        </div>

        {/* Sync Success Message / Banner */}
        {syncMessage && (
          <div className="mb-8 p-4 rounded-xl bg-[#14b8a6]/10 border border-[#14b8a6]/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="h-8 w-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
              {syncing ? (
                <div className="h-4 w-4 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <p className="text-sm font-bold text-[#14b8a6]">{syncMessage}</p>
          </div>
        )}

        {/* Usage Analytics Trend */}
        <section className="mb-12">
          <UsageChart />
        </section>

        {/* Current Subscription */}
        <section className="rounded-3xl border border-white/[0.07] bg-[#0c111d] p-8 mb-12 shadow-2xl relative overflow-hidden">
           {/* Abstract Gradient Background for Section */}
           <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#14b8a6]/10 to-transparent pointer-events-none" />

          <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#14b8a6]" />
            Subscription Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Active Infrastructure</p>
              <p className="text-3xl font-black text-white capitalize">
                {currentTier}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">Standard Operations</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Lifecycle Status</p>
              <p className="text-xl font-bold text-white capitalize">
                {subscription.subscriptionStatus || "Active"}
              </p>
              {subscription.subscriptionEnds && (
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Next snapshot: {new Date(subscription.subscriptionEnds).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Usage Utilization</p>
                {(subscription.creditBalance > 0 || subscription.bonusCredits > 0) && (
                  <span className="bg-[#14b8a6]/20 text-[#14b8a6] text-[9px] px-2 py-0.5 rounded-full border border-[#14b8a6]/30 font-black">
                     +{subscription.creditBalance + (subscription.bonusCredits || 0)} RESERVE
                  </span>
                )}
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-400">Monthly Conversations</span>
                <span className={isOverLimit ? "text-red-400 font-black" : "font-black text-white"}>
                  {subscription.usageCount} / {subscription.usageLimit}
                </span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-1000 ${isOverLimit ? "bg-red-500" : "bg-[#14b8a6]"
                    }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-600 font-medium">
                Cycle resets on {new Date(subscription.usageResetAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isOverLimit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mt-8 flex items-center gap-4 animate-pulse">
               <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 shrink-0">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <div>
                  <p className="text-red-400 font-bold text-sm">Critical: Infrastructure Limit Exceeded</p>
                  <p className="text-xs text-red-400/70 mt-0.5">Automated operations have reached the monthly ceiling. Please scale your plan below.</p>
               </div>
            </div>
          )}

          {/* Manage Billing (Stripe Portal) */}
          <div className="mt-10 pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-sm">Revenue Management Portal</h3>
              <p className="text-xs text-gray-500 mt-1">Manage payment methods, jurisdictional details, and invoice history securely via Stripe.</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/billing/portal`, {
                    method: 'POST',
                    headers: { 
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ returnUrl: window.location.href })
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else alert(data.error || 'Failed to open billing portal');
                } catch (err) {
                  alert('Connection error');
                }
              }}
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition bg-white/5 text-white hover:bg-white/10 border border-white/10 flex items-center gap-3 whitespace-nowrap shadow-xl"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Secure Management Portal
            </button>
          </div>
        </section>

        {/* Available Plans */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
               <h2 className="text-2xl font-black text-white tracking-tight">Infrastructure Tiers</h2>
               <p className="text-sm text-gray-500 mt-2">Choose the operation capacity that matches your revenue goals.</p>
            </div>
          </div>
          
          <PricingTable 
            currentTier={currentTier}
            availableTiers={availableTiers}
            onSelect={(tier) => setSelectedTier(tier)}
            onCancel={handleCancel}
            subscriptionStatus={subscription.subscriptionStatus}
          />
        </section>

        {/* Conversation Packages */}
        {packages.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xl font-bold text-white mb-2">Operation Reserves</h2>
            <p className="text-sm text-gray-500 mb-8">Purchase one-time conversation packages for extra bandwidth with no expiration.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-white/5 bg-[#0c111d] p-5 transition-all hover:border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-10 h-10 bg-[#14b8a6]/5 rounded-bl-2xl" />
                  <h3 className="text-sm font-bold text-white group-hover:text-[#14b8a6] transition-colors">{pkg.name}</h3>
                  <p className="text-[8px] text-gray-500 mt-0.5 uppercase font-black tracking-widest">Reserve Package</p>
                  <div className="my-4">
                    <p className="text-2xl font-black text-white">${pkg.price}</p>
                  </div>
                  <div className="mb-4 pb-4 border-b border-white/5">
                    <p className="text-[11px] font-bold text-gray-300">+{pkg.credits.toLocaleString()} Convs</p>
                  </div>
                  <button
                    onClick={() => handleBuyPackage(pkg)}
                    disabled={purchasingPackage === pkg.id}
                    className="px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition bg-white/5 text-white hover:bg-[#14b8a6] hover:border-transparent border border-white/10 w-full disabled:opacity-50"
                  >
                    {purchasingPackage === pkg.id ? "..." : "Acquire"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upgrade Modal */}
        {selectedTier && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-[#f0f4fa] mb-2">
                {TIER_CONFIGS[selectedTier].name}
              </h3>
              <p className="text-sm text-[rgba(240,244,250,0.5)] mb-6">
                {TIER_CONFIGS[selectedTier].description}
              </p>
              <div className="bg-[#080c16] rounded-xl p-4 mb-6 border border-white/[0.05]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[rgba(240,244,250,0.5)]">
                    {selectedTier === "ltd" ? "One-Time Payment" : "Monthly Price"}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: TIER_CONFIGS[selectedTier].accent }}>
                    ${availableTiers[selectedTier]?.price || 0}
                  </span>
                </div>
                {selectedTier === "ltd" && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[rgba(240,244,250,0.5)]">+ Token Costs</span>
                    <span className="text-sm font-semibold text-[#f0f4fa]">$20/mo</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgba(240,244,250,0.5)]">Conversations</span>
                  <span className="text-sm font-semibold text-[#f0f4fa]">
                    {availableTiers[selectedTier]?.conversations.toLocaleString() || 0}/month
                  </span>
                </div>
              </div>
              <p className="text-xs text-[rgba(240,244,250,0.4)] mb-4">
                You&apos;ll be redirected to Stripe&apos;s secure checkout to complete your purchase.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpgrade(selectedTier)}
                  className="btn-primary flex-1"
                >
                  Proceed to Checkout →
                </button>
                <button
                  onClick={() => setSelectedTier(null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition bg-white/[0.04] text-[#f0f4fa] hover:bg-white/[0.08] border border-white/[0.07] flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}