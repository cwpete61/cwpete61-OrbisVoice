"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";

interface TierInfo {
  conversations: number;
  price: number;
}

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
  tierInfo: TierInfo;
}

interface TierLimits {
  free: TierInfo;
  starter: TierInfo;
  professional: TierInfo;
  enterprise: TierInfo;
}

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [availableTiers, setAvailableTiers] = useState<TierLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingEmail, setBillingEmail] = useState("");

  // Extract token from URL if present (from OAuth callback)
  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      fetchSubscription();
      fetchAvailableTiers();
    }
  }, [tokenLoaded]);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setSubscription(data.data);
        setBillingEmail(data.data.billingEmail || "");
      } else {
        setError("Failed to load subscription");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTiers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/tiers`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTiers(data.data);
      }
    } catch (err: any) {
      console.error("Failed to load tiers:", err);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (!billingEmail && tier !== "free") {
      setError("Billing email is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier, billingEmail }),
      });

      if (res.ok) {
        setSelectedTier(null);
        fetchSubscription();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update subscription");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/subscription`, {
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
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
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
            <p className="text-[rgba(240,244,250,0.5)]">Loading billing information...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const currentTier = subscription.subscriptionTier as keyof TierLimits;
  const usagePercent = subscription.usagePercent;
  const isOverLimit = usagePercent >= 100;

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f4fa]">Billing & Usage</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">
            Manage your subscription and monitor usage
          </p>
        </div>

        {/* Current Subscription */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 mb-8">
          <h2 className="text-lg font-bold text-[#f0f4fa] mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-[rgba(240,244,250,0.4)] mb-1">Plan</p>
              <p className="text-2xl font-bold text-[#14b8a6] capitalize">{currentTier}</p>
              <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">
                ${availableTiers[currentTier].price}/month
              </p>
            </div>
            <div>
              <p className="text-sm text-[rgba(240,244,250,0.4)] mb-1">Status</p>
              <p className="text-lg font-semibold text-[#f0f4fa] capitalize">
                {subscription.subscriptionStatus || "Active"}
              </p>
              {subscription.subscriptionEnds && (
                <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">
                  Renews {new Date(subscription.subscriptionEnds).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-[rgba(240,244,250,0.4)] mb-1">Usage</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[rgba(240,244,250,0.5)]">Conversations</span>
                <span className={isOverLimit ? "text-red-500 font-bold" : "text-[#f0f4fa]"}>
                  {subscription.usageCount} / {subscription.usageLimit}
                </span>
              </div>
              <div className="h-3 bg-[#080c16] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isOverLimit ? "bg-red-500" : "bg-[#14b8a6]"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[rgba(240,244,250,0.4)] mt-1">
                Resets on {new Date(subscription.usageResetAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isOverLimit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-6">
              <p className="text-red-500 font-semibold">⚠️ Usage Limit Exceeded</p>
              <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">
                Upgrade your plan to continue creating conversations
              </p>
            </div>
          )}
        </section>

        {/* Available Plans */}
        <section>
          <h2 className="text-lg font-bold text-[#f0f4fa] mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(availableTiers).map(([tier, info]) => {
              const isCurrent = tier === currentTier;
              const isUpgrade = info.price > availableTiers[currentTier].price;

              return (
                <div
                  key={tier}
                  className={`rounded-2xl border bg-[#0c111d] p-6 ${
                    isCurrent ? "border-[#14b8a6]" : "border-white/[0.07]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-[#f0f4fa] capitalize">{tier}</h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs rounded-md bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20">Current</span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-[#14b8a6] mb-2">${info.price}</p>
                  <p className="text-sm text-[rgba(240,244,250,0.4)] mb-4">per month</p>
                  <p className="text-[rgba(240,244,250,0.5)] mb-6">
                    {info.conversations.toLocaleString()} conversations/month
                  </p>
                  {!isCurrent && (
                    <button
                      onClick={() => setSelectedTier(tier)}
                      className={isUpgrade ? "btn-primary w-full" : "px-4 py-2.5 rounded-lg text-sm font-medium transition bg-white/[0.04] text-[#f0f4fa] hover:bg-white/[0.08] border border-white/[0.07] w-full"}
                    >
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </button>
                  )}
                  {isCurrent && subscription.subscriptionStatus === "active" && tier !== "free" && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition bg-white/[0.04] text-[#f0f4fa] hover:bg-white/[0.08] border border-white/[0.07] w-full"
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Upgrade Modal */}
        {selectedTier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-[#f0f4fa] mb-4">
                Change to {selectedTier} Plan
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[rgba(240,244,250,0.5)] uppercase tracking-wide block mb-2">Billing Email</label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-[#080c16] border border-white/[0.07] rounded-lg text-[#f0f4fa] focus:outline-none focus:border-[#14b8a6]"
                    placeholder="billing@company.com"
                  />
                </div>
                <p className="text-sm text-[rgba(240,244,250,0.5)]">
                  You'll be charged ${availableTiers[selectedTier as keyof TierLimits].price}/month
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpgrade(selectedTier)}
                    className="btn-primary flex-1"
                  >
                    Confirm
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
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
