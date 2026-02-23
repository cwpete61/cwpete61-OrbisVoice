"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

interface TierInfo {
  conversations: number;
  price: number;
}

const tierNames = ["starter", "professional", "enterprise"] as const;
type TierName = (typeof tierNames)[number];

const allTierNames = ["ltd", "starter", "professional", "enterprise", "ai-revenue-infrastructure"] as const;
type AllTierName = (typeof allTierNames)[number];

const isTierName = (tier: string): tier is TierName =>
  tierNames.includes(tier as TierName);

const isAllTierName = (tier: string): tier is AllTierName =>
  allTierNames.includes(tier as AllTierName);

// Tier display configuration
const TIER_CONFIG: Record<AllTierName, {
  name: string;
  accent: string;
  description: string;
  popular?: boolean;
  limitText?: string;
  frequencyText?: string;
}> = {
  ltd: {
    name: "LTD (Lifetime Deal)",
    accent: "#ef4444",
    description: "First Month, then $20/month for Twilio and API Costs",
    limitText: "Limited to first 100 accounts",
    frequencyText: "One-Time Payment"
  },
  starter: {
    name: "Starter",
    accent: "#14b8a6",
    description: "Core conversion engine for single-location teams"
  },
  professional: {
    name: "Professional",
    accent: "#f97316",
    description: "AI qualification and revenue acceleration",
    popular: true
  },
  enterprise: {
    name: "Enterprise",
    accent: "#38bdf8",
    description: "Multi-location revenue infrastructure"
  },
  "ai-revenue-infrastructure": {
    name: "AI Revenue Infrastructure",
    accent: "#a855f7",
    description: "AI operations command for revenue control"
  }
};

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

type TierLimits = Record<AllTierName, TierInfo>;

