"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import Link from "next/link";
import { AgentType, VoiceGender, VOICE_MODELS, PERSONA_TEMPLATES } from "@/types/agent";
import VoiceAgentWidget from "./VoiceAgentWidget";
import { VOICE_GATEWAY_URL, API_BASE } from "@/lib/api";
import { readApiBody } from "@/lib/response-utils";
import AgentIdentitySection from "./agent-builder/AgentIdentitySection";
import AgentPersonaSection from "./agent-builder/AgentPersonaSection";
import AgentWidgetSection from "./agent-builder/AgentWidgetSection";

export interface AgentData {
  id?: string;
  name: string;
  systemPrompt: string;
  voiceId: string;
  type?: AgentType;
  voiceGender?: VoiceGender;
  avatarUrl?: string | null;
  autoStart?: boolean;
  widgetIsVisible?: boolean;
  widgetPosition?: string;
  widgetPrimaryColor?: string;
  widgetDefaultOpen?: boolean;
  phoneNumber?: string | null;
}

export default function AgentBuilderForm({
  initialData,
  isEditing = false,
}: {
  initialData?: AgentData;
  isEditing?: boolean;
}) {
  const router = useRouter();

  // Form State
  const [agentId, setAgentId] = useState<string | undefined>(initialData?.id);
  const [name, setName] = useState(initialData?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || "");
  const [selectedVoice, setSelectedVoice] = useState(initialData?.voiceId || "aoede");
  const [agentType, setAgentType] = useState<AgentType>(initialData?.type || AgentType.WIDGET);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(initialData?.voiceGender || VoiceGender.FEMALE);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatarUrl || (initialData?.voiceGender === VoiceGender.MALE ? "/avatars/male1.png" : "/avatars/female1.png"));
  const [autoStart, setAutoStart] = useState<boolean>(initialData?.autoStart ?? true);
  const [widgetIsVisible, setWidgetIsVisible] = useState<boolean>(initialData?.widgetIsVisible ?? true);
  const [widgetPosition, setWidgetPosition] = useState<string>(initialData?.widgetPosition || "bottom-right");
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState<string>(initialData?.widgetPrimaryColor || "#14b8a6");
  const [widgetDefaultOpen, setWidgetDefaultOpen] = useState<boolean>(initialData?.widgetDefaultOpen ?? false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const isCreatingRef = useRef(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error" | "">("");
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [animatingVoice, setAnimatingVoice] = useState<string | null>(null);

  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const maxChars = 2000;
  const voiceModel = VOICE_MODELS.find((v) => v.id === selectedVoice) || VOICE_MODELS[0];

  const steps = [
    { n: 1, label: "Identity" },
    { n: 2, label: "Persona" },
    ...(agentType === "WIDGET" ? [{ n: 3, label: "Widget & Embed" }] : []),
  ];

  // Background auto-save triggered when inputs change
  const triggerAutoSave = async (overrides: any = {}) => {
    try {
      if (autoSaveStatus === "saving") return false; // Prevent multiple saves at once

      const token = localStorage.getItem("token");
      if (!token) return false;

      const payload = {
        name: overrides.name ?? name,
        systemPrompt: overrides.systemPrompt ?? systemPrompt,
        voiceModel: overrides.selectedVoice ?? selectedVoice,
        type: overrides.agentType ?? agentType,
        voiceGender: overrides.voiceGender ?? voiceGender,
        avatarUrl: overrides.avatarUrl ?? avatarUrl,
        autoStart: overrides.autoStart ?? autoStart,
        widgetIsVisible,
        widgetPosition,
        widgetPrimaryColor,
        widgetDefaultOpen,
        phoneNumber: overrides.phoneNumber ?? phoneNumber
      };

      // Name is required to save
      if (!payload.name.trim()) return false;

      setAutoSaveStatus("saving");

      if (!agentId) {
        if (isCreatingRef.current) return false;
        isCreatingRef.current = true;
        
        // Initial POST
        const res = await fetch(`${API_BASE}/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await readApiBody<{ id?: string, data?: any }>(res);
        if (!res.ok) {
          isCreatingRef.current = false;
          console.error("Agent creation failed:", data);
          throw new Error(data.message || `Failed to create draft (HTTP ${res.status})`);
        }
        if (!data.data?.id) {
          isCreatingRef.current = false;
          throw new Error("Draft created but no agent id returned");
        }
        const newId = data.data.id;
        setAgentId(newId);
        isCreatingRef.current = false;
        
        // Push the new ID to the URL to make it persistent on refresh
        router.push(`/agents/${newId}/edit`);
      } else {
        // Update PUT
        const res = await fetch(`${API_BASE}/agents/${agentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await readApiBody<any>(res);
        if (!res.ok) {
          console.error("Agent update failed:", data);
          throw new Error(data.message || `Failed to auto-save (HTTP ${res.status})`);
        }
      }
      setAutoSaveStatus("saved");
      return true;
    } catch (e: any) {
      console.error(e);
      setAutoSaveStatus("error");
      setError(e.message || "Auto-save failed");
      return false;
    }
  };

  // Debounce the system prompt text-area typing
  const debouncedAutoSave = (overrides: any = {}) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      triggerAutoSave(overrides);
    }, 1500); // Wait 1.5 seconds after typing stops
  };

  const handleTemplateSelect = (t: (typeof PERSONA_TEMPLATES)[0]) => {
    setSelectedTemplate(t.id);
    if (t.prompt) {
      setSystemPrompt(t.prompt);
      debouncedAutoSave({ systemPrompt: t.prompt });
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setAnimatingVoice(voiceId);
    setSelectedVoice(voiceId);
    setIsVoiceDropdownOpen(false);
    setTimeout(() => setAnimatingVoice(null), 800);
    triggerAutoSave({ selectedVoice: voiceId });
  };

  const playVoiceSample = (voiceId: string) => {
    // If clicking the same voice that's already playing, stop it
    if (isPlayingSample === voiceId) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
      setIsPlayingSample(null);
      return;
    }

    // Stop any existing audio
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current = null;
    }

    setIsPlayingSample(voiceId);
    
    // Capitalize first letter to match PascalCase filenames (e.g. Aoede.wav)
    const capitalizedId = voiceId.charAt(0).toUpperCase() + voiceId.slice(1);
    
    // Create new audio object
    const audio = new Audio(`/assets/audio/samples/${capitalizedId}.wav`);
    sampleAudioRef.current = audio;
    
    audio.play().catch(err => {
      console.error("Failed to play voice sample:", err);
      setIsPlayingSample(null);
    });

    audio.onended = () => {
      setIsPlayingSample(null);
      sampleAudioRef.current = null;
    };
  };

  const handleStep1Continue = () => {
    if (!name.trim()) {
      setError("Enter an agent name first.");
      return;
    }
    setError("");
    setActiveStep(2);
    // Force an initial save if moving to step 2 for the first time
    if (!agentId) {
      triggerAutoSave();
    }
  };

  const handleStep2Continue = () => {
    setActiveStep(3);
  };

  const handleLaunch = () => {
    if (!name.trim()) {
      setError("Please give your agent a name.");
      setActiveStep(1);
      return;
    }
    if (!systemPrompt.trim()) {
      setError("Please define a system prompt (persona).");
      setActiveStep(2);
      return;
    }
    setSaving(true);
    triggerAutoSave().then((ok) => {
      if (ok) {
        router.push("/dashboard");
      } else {
        setSaving(false);
      }
    });
  };

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      setError("Please give your agent a name before saving.");
      setActiveStep(1);
      return;
    }

    setError("");
    setSavingDraft(true);
    const ok = await triggerAutoSave();
    if (!ok) {
      setError("Could not save right now. Please try again.");
    }
    setSavingDraft(false);
  };

  const isStepComplete = (step: number) => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return systemPrompt.trim().length > 0;
    return true;
  };

  useEffect(() => {
    return () => {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <DashboardShell>
      <div className="min-h-full bg-[#05080f] px-6 py-8">
        <style>{`
          @keyframes waveBar {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .wave-bar { animation: waveBar 1s ease-in-out infinite; }
          .fade-slide-up { animation: fadeSlideUp 0.35s ease forwards; }
          .shimmer-text {
            background: linear-gradient(90deg, #14b8a6, #6366f1, #14b8a6);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s linear infinite;
          }
          .glass-card {
            background: rgba(14,18,29,0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.06);
          }
          .step-connector { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
          .step-connector.active { background: rgba(20,184,166,0.4); }
        `}</style>

        {/* Header */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 fade-slide-up flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-[rgba(240,244,250,0.4)] hover:text-[rgba(240,244,250,0.8)] text-sm mb-5 transition group"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="group-hover:-translate-x-0.5 transition-transform"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Agents
              </Link>

              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                {isEditing ? "Edit Voice Agent" : "Build Your Voice Agent"}
              </h1>
              <p className="text-[rgba(240,244,250,0.45)] text-sm flex items-center gap-3">
                Configure your AI agent&apos;s identity, persona, and voice in minutes
                {autoSaveStatus === "saving" && (
                  <span className="text-[#14b8a6] text-xs">Saving...</span>
                )}
                {autoSaveStatus === "saved" && <span className="text-white/30 text-xs">Saved</span>}
                {autoSaveStatus === "error" && (
                  <span className="text-red-400 text-xs">Save failed</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleSaveDraft}
                suppressHydrationWarning
                disabled={savingDraft || saving || !name.trim()}
                className="px-3 py-2 rounded-xl border border-[#14b8a6]/35 bg-[#14b8a6]/10 text-[#2dd4bf] text-xs font-semibold hover:bg-[#14b8a6]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingDraft ? "Saving..." : "Save Draft"}
              </button>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[rgba(240,244,250,0.5)] text-xs">Gemini 2.0 Flash</span>
              </div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-0 mb-8">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="flex items-center"
                style={{ flex: i < steps.length - 1 ? "1 1 auto" : "0 0 auto" }}
              >
                <button
                  onClick={() => setActiveStep(step.n)}
                  suppressHydrationWarning
                  className="flex items-center gap-2.5 group shrink-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      activeStep === step.n
                        ? "bg-[#14b8a6] text-white shadow-[0_0_16px_rgba(20,184,166,0.4)]"
                        : isStepComplete(step.n)
                          ? "bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30"
                          : "bg-white/[0.06] text-[rgba(240,244,250,0.3)] border border-white/[0.08]"
                    }`}
                  >
                    {isStepComplete(step.n) && activeStep !== step.n ? (
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      step.n
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition ${activeStep === step.n ? "text-white" : "text-[rgba(240,244,250,0.35)] group-hover:text-[rgba(240,244,250,0.6)]"}`}
                  >
                    {step.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div
                    className={`step-connector mx-4 ${isStepComplete(step.n) ? "active" : ""}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Form */}
            <div className="lg:col-span-3 space-y-4">
              {/* Step 1: Identity */}
              <AgentIdentitySection
                name={name}
                setNameAction={setName}
                agentType={agentType}
                setAgentTypeAction={(type) => setAgentType(type as AgentType)}
                debouncedAutoSaveAction={debouncedAutoSave}
                triggerAutoSaveAction={triggerAutoSave}
                isActive={activeStep === 1}
                onActivateAction={() => setActiveStep(1)}
                isStepCompleteAction={isStepComplete}
                phoneNumber={phoneNumber}
                setPhoneNumberAction={setPhoneNumber}
                handleStep1ContinueAction={handleStep1Continue}
              />

              {/* Step 2: Persona */}
              <AgentPersonaSection
                systemPrompt={systemPrompt}
                setSystemPromptAction={setSystemPrompt}
                selectedTemplate={selectedTemplate}
                handleTemplateSelectAction={handleTemplateSelect}
                debouncedAutoSaveAction={debouncedAutoSave}
                isActive={activeStep === 2}
                onActivateAction={() => setActiveStep(2)}
                isStepCompleteAction={isStepComplete}
                handleStep2ContinueAction={handleStep2Continue}
                maxChars={maxChars}
              />

              {/* Step 3: Widget (only for Widget type) */}
              <AgentWidgetSection 
                agentType={agentType}
                agentId={agentId || ""}
                widgetPosition={widgetPosition}
                setWidgetPositionAction={setWidgetPosition}
                widgetPrimaryColor={widgetPrimaryColor}
                setWidgetPrimaryColorAction={setWidgetPrimaryColor}
                widgetIsVisible={widgetIsVisible}
                setWidgetIsVisibleAction={setWidgetIsVisible}
                widgetDefaultOpen={widgetDefaultOpen}
                setWidgetDefaultOpenAction={setWidgetDefaultOpen}
                triggerAutoSaveAction={triggerAutoSave}
                isActive={activeStep === 3}
                onActivateAction={() => setActiveStep(3)}
                isStepCompleteAction={isStepComplete}
              />


              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm fade-slide-up">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Launch Button */}
              <button
                onClick={handleLaunch}
                suppressHydrationWarning
                disabled={saving || !name.trim() || !systemPrompt.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group mt-4"
                style={{
                  background:
                    !name.trim() || !systemPrompt.trim()
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%)",
                  boxShadow:
                    !name.trim() || !systemPrompt.trim()
                      ? "none"
                      : "0 4px 24px rgba(20,184,166,0.3)",
                }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {isEditing ? "Save & Close" : "Launch Agent"}
                  </>
                )}
              </button>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-0">
                <VoiceAgentWidget 
                  agentId={(agentId as string) || "save-to-generate"}
                  agentType={agentType}
                  initialData={{
                    name,
                    systemPrompt,
                    voiceId: selectedVoice,
                    voiceGender,
                    avatarUrl,
                    widgetPrimaryColor
                  }}
                />

                {/* Tips Card */}
                <div className="mt-4 glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <span className="text-xs font-semibold text-[#14b8a6]">Pro Tips</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Be specific about tone and personality",
                      "Define what NOT to do, not just what to do",
                      "Include escalation instructions",
                    ].map((tip, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-[rgba(240,244,250,0.35)] flex items-start gap-2"
                      >
                        <span className="text-[#14b8a6]/50 mt-0.5 shrink-0">›</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
