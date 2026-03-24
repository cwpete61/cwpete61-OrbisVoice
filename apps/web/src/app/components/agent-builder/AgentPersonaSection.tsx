"use client";
import React from "react";

interface AgentPersonaSectionProps {
  systemPrompt: string;
  setSystemPromptAction: (prompt: string) => void;
  selectedTemplate: string | null;
  handleTemplateSelectAction: (template: any) => void;
  debouncedAutoSaveAction: (overrides?: any) => void;
  isActive: boolean;
  onActivateAction: () => void;
  isStepCompleteAction: (step: number) => boolean;
  handleStep2ContinueAction: () => void;
  maxChars: number;
}

const PERSONA_TEMPLATES = [
  {
    id: "sales",
    emoji: "💼",
    name: "Sales Assistant",
    prompt:
      "You are a professional sales assistant. Your goal is to help potential customers understand our products and services, answer their questions clearly, identify their needs, and guide them toward a purchase decision. Be persuasive yet honest. Ask qualifying questions to understand their budget and timeline. Always end with a clear call to action.",
  },
  {
    id: "support",
    emoji: "🎧",
    name: "Support Agent",
    prompt:
      "You are a friendly customer support agent. Your goal is to help customers resolve issues quickly and efficiently. Listen carefully to their problems, empathize with their frustration, and provide clear step-by-step solutions. If you cannot resolve an issue, escalate it politely. Always confirm the customer is satisfied before ending the conversation.",
  },
  {
    id: "scheduler",
    emoji: "📅",
    name: "Appointment Setter",
    prompt:
      "You are an appointment scheduling assistant. Your goal is to help leads and customers book appointments with our team. Collect their name, contact information, preferred date and time, and the purpose of the meeting. Confirm all details before finalizing. Be professional, efficient, and friendly throughout the process.",
  },
  {
    id: "intake",
    emoji: "📋",
    name: "Lead Intake",
    prompt:
      "You are a lead intake specialist. Your goal is to gather information from potential clients to qualify them for our services. Ask about their business needs, challenges, budget, and timeline. Summarize the information clearly at the end. Be professional and make the prospect feel heard and valued.",
  },
  {
    id: "custom",
    emoji: "✨",
    name: "Custom",
    prompt: "",
  },
];

export default function AgentPersonaSection({
  systemPrompt,
  setSystemPromptAction,
  selectedTemplate,
  handleTemplateSelectAction,
  debouncedAutoSaveAction,
  isActive,
  onActivateAction,
  isStepCompleteAction,
  handleStep2ContinueAction,
  maxChars,
}: AgentPersonaSectionProps) {
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
              : isStepCompleteAction(2)
                ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
          }`}
        >
          2
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold text-white">Persona & Behavior</div>
          <div className="text-xs text-[rgba(240,244,250,0.35)]">
            Define how your agent thinks and responds
          </div>
        </div>
        {isStepCompleteAction(2) && !isActive && (
          <div className="ml-auto text-xs text-[#14b8a6] font-medium">Configured</div>
        )}
      </button>

      {isActive && (
        <div className="px-6 pb-6 fade-slide-up">
          <div className="border-t border-white/[0.05] pt-5">
            {/* Quick Templates */}
            <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-3">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {PERSONA_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelectAction(t)}
                  suppressHydrationWarning
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all duration-200 ${
                    selectedTemplate === t.id
                      ? "bg-[#14b8a6]/15 border border-[#14b8a6]/40 text-[#14b8a6]"
                      : "bg-white/[0.03] border border-white/[0.06] text-[rgba(240,244,250,0.5)] hover:text-white hover:border-white/[0.12] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>

            {/* System Prompt */}
            <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPromptAction(e.target.value.slice(0, maxChars));
                debouncedAutoSaveAction({ systemPrompt: e.target.value.slice(0, maxChars) });
              }}
              placeholder="Define how your agent should behave, its tone, goals, and how it should handle different scenarios..."
              rows={7}
              className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-[rgba(240,244,250,0.2)] focus:outline-none focus:border-[#14b8a6]/50 focus:ring-1 focus:ring-[#14b8a6]/20 transition text-sm resize-none leading-relaxed"
            />
            <div className="flex justify-between mt-1.5 mb-5">
              <span className="text-[10px] text-[rgba(240,244,250,0.25)]">
                Be specific about goals, tone, and constraints
              </span>
              <span
                className={`text-[10px] font-mono ${systemPrompt.length > maxChars * 0.9 ? "text-orange-400" : "text-[rgba(240,244,250,0.25)]"}`}
              >
                {systemPrompt.length}/{maxChars}
              </span>
            </div>

            <button
              onClick={handleStep2ContinueAction}
              className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm shadow-lg shadow-[#14b8a6]/20"
              suppressHydrationWarning
            >
              Continue to Widget Settings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
