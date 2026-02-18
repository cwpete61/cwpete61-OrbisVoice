"use client";

import { useState, useEffect } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";

const LOCAL_DEALS = [
  {
    name: "Local Businesses - LTD",
    price: "$500",
    period: "one-time",
    tagline: "Lifetime deal plus usage-based phone costs.",
    cta: "Claim LTD",
    accent: "#14b8a6",
    ltdTotal: 100,
    features: [
      "Lifetime platform access",
      "$20 for tokens + local phone number w/minutes",
      "Single-location setup",
      "Standard analytics",
      "Email support",
    ],
  },
  {
    name: "Local Businesses - Monthly",
    price: "$197",
    period: "/mo",
    tagline: "Everything included: tokens + phone number w/minutes.",
    cta: "Start monthly",
    accent: "#f97316",
    popular: true,
    features: [
      "All usage included",
      "Local phone number w/minutes",
      "Priority routing",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const [ltdRemaining, setLtdRemaining] = useState(100);

  useEffect(() => {
    // Simulate tracking LTD sales from storage or API
    const storedSold = localStorage.getItem("ltd_sold") || "0";
    const sold = parseInt(storedSold, 10);
    const remaining = 100 - sold;
    setLtdRemaining(remaining);

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      const updated = localStorage.getItem("ltd_sold") || "0";
      const updatedSold = parseInt(updated, 10);
      const updatedRemaining = 100 - updatedSold;
      setLtdRemaining(updatedRemaining);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <PublicNav />
      <div className="ov-container relative py-16">
        <div className="hero-glow" />

        <div className="mb-12 max-w-3xl">
          <p className="pill">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Pricing built for local growth
          </h1>
          <p className="mt-4 text-base text-[rgba(240,244,250,0.6)]">
            Two clear options for local businesses, plus a dedicated track for multi-location
            teams.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {LOCAL_DEALS.map((tier, idx) => (
            <div
              key={tier.name}
              className="relative flex flex-col rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6"
            >
              {/* LTD counter */}
              {idx === 0 && (
                <div className="mb-4 rounded-lg border border-[#14b8a6]/30 bg-[#14b8a6]/10 px-3 py-2 text-center text-xs font-semibold text-[#14b8a6]">
                  {ltdRemaining} / 100 available
                </div>
              )}
              {tier.popular && (
                <span className="pill absolute -top-3 right-6 border border-[#f97316]/40 bg-[#f97316]/10 text-[#f97316]">
                  Most popular
                </span>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tier.accent }}>
                    {tier.cta}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[rgba(240,244,250,0.55)]">{tier.tagline}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold" style={{ color: tier.accent }}>{tier.price}</span>
                  <span className="text-sm text-[rgba(240,244,250,0.5)]">{tier.period}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-[rgba(240,244,250,0.6)]">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tier.accent }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="btn-primary mt-6 w-full text-sm">{tier.cta}</button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="pill">Medium to Large Businesses</p>
              <h2 className="mt-3 text-2xl font-semibold">Multi-location orchestration</h2>
              <p className="mt-2 text-sm text-[rgba(240,244,250,0.55)]">
                Speak with Orbis to book an appoint to explore goals and needs.
              </p>
            </div>
            <button className="btn-secondary text-sm">Speak with Orbis</button>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="text-sm font-semibold">Every plan includes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-[rgba(240,244,250,0.6)]">
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">AI call summaries and next steps</div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">24/7 monitoring and alerts</div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">Secure storage and audit trails</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
