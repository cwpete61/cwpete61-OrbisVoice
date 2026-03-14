"use client";

import React from "react";

export interface TierInfo {
  conversations: number;
  price: number;
}

export type AllTierName = "free" | "ltd" | "starter" | "professional" | "enterprise" | "ai-revenue-infrastructure";

export interface TierConfig {
  name: string;
  accent: string;
  description: string;
  popular?: boolean;
  limitText?: string;
  frequencyText?: string;
  secondaryPrice?: string;
  features: string[];
}

export const TIER_CONFIGS: Record<AllTierName, TierConfig> = {
  free: {
    name: "Free Trial",
    accent: "#94a3b8",
    description: "Experience OrbisVoice trial credits.",
    limitText: "Limited Trial",
    features: ["3 Conversations", "Basic Analytics", "Standard Voice"],
  },
  ltd: {
    name: "LTD (Lifetime)",
    accent: "#ef4444",
    description: "Lifetime access for a one-time fee.",
    limitText: "Legacy Offer",
    frequencyText: "One-Time Payment",
    secondaryPrice: "$20/month tokens",
    features: ["1,000 Conversations/mo", "Lifetime Access", "Basic Support"],
  },
  starter: {
    name: "Starter",
    accent: "#14b8a6",
    description: "Core conversion engine for single-location teams",
    features: ["1,000 Conversations", "Lead Capture", "Live Dashboard"],
  },
  professional: {
    name: "Professional",
    accent: "#f97316",
    description: "AI qualification and revenue acceleration",
    popular: true,
    features: ["10,000 Conversations", "Priority Support", "Advanced Analytics", "Lead Booking"],
  },
  enterprise: {
    name: "Enterprise",
    accent: "#38bdf8",
    description: "Multi-location revenue infrastructure",
    features: ["100,000 Conversations", "Custom Integrations", "Dedicated Account Manager", "Unlimited Agents"],
  },
  "ai-revenue-infrastructure": {
    name: "Infrastructure",
    accent: "#a855f7",
    description: "AI operations command for revenue control",
    features: ["250,000 Conversations", "Whitelabel Options", "SLA Guarantee", "Full API Access"],
  }
};

interface PricingTableProps {
  currentTier: AllTierName;
  availableTiers: Record<AllTierName, TierInfo>;
  onSelect: (tier: AllTierName) => void;
  onCancel: () => void;
  subscriptionStatus: string | null;
}

export default function PricingTable({
  currentTier,
  availableTiers,
  onSelect,
  onCancel,
  subscriptionStatus,
}: PricingTableProps) {
  const tiers = Object.keys(TIER_CONFIGS) as AllTierName[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier) => {
        const config = TIER_CONFIGS[tier];
        const info = availableTiers[tier];
        if (!info && tier !== 'ltd') return null;
        
        // Mock LTD info if missing from API
        const displayInfo = info || { price: 497, conversations: 1000 };
        const isCurrent = tier === currentTier;
        const isUpgrade = displayInfo.price > (availableTiers[currentTier]?.price || 0);

        return (
          <div
            key={tier}
            className={`relative group overflow-hidden rounded-3xl border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
              isCurrent 
                ? "border-[#14b8a6] bg-[#14b8a6]/[0.03] shadow-[#14b8a6]/10" 
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            {/* Background Glow */}
            <div 
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.03] transition-opacity group-hover:opacity-[0.08]" 
              style={{ backgroundColor: config.accent }}
            />

            <div className="relative p-8 flex flex-col h-full">
              {/* Badge */}
              {config.popular && (
                <div className="absolute top-6 right-6">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-6 right-6">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{config.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed min-h-[40px]">
                  {config.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$</span>
                  <span className="text-5xl font-black text-white tracking-tight">
                    {displayInfo.price}
                  </span>
                  <span className="text-gray-500 font-medium">
                    /{config.frequencyText || "mo"}
                  </span>
                </div>
                {config.secondaryPrice && (
                  <p className="text-xs text-red-400 mt-2 font-semibold">
                    + {config.secondaryPrice}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <div className="pb-4 border-b border-white/5">
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {displayInfo.conversations.toLocaleString()} Conversations
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Renewed monthly</p>
                </div>
                {config.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" fill="none" stroke={config.accent} strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {isCurrent && subscriptionStatus === "active" ? (
                  <button
                    onClick={onCancel}
                    className="w-full py-4 rounded-2xl font-bold text-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <button
                    onClick={() => onSelect(tier)}
                    style={{ 
                      backgroundColor: isUpgrade ? config.accent : 'transparent',
                      borderColor: isUpgrade ? 'transparent' : 'rgba(255,255,255,0.1)'
                    }}
                    className={`w-full py-4 rounded-2xl font-bold text-sm text-white border transition-all duration-300 ${
                      !isUpgrade ? "hover:bg-white/5 active:scale-[0.98]" : "hover:brightness-110 shadow-lg active:scale-[0.98]"
                    }`}
                  >
                    {isCurrent ? "Reactivate Plan" : isUpgrade ? "Upgrade Now" : "Switch Plan"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
