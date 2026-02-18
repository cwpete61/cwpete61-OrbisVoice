"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetchSubscription();
    fetchAvailableTiers();
  }, []);

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
      <div className="min-h-screen bg-base p-6">
        <div className="ov-container pt-8">
          <div className="text-center py-12">
            <p className="text-text-secondary">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription || !availableTiers) {
    return (
      <div className="min-h-screen bg-base p-6">
        <div className="ov-container pt-8">
          <div className="text-center py-12">
            <p className="text-red-500">{error || "Failed to load billing information"}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentTier = subscription.subscriptionTier as keyof TierLimits;
  const usagePercent = subscription.usagePercent;
  const isOverLimit = usagePercent >= 100;

  return (
    <div className="min-h-screen bg-base">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface">
        <div className="ov-container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Billing & Usage</h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage your subscription and monitor usage
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-secondary"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="ov-container py-8 space-y-8">
        {error && (
          <div className="ov-card p-4 border-l-4 border-red-500">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Current Subscription */}
        <section className="ov-card p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-text-dim mb-1">Plan</p>
              <p className="text-2xl font-bold text-teal capitalize">{currentTier}</p>
              <p className="text-sm text-text-secondary mt-1">
                ${availableTiers[currentTier].price}/month
              </p>
            </div>
            <div>
              <p className="text-sm text-text-dim mb-1">Status</p>
              <p className="text-lg font-semibold text-text-primary capitalize">
                {subscription.subscriptionStatus || "Active"}
              </p>
              {subscription.subscriptionEnds && (
                <p className="text-sm text-text-secondary mt-1">
                  Renews {new Date(subscription.subscriptionEnds).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-text-dim mb-1">Billing Email</p>
              <p className="text-text-primary">{subscription.billingEmail || "Not set"}</p>
            </div>
          </div>
        </section>

        {/* Usage Stats */}
        <section className="ov-card p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Usage This Month</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Conversations</span>
                <span className={isOverLimit ? "text-red-500 font-bold" : "text-text-primary"}>
                  {subscription.usageCount} / {subscription.usageLimit}
                </span>
              </div>
              <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isOverLimit ? "bg-red-500" : "bg-teal"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-text-dim mt-1">
                Resets on {new Date(subscription.usageResetAt).toLocaleDateString()}
              </p>
            </div>

            {isOverLimit && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-500 font-semibold">⚠️ Usage Limit Exceeded</p>
                <p className="text-sm text-text-secondary mt-1">
                  Upgrade your plan to continue creating conversations
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Available Plans */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(availableTiers).map(([tier, info]) => {
              const isCurrent = tier === currentTier;
              const isUpgrade = info.price > availableTiers[currentTier].price;

              return (
                <div
                  key={tier}
                  className={`ov-card p-6 ${
                    isCurrent ? "border-2 border-teal" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-text-primary capitalize">{tier}</h3>
                    {isCurrent && (
                      <span className="label text-xs">Current</span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-teal mb-2">${info.price}</p>
                  <p className="text-sm text-text-dim mb-4">per month</p>
                  <p className="text-text-secondary mb-6">
                    {info.conversations.toLocaleString()} conversations/month
                  </p>
                  {!isCurrent && (
                    <button
                      onClick={() => setSelectedTier(tier)}
                      className={isUpgrade ? "btn-primary w-full" : "btn-secondary w-full"}
                    >
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </button>
                  )}
                  {isCurrent && subscription.subscriptionStatus === "active" && tier !== "free" && (
                    <button
                      onClick={handleCancel}
                      className="btn-secondary w-full"
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
            <div className="ov-card p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                Change to {selectedTier} Plan
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label block mb-2">Billing Email</label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-primary focus:outline-none focus:border-teal"
                    placeholder="billing@company.com"
                  />
                </div>
                <p className="text-sm text-text-secondary">
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
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
