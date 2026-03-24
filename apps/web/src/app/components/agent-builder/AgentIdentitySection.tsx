"use client";
import React from "react";
import { AgentType } from "@/types/agent";

interface AgentIdentitySectionProps {
  name: string;
  setNameAction: (name: string) => void;
  agentType: AgentType;
  setAgentTypeAction: (type: string) => void;
  debouncedAutoSaveAction: (overrides?: any) => void;
  triggerAutoSaveAction: (overrides?: any) => void;
  isActive: boolean;
  onActivateAction: () => void;
  isStepCompleteAction: (step: number) => boolean;
  phoneNumber: string;
  setPhoneNumberAction: (num: string) => void;
  handleStep1ContinueAction: () => void;
}

const AGENT_TYPES = [
  {
    id: "WIDGET",
    name: "Web Widget",
    description: "Interactive voice widget for your website",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
      </svg>
    ),
  },
  {
    id: "INBOUND_TWILIO",
    name: "Inbound Phone",
    description: "Agent answers calls to a Twilio phone number",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    id: "OUTBOUND_TWILIO",
    name: "Outbound Phone",
    description: "Agent places calls to lists of phone numbers",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 3h6v6" />
        <path d="M21 3l-9 9" />
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
];

export default function AgentIdentitySection({
  name,
  setNameAction,
  agentType,
  setAgentTypeAction,
  debouncedAutoSaveAction,
  triggerAutoSaveAction,
  isActive,
  onActivateAction,
  isStepCompleteAction,
  phoneNumber,
  setPhoneNumberAction,
  handleStep1ContinueAction,
}: AgentIdentitySectionProps) {
  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? "ring-1 ring-[#14b8a6]/30" : ""}`}
    >
      <button
        onClick={onActivateAction}
        suppressHydrationWarning
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isActive
              ? "bg-[#14b8a6] text-white"
              : isStepCompleteAction(1)
                ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
          }`}
        >
          1
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold text-white">Agent Identity</div>
          <div className="text-xs text-[rgba(240,244,250,0.35)]">
            Name and type of your virtual representative
          </div>
        </div>
        {isStepCompleteAction(1) && !isActive && (
          <div className="ml-auto text-xs text-[#14b8a6] font-medium">Configured</div>
        )}
      </button>

      {isActive && (
        <div className="px-6 pb-6 fade-slide-up">
          <div className="border-t border-white/[0.05] pt-5">
            <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setNameAction(e.target.value);
                debouncedAutoSaveAction({ name: e.target.value });
              }}
              placeholder="e.g., Sales Pro, Support Ally, Booking Bot..."
              className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-[rgba(240,244,250,0.2)] focus:outline-none focus:border-[#14b8a6]/50 focus:ring-1 focus:ring-[#14b8a6]/20 transition text-sm"
              autoFocus
              suppressHydrationWarning
            />
            <p className="mt-2 text-[10px] text-[rgba(240,244,250,0.25)]">
              Your customers will hear this name when interacting with the agent
            </p>

            <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2 mt-6">
              Agent Type
            </label>
            <div className="grid grid-cols-1 gap-2 mb-6">
              {AGENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  suppressHydrationWarning
                  onClick={() => {
                    setAgentTypeAction(t.id);
                    triggerAutoSaveAction({ agentType: t.id });
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                    agentType === t.id
                      ? "bg-[#14b8a6]/10 border-[#14b8a6]/50 ring-1 ring-[#14b8a6]/20"
                      : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${agentType === t.id ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "bg-white/[0.05] text-[rgba(240,244,250,0.4)]"}`}>
                    {t.icon}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-semibold ${agentType === t.id ? "text-white" : "text-[rgba(240,244,250,0.8)]"}`}>{t.name}</div>
                    <div className="text-[10px] text-[rgba(240,244,250,0.35)]">{t.description}</div>
                  </div>
                  {agentType === t.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#14b8a6] flex items-center justify-center">
                      <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                        <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Twilio Phone Field */}
            {(agentType === "INBOUND_TWILIO" || agentType === "OUTBOUND_TWILIO") && (
              <div className="mb-6 fade-slide-up">
                <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
                  Twilio Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumberAction(e.target.value);
                      debouncedAutoSaveAction({ phoneNumber: e.target.value });
                    }}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-white placeholder-[rgba(240,244,250,0.2)] focus:outline-none focus:border-[#14b8a6]/50 focus:ring-1 focus:ring-[#14b8a6]/20 transition text-sm"
                    suppressHydrationWarning
                  />
                </div>
                <p className="mt-2 text-[10px] text-[rgba(240,244,250,0.25)]">
                  The phone number associated with your Twilio account
                </p>
              </div>
            )}

            <button
              onClick={handleStep1ContinueAction}
              disabled={!name.trim()}
              className="w-full py-3 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-bold transition disabled:opacity-40"
            >
              Continue to Persona Settings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
