"use client";

import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
}

interface OnboardingChecklistProps {
  agentsCount: number;
  conversationsCount: number;
}

export default function OnboardingChecklist({ agentsCount, conversationsCount }: OnboardingChecklistProps) {
  const steps: OnboardingStep[] = [
    {
      id: "create-agent",
      title: "Create your first agent",
      description: "Define your agent's personality and system prompt.",
      href: "/agents/new",
      isCompleted: agentsCount > 0,
    },
    {
      id: "test-call",
      title: "Make a test call",
      description: "Interact with your agent to verify its responses.",
      href: "/dashboard",
      isCompleted: conversationsCount > 0,
    },
    {
      id: "embed-widget",
      title: "Explore Billing",
      description: "Check out the new subscription tiers.",
      href: "/billing",
      isCompleted: false, // For now, keep as a guide
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (completedCount === steps.length) return null;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c111d] shadow-2xl">
      <div className="bg-gradient-to-r from-[#14b8a6]/10 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#f0f4fa]">Getting Started</h2>
            <p className="text-xs text-[rgba(240,244,250,0.45)]">Complete these steps to launch your first voice agent</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-[#14b8a6]">{progressPercent}% Complete</span>
            <div className="mt-1.5 h-1.5 w-32 rounded-full bg-white/[0.05]">
              <div 
                className="h-full rounded-full bg-[#14b8a6] transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`flex items-center gap-4 px-6 py-4 transition-colors ${step.isCompleted ? 'opacity-60' : 'hover:bg-white/[0.02]'}`}
          >
            <div className="flex-shrink-0">
              {step.isCompleted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(240,244,250,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${step.isCompleted ? 'text-[rgba(240,244,250,0.5)] line-through' : 'text-[#f0f4fa]'}`}>
                {step.title}
              </h3>
              {!step.isCompleted && (
                <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.45)]">{step.description}</p>
              )}
            </div>
            {!step.isCompleted && (
              <Link 
                href={step.href}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#14b8a6] hover:text-[#0d9488] transition group"
              >
                Go
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-0.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