function BillingContent() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [availableTiers, setAvailableTiers] = useState<TierLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<AllTierName | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [billingEmail, setBillingEmail] = useState("");

  // Extract token from URL if present (from OAuth callback)
  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      fetchSubscription();
      fetchAvailableTiers();
      fetchPackages();
    }
  }, [tokenLoaded]);

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

  const currentTier: AllTierName = isAllTierName(subscription.subscriptionTier)
    ? subscription.subscriptionTier
    : "starter";
  const currentTierInfo = availableTiers[currentTier] ?? availableTiers.starter;
  const currentTierConfig = TIER_CONFIG[currentTier];
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
          <h2 className="text-lg font-bold text-[#f0f4fa] mb-6">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-[rgba(240,244,250,0.4)] uppercase tracking-wide mb-2">Plan</p>
              <p className="text-2xl font-bold" style={{ color: currentTierConfig.accent }}>
                {currentTierConfig.name}
              </p>
              <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">
                ${currentTierInfo.price}/month
              </p>
              <p className="text-xs text-[rgba(240,244,250,0.4)] mt-2">
                {currentTierConfig.description}
              </p>
            </div>
            <div>
              <p className="text-xs text-[rgba(240,244,250,0.4)] uppercase tracking-wide mb-2">Status</p>
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
              <p className="text-xs text-[rgba(240,244,250,0.4)] uppercase tracking-wide mb-2">Usage</p>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-[rgba(240,244,250,0.5)]">Conversations</span>
                <span className={isOverLimit && !(subscription as any).creditBalance ? "text-red-400 font-bold" : "font-semibold text-[#f0f4fa]"}>
                  {subscription.usageCount} / {subscription.usageLimit} {(subscription as any).creditBalance > 0 && `(+${(subscription as any).creditBalance} extra)`}
                </span>
              </div>
              <div className="h-3 bg-[#080c16] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${isOverLimit ? "bg-red-500" : "bg-[#14b8a6]"
                    }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[rgba(240,244,250,0.4)]">
                Resets on {new Date(subscription.usageResetAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isOverLimit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-6">
              <p className="text-red-400 font-semibold flex items-center gap-2">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                </svg>
                Usage Limit Exceeded
              </p>
              <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">
                Upgrade your plan to continue creating conversations
              </p>
            </div>
          )}
        </section>

        {/* Available Plans */}
        <section>
          <h2 className="text-lg font-bold text-[#f0f4fa] mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allTierNames.map((tier) => {
              const info = availableTiers[tier];
              if (!info) return null;
              const isCurrent = tier === currentTier;
              const isUpgrade = info.price > currentTierInfo.price;
              const config = TIER_CONFIG[tier];

              return (
                <div
                  key={tier}
                  className={`relative rounded-2xl border bg-[#0c111d] p-6 transition-all hover:border-opacity-40 ${isCurrent ? "border-[#14b8a6]" : "border-white/[0.07]"
                    }`}
                >
                  {config.popular && !isCurrent && (
                    <span className="absolute -top-3 right-6 text-[10px] px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/40 font-semibold uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-6 text-[10px] px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/40 font-semibold uppercase tracking-wider">
                      Current
                    </span>
                  )}
                  {config.limitText && !isCurrent && (
                    <span className="absolute -top-3 right-6 text-[10px] px-2 py-0.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/40 font-semibold uppercase tracking-wider">
                      {config.limitText}
                    </span>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-[#f0f4fa]">
                      {config.name}
                    </h3>
                    <p className="mt-1 text-xs text-[rgba(240,244,250,0.45)]">{config.description}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-4xl font-bold" style={{ color: config.accent }}>
                      ${info.price}
                    </p>
                    <p className="text-sm text-[rgba(240,244,250,0.4)] mt-1">
                      {tier === 'ltd' ? "One-Time Payment" : (config.frequencyText || "per month")}
                    </p>
                  </div>
                  <div className="mb-6 pb-6 border-b border-white/[0.05]">
                    <p className="text-sm font-medium" style={{ color: config.accent }}>
                      {info.conversations.toLocaleString()} conversations
                    </p>
                    <p className="text-xs text-[rgba(240,244,250,0.4)] mt-0.5">per month</p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => setSelectedTier(tier)}
                      className={isUpgrade
                        ? "btn-primary w-full text-sm"
                        : "px-4 py-2.5 rounded-lg text-sm font-medium transition bg-white/[0.04] text-[#f0f4fa] hover:bg-white/[0.08] border border-white/[0.07] w-full"}
                    >
                      {isUpgrade ? "Upgrade Plan" : "Change Plan"}
                    </button>
                  )}
                  {isCurrent && subscription.subscriptionStatus === "active" && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 w-full"
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Conversation Packages */}
        {packages.length > 0 && (
          <>
            <div className="my-10 border-t border-white/[0.05]"></div>
            <section>
              <h2 className="text-lg font-bold text-[#f0f4fa] mb-2">Conversation Packages</h2>
              <p className="text-sm text-[rgba(240,244,250,0.45)] mb-6">Need more conversations? Purchase one-time packages that roll over until used.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 transition-all hover:border-white/[0.15]">
                    <h3 className="text-lg font-bold text-[#f0f4fa]">{pkg.name}</h3>
                    <p className="text-xs text-[rgba(240,244,250,0.45)] mt-1">One-time purchase</p>
                    <div className="my-4">
                      <p className="text-3xl font-bold text-[#14b8a6]">${pkg.price}</p>
                    </div>
                    <div className="mb-6 pb-6 border-b border-white/[0.05]">
                      <p className="text-sm font-medium text-[#f0f4fa]">+{pkg.credits.toLocaleString()} conversations</p>
                    </div>
                    <button
                      onClick={() => handleBuyPackage(pkg)}
                      disabled={purchasingPackage === pkg.id}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition bg-white/[0.04] text-[#f0f4fa] hover:bg-white/[0.08] border border-white/[0.07] w-full disabled:opacity-50"
                    >
                      {purchasingPackage === pkg.id ? "Processing..." : "Buy Package"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Upgrade Modal */}
        {selectedTier && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-[#f0f4fa] mb-2">
                {TIER_CONFIG[selectedTier].name}
              </h3>
              <p className="text-sm text-[rgba(240,244,250,0.5)] mb-6">
                {TIER_CONFIG[selectedTier].description}
              </p>
              <div className="bg-[#080c16] rounded-xl p-4 mb-6 border border-white/[0.05]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[rgba(240,244,250,0.5)]">
                    {selectedTier === "ltd" ? "One-Time Payment" : "Monthly Price"}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: TIER_CONFIG[selectedTier].accent }}>
                    ${availableTiers[selectedTier].price}
                  </span>
                </div>
                {selectedTier === "ltd" && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[rgba(240,244,250,0.5)]">+ Monthly Hosting</span>
                    <span className="text-sm font-semibold text-[#f0f4fa]">$20/mo</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgba(240,244,250,0.5)]">Conversations</span>
                  <span className="text-sm font-semibold text-[#f0f4fa]">
                    {availableTiers[selectedTier].conversations.toLocaleString()}/month
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