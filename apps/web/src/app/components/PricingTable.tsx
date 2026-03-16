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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
            className={`relative group overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl flex flex-col ${
              isCurrent 
                ? "border-[#14b8a6] bg-[#14b8a6]/[0.05] shadow-[#14b8a6]/10" 
                : "border-white/5 bg-white/[0.01] hover:border-white/10"
            }`}
          >
            {/* Background Glow */}
            <div 
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.03] transition-opacity group-hover:opacity-[0.08]" 
              style={{ backgroundColor: config.accent }}
            />

            <div className="relative p-5 flex flex-col h-full">
              {/* Badge */}
              {config.popular && (
                <div className="mb-3">
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30">
                    Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="mb-3">
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30">
                    Active
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-base font-bold text-white mb-1">{config.name}</h3>
                <p className="text-[11px] text-gray-500 leading-tight min-h-[32px]">
                  {config.description}
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-black text-white">$</span>
                  <span className="text-3xl font-black text-white tracking-tight">
                    {displayInfo.price}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    /{config.frequencyText || "mo"}
                  </span>
                </div>
                {config.secondaryPrice && (
                  <p className="text-[9px] text-red-400 mt-1 font-semibold leading-none">
                    + {config.secondaryPrice}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-2.5 mb-6">
                <div className="pb-2 border-b border-white/5">
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {displayInfo.conversations.toLocaleString()} Convs
                  </p>
                </div>
                {config.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" fill="none" stroke={config.accent} strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-400 line-clamp-1">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {isCurrent && subscriptionStatus === "active" ? (
                  <button
                    onClick={onCancel}
                    className="w-full py-2.5 rounded-xl font-bold text-[10px] uppercase bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => onSelect(tier)}
                    style={{ 
                      backgroundColor: isUpgrade ? config.accent : 'transparent',
                      borderColor: isUpgrade ? 'transparent' : 'rgba(255,255,255,0.05)'
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase text-white border transition-all duration-300 ${
                      !isUpgrade ? "hover:bg-white/5 active:scale-[0.98]" : "hover:brightness-110 shadow-lg active:scale-[0.98]"
                    }`}
                  >
                    {isCurrent ? "Reactivate" : isUpgrade ? "Upgrade" : "Switch"}
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
