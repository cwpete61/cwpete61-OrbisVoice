"use client";

import { useEffect, useState } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import { API_BASE } from "@/lib/api";

const PRICING_TIERS = [
  {
    name: "Starter",
    tier: "starter",
    price: "$197",
    period: "/mo",
    conversations: "1,000 conversations/month",
    tagline: "Core conversion engine for single-location teams.",
    cta: "Start Starter",
    accent: "#14b8a6",
    features: [
      "Website overlay chat + qualification flows",
      "Email and SMS capture with verification",
      "Caller ID capture with AI qualification",
      "Booking + owner notifications",
      "CRM export (CSV or webhook)",
      "Call recording + transcription (30 days)",
      "Basic analytics for 1 location",
      "Mobile app access",
    ],
  },
  {
    name: "Professional",
    tier: "professional",
    price: "$497",
    period: "/mo",
    conversations: "10,000 conversations/month",
    tagline: "AI qualification and revenue acceleration.",
    cta: "Choose Professional",
    accent: "#f97316",
    popular: true,
    features: [
      "AI intake, lead scoring, and routing",
      "Automated follow-up sequences",
      "Missed-call text-back automation",
      "Multi-channel reminders and reviews",
      "CRM integrations for up to 3 locations",
      "Real-time performance dashboard + alerts",
      "Voicemail-to-text conversion",
      "Unlimited custom routing rules",
      "Up to 50 concurrent calls",
    ],
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "$997",
    period: "/mo",
    conversations: "100,000 conversations/month",
    tagline: "Multi-location revenue infrastructure.",
    cta: "Choose Enterprise",
    accent: "#38bdf8",
    features: [
      "Voice AI coverage + live transfer",
      "Location-based routing and analytics",
      "API access + compliance controls",
      "Dedicated support + 99.9% uptime SLA",
      "Unlimited locations + concurrent calls",
      "Custom workflows and automation builder",
      "Advanced reporting + data exports",
      "White-label options available",
      "Multi-language support (15+ languages)",
    ],
  },
  {
    name: "AI Revenue Infrastructure",
    tier: "ai-revenue-infrastructure",
    price: "$1,997",
    period: "/mo",
    conversations: "250,000 conversations/month",
    tagline: "AI operations command for revenue control.",
    cta: "Talk with Sales",
    accent: "#a855f7",
    features: [
      "24/7 AI voice + chat operations",
      "Revenue attribution + ROI dashboard",
      "Pipeline reactivation + opportunity recovery",
      "Compliance and role-based controls",
      "Dedicated account management team",
      "Custom AI model training",
      "Priority support + 24-hour response",
      "Reseller/partner programs",
      "Advanced integrations + custom APIs",
    ],
  },
];

export default function PricingPage() {
  const [limits, setLimits] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/stats/pricing-limits`)
      .then(res => res.json())
      .then(json => {
        if (json.ok) setLimits(json.data);
      })
      .catch(err => console.error("Failed to fetch limits:", err));
  }, []);

  const getConversations = (tier: string, fallback: string) => {
    if (!limits) return fallback;
    const limit = {
      starter: limits.starterLimit,
      professional: limits.professionalLimit,
      enterprise: limits.enterpriseLimit,
      "ai-revenue-infrastructure": limits.aiInfraLimit,
    }[tier];

    if (limit === undefined || limit === null) return fallback;
    return `${limit.toLocaleString()} conversations/month`;
  };

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <PublicNav />
      <div className="ov-container relative py-16">
        <div className="hero-glow" />

        <div className="mb-12 w-full">
          <p className="pill">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Revenue infrastructure, not a chat widget
          </h1>
          <p className="mt-4 text-base text-[rgba(240,244,250,0.6)]">
            Capture, qualify, route, and recover revenue across every location and channel.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="relative flex flex-col rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6"
            >
              {tier.popular && (
                <span className="pill absolute -top-3 right-6 border border-[#f97316]/40 bg-[#f97316]/10 text-[#f97316]">
                  Most popular
                </span>
              )}
              <div className="flex-1">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-[#f0f4fa]">{tier.name}</h3>
                </div>
                <p className="mt-2 text-sm text-[rgba(240,244,250,0.55)]">{tier.tagline}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold" style={{ color: tier.accent }}>{tier.price}</span>
                  <span className="text-sm text-[rgba(240,244,250,0.5)]">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-[rgba(240,244,250,0.6)]">
                  {getConversations(tier.tier, tier.conversations)}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-[rgba(240,244,250,0.6)]">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: tier.accent }} />
                      <span>{feature}</span>
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
              <p className="pill">Enterprise Rollouts</p>
              <h2 className="mt-3 text-2xl font-semibold">Custom rollout planning</h2>
              <p className="mt-2 text-sm text-[rgba(240,244,250,0.55)]">
                Book a working session to scope locations, workflows, and ROI targets.
              </p>
            </div>
            <button className="btn-secondary text-sm">Book a planning call</button>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="text-sm font-semibold">Every plan includes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-[rgba(240,244,250,0.6)]">
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
              <p className="font-medium text-[rgba(240,244,250,0.9)]">Capture & Qualify</p>
              <p className="mt-1 text-xs">Lead capture and booking automation</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
              <p className="font-medium text-[rgba(240,244,250,0.9)]">Intelligence</p>
              <p className="mt-1 text-xs">Real-time transcription, conversation summaries, and AI insights</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
              <p className="font-medium text-[rgba(240,244,250,0.9)]">Security & Compliance</p>
              <p className="mt-1 text-xs">Secure storage, audit trails, alerts, and HIPAA compliance</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
              <p className="font-medium text-[rgba(240,244,250,0.9)]">Call Management</p>
              <p className="mt-1 text-xs">Full call recording, transcription, and 90-day storage</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
              <p className="font-medium text-[rgba(240,244,250,0.9)]">Integrations</p>
              <p className="mt-1 text-xs">Zapier, CRM connectors, and webhook support</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
              <p className="font-medium text-[rgba(240,244,250,0.9)]">Monitoring</p>
              <p className="mt-1 text-xs">24/7 system monitoring and uptime tracking</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
