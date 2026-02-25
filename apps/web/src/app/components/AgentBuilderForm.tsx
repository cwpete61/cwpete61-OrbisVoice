"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { API_BASE } from "@/lib/api";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioRecorder, AudioPlayer } from "@/lib/audio-utils";

const VOICE_MODELS = [
    {
        id: "default",
        name: "Neural Natural",
        description: "Warm, conversational tone for general use",
        badge: "Recommended",
        waveform: [3, 5, 8, 6, 9, 7, 5, 8, 6, 4, 7, 9, 5, 7, 6],
        color: "#14b8a6",
    },
    {
        id: "professional",
        name: "Executive",
        description: "Crisp, authoritative voice for business contexts",
        badge: "Popular",
        waveform: [4, 6, 5, 8, 6, 7, 9, 5, 6, 8, 5, 4, 7, 6, 8],
        color: "#6366f1",
    },
    {
        id: "friendly",
        name: "Friendly Guide",
        description: "Upbeat, approachable tone for customer support",
        badge: null,
        waveform: [5, 7, 9, 6, 8, 5, 7, 9, 6, 8, 5, 7, 4, 6, 8],
        color: "#f59e0b",
    },
    {
        id: "concise",
        name: "Swift Assist",
        description: "Fast, direct responses for high-volume use cases",
        badge: null,
        waveform: [8, 5, 6, 9, 4, 7, 5, 8, 6, 3, 9, 6, 7, 5, 8],
        color: "#ec4899",
    },
];

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

export interface AgentData {
    id?: string;
    name: string;
    systemPrompt: string;
    voiceId: string;
}

export default function AgentBuilderForm({
    initialData,
    isEditing = false
}: {
    initialData?: AgentData,
    isEditing?: boolean
}) {
    const router = useRouter();

    // Form State
    const [agentId, setAgentId] = useState<string | undefined>(initialData?.id);
    const [name, setName] = useState(initialData?.name || "");
    const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || "");
    const [selectedVoice, setSelectedVoice] = useState(initialData?.voiceId || "default");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(isEditing ? 1 : 1);
    const [saving, setSaving] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error" | "">("");
    const [error, setError] = useState("");
    const [animatingVoice, setAnimatingVoice] = useState<string | null>(null);

    // Audio Streaming State
    const [isTalking, setIsTalking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState("");

    // Audio Streaming Refs
    const sessionRef = useRef<any>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const playerRef = useRef<AudioPlayer | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const maxChars = 2000;
    const voiceModel = VOICE_MODELS.find((v) => v.id === selectedVoice) || VOICE_MODELS[0];

    const steps = [
        { n: 1, label: "Identity" },
        { n: 2, label: "Persona" },
        { n: 3, label: "Voice" },
    ];

    // Background auto-save triggered when inputs change
    const triggerAutoSave = async (currentName: string, prompt: string, voice: string) => {
        if (!currentName.trim()) return; // Name is required to save

        setAutoSaveStatus("saving");
        try {
            const token = localStorage.getItem("token");
            if (!agentId) {
                // Initial POST
                const res = await fetch(`${API_BASE}/agents`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: currentName, systemPrompt: prompt, voiceModel: voice }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to create draft");
                setAgentId(data.agent.id);
            } else {
                // Update PUT
                const res = await fetch(`${API_BASE}/agents/${agentId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: currentName, systemPrompt: prompt, voiceId: voice }),
                });
                if (!res.ok) throw new Error("Failed to auto-save");
            }
            setAutoSaveStatus("saved");
        } catch (e: any) {
            console.error(e);
            setAutoSaveStatus("error");
            setError(e.message || "Auto-save failed");
        }
    };

    // Debounce the system prompt text-area typing
    const debouncedAutoSave = (nameVal: string, promptVal: string, voiceVal: string) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            triggerAutoSave(nameVal, promptVal, voiceVal);
        }, 1500); // Wait 1.5 seconds after typing stops
    };

    const handleTemplateSelect = (t: typeof PERSONA_TEMPLATES[0]) => {
        setSelectedTemplate(t.id);
        if (t.prompt) {
            setSystemPrompt(t.prompt);
            debouncedAutoSave(name, t.prompt, selectedVoice);
        }
    };

    const handleVoiceSelect = (voiceId: string) => {
        setAnimatingVoice(voiceId);
        setSelectedVoice(voiceId);
        setTimeout(() => setAnimatingVoice(null), 800);
        triggerAutoSave(name, systemPrompt, voiceId); // Save immediately on voice click
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
            triggerAutoSave(name, systemPrompt, selectedVoice);
        }
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
        // Ensure final save then redirect
        triggerAutoSave(name, systemPrompt, selectedVoice).then(() => {
            router.push("/dashboard");
        });
    };

    const isStepComplete = (step: number) => {
        if (step === 1) return name.trim().length > 0;
        if (step === 2) return systemPrompt.trim().length > 0;
        return true;
    };

    const stopTalking = () => {
        setIsTalking(false);
        setIsConnecting(false);

        if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
        }
        if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current = null;
        }
        if (sessionRef.current) {
            try {
                sessionRef.current.close();
            } catch (e) {
                console.warn("Error closing session", e);
            }
            sessionRef.current = null;
        }
    };

    const startTalking = async () => {
        if (!agentId) {
            setConnectionError("Please save the agent first.");
            return;
        }

        setConnectionError("");
        setIsConnecting(true);

        try {
            // 1. Fetch Gemini info
            const token = localStorage.getItem("token") || "";
            let apiKey = "";
            try {
                const res = await fetch(`${API_BASE}/settings/google-config?include_secrets=true`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok && data.data) {
                        apiKey = data.data.geminiApiKey;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch Google config", e);
            }

            if (!apiKey) {
                setConnectionError("Gemini API Key is missing. Please configure it in System Settings.");
                setIsConnecting(false);
                return;
            }

            // 2. Init API and Player
            const ai = new GoogleGenAI({ apiKey });
            playerRef.current = new AudioPlayer();
            await playerRef.current.init();

            // 3. Connect to Gemini Live
            // Map our UI voice selection to Gemini voice names
            const voiceMapping: Record<string, string> = {
                "zephyr": "Zephyr",
                "alloy": "Alloy",
                "echo": "Echo",
                "shimmer": "Shimmer",
            };
            const geminiVoice = voiceMapping[selectedVoice] || "Zephyr";

            const session = await ai.live.connect({
                model: "gemini-2.5-flash-native-audio-preview-09-2025",
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } },
                    },
                    systemInstruction: {
                        parts: [{ text: `You are ${name}. ${systemPrompt}` }]
                    },
                },
                callbacks: {
                    onopen: async () => {
                        console.log("Connected to Gemini Live");
                        setIsConnecting(false);
                        setIsTalking(true);

                        // 4. Start Recording and Streaming
                        recorderRef.current = new AudioRecorder(
                            (data: ArrayBuffer) => {
                                const base64Data = Buffer.from(data).toString('base64');
                                if (sessionRef.current) {
                                    sessionRef.current.sendRealtimeInput({
                                        media: {
                                            mimeType: "audio/pcm;rate=16000",
                                            data: base64Data
                                        }
                                    });
                                }
                            }
                        );
                        await recorderRef.current.start();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const audioData = Buffer.from(base64Audio, 'base64');
                            playerRef.current?.play(audioData.buffer);
                        }

                        if (message.serverContent?.interrupted) {
                            console.log("Gemini Interrupted");
                            playerRef.current?.stop();
                            playerRef.current = new AudioPlayer();
                            await playerRef.current.init();
                        }
                    },
                    onclose: () => {
                        console.log("Gemini Live session closed");
                        stopTalking();
                    },
                    onerror: (err: any) => {
                        console.error("Gemini session error:", err);
                        setConnectionError("Voice session error: " + err.message);
                        stopTalking();
                    }
                }
            });

            sessionRef.current = session;

        } catch (err: any) {
            console.error("Voice preparation error:", err);
            setConnectionError(err.message || "Failed to start conversation.");
            stopTalking();
        }
    };

    useEffect(() => {
        return () => {
            stopTalking();
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
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-[rgba(240,244,250,0.4)] hover:text-[rgba(240,244,250,0.8)] text-sm mb-5 transition group"
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:-translate-x-0.5 transition-transform">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back to Agents
                            </button>

                            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                {isEditing ? "Edit Voice Agent" : "Build Your Voice Agent"}
                            </h1>
                            <p className="text-[rgba(240,244,250,0.45)] text-sm flex items-center gap-3">
                                Configure your AI agent's identity, persona, and voice in minutes
                                {autoSaveStatus === "saving" && <span className="text-[#14b8a6] text-xs">Saving...</span>}
                                {autoSaveStatus === "saved" && <span className="text-white/30 text-xs">Saved</span>}
                                {autoSaveStatus === "error" && <span className="text-red-400 text-xs">Save failed</span>}
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl glass-card self-start sm:self-auto">
                            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[rgba(240,244,250,0.5)] text-xs">Gemini 2.5 Flash</span>
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-0 mb-8">
                        {steps.map((step, i) => (
                            <div key={step.n} className="flex items-center" style={{ flex: i < steps.length - 1 ? "1 1 auto" : "0 0 auto" }}>
                                <button
                                    onClick={() => setActiveStep(step.n)}
                                    className="flex items-center gap-2.5 group shrink-0"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${activeStep === step.n
                                        ? "bg-[#14b8a6] text-white shadow-[0_0_16px_rgba(20,184,166,0.4)]"
                                        : isStepComplete(step.n)
                                            ? "bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30"
                                            : "bg-white/[0.06] text-[rgba(240,244,250,0.3)] border border-white/[0.08]"
                                        }`}>
                                        {isStepComplete(step.n) && activeStep !== step.n ? (
                                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        ) : step.n}
                                    </div>
                                    <span className={`text-sm font-medium transition ${activeStep === step.n ? "text-white" : "text-[rgba(240,244,250,0.35)] group-hover:text-[rgba(240,244,250,0.6)]"}`}>
                                        {step.label}
                                    </span>
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`step-connector mx-4 ${isStepComplete(step.n) ? "active" : ""}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Two-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left: Form */}
                        <div className="lg:col-span-3 space-y-4">

                            {/* Step 1: Identity */}
                            <div className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${activeStep === 1 ? "ring-1 ring-[#14b8a6]/30" : ""}`}>
                                <button
                                    onClick={() => setActiveStep(1)}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${activeStep === 1 ? "bg-[#14b8a6] text-white" : isStepComplete(1) ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
                                        }`}>1</div>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-white">Agent Identity</div>
                                        <div className="text-xs text-[rgba(240,244,250,0.35)]">Name and basic information</div>
                                    </div>
                                    {name && <div className="ml-auto text-xs text-[#14b8a6] font-medium truncate max-w-[120px]">{name}</div>}
                                </button>

                                {activeStep === 1 && (
                                    <div className="px-6 pb-6 fade-slide-up">
                                        <div className="border-t border-white/[0.05] pt-5">
                                            <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-2">
                                                Agent Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (agentId) debouncedAutoSave(e.target.value, systemPrompt, selectedVoice);
                                                }}
                                                placeholder="e.g., Sales Pro, Support Ally, Booking Bot..."
                                                className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-[rgba(240,244,250,0.2)] focus:outline-none focus:border-[#14b8a6]/50 focus:ring-1 focus:ring-[#14b8a6]/20 transition text-sm"
                                                autoFocus
                                            />
                                            <p className="mt-2 text-[10px] text-[rgba(240,244,250,0.25)]">
                                                Your customers will hear this name when interacting with the agent
                                            </p>

                                            <button
                                                onClick={handleStep1Continue}
                                                className="mt-5 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm"
                                            >
                                                Continue to Persona →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Persona */}
                            <div className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${activeStep === 2 ? "ring-1 ring-[#14b8a6]/30" : ""}`}>
                                <button
                                    onClick={() => setActiveStep(2)}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${activeStep === 2 ? "bg-[#14b8a6] text-white" : isStepComplete(2) ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
                                        }`}>2</div>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-white">Persona & Behavior</div>
                                        <div className="text-xs text-[rgba(240,244,250,0.35)]">Define how your agent thinks and responds</div>
                                    </div>
                                    {isStepComplete(2) && activeStep !== 2 && (
                                        <div className="ml-auto text-xs text-[#14b8a6] font-medium">Configured</div>
                                    )}
                                </button>

                                {activeStep === 2 && (
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
                                                        onClick={() => handleTemplateSelect(t)}
                                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all duration-200 ${selectedTemplate === t.id
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
                                                    setSystemPrompt(e.target.value.slice(0, maxChars));
                                                    debouncedAutoSave(name, e.target.value.slice(0, maxChars), selectedVoice);
                                                }}
                                                placeholder="Define how your agent should behave, its tone, goals, and how it should handle different scenarios..."
                                                rows={7}
                                                className="w-full bg-[#0a0e1a] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-[rgba(240,244,250,0.2)] focus:outline-none focus:border-[#14b8a6]/50 focus:ring-1 focus:ring-[#14b8a6]/20 transition text-sm resize-none leading-relaxed"
                                            />
                                            <div className="flex justify-between mt-1.5 mb-5">
                                                <span className="text-[10px] text-[rgba(240,244,250,0.25)]">Be specific about goals, tone, and constraints</span>
                                                <span className={`text-[10px] font-mono ${systemPrompt.length > maxChars * 0.9 ? "text-orange-400" : "text-[rgba(240,244,250,0.25)]"}`}>
                                                    {systemPrompt.length}/{maxChars}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => { if (systemPrompt.trim()) setActiveStep(3); else setError("Add a system prompt first."); }}
                                                className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm"
                                            >
                                                Continue to Voice →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 3: Voice */}
                            <div className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${activeStep === 3 ? "ring-1 ring-[#14b8a6]/30" : ""}`}>
                                <button
                                    onClick={() => setActiveStep(3)}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${activeStep === 3 ? "bg-[#14b8a6] text-white" : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
                                        }`}>3</div>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-white">Voice & Style</div>
                                        <div className="text-xs text-[rgba(240,244,250,0.35)]">Choose how your agent sounds</div>
                                    </div>
                                    {activeStep !== 3 && (
                                        <div className="ml-auto text-xs text-[rgba(240,244,250,0.35)]">{voiceModel.name}</div>
                                    )}
                                </button>

                                {activeStep === 3 && (
                                    <div className="px-6 pb-6 fade-slide-up">
                                        <div className="border-t border-white/[0.05] pt-5">
                                            <label className="block text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider mb-3">
                                                Voice Model
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {VOICE_MODELS.map((voice) => (
                                                    <button
                                                        key={voice.id}
                                                        onClick={() => handleVoiceSelect(voice.id)}
                                                        className={`relative p-4 rounded-xl text-left transition-all duration-300 group ${selectedVoice === voice.id
                                                            ? "border-2 bg-opacity-10"
                                                            : "border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]"
                                                            }`}
                                                        style={selectedVoice === voice.id ? {
                                                            borderColor: voice.color,
                                                            background: `${voice.color}12`,
                                                            boxShadow: `0 0 20px ${voice.color}18`,
                                                        } : {}}
                                                    >
                                                        {voice.badge && (
                                                            <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                                                style={{ background: `${voice.color}25`, color: voice.color }}>
                                                                {voice.badge}
                                                            </span>
                                                        )}
                                                        {/* Waveform */}
                                                        <div className="flex items-center gap-0.5 h-8 mb-3">
                                                            {voice.waveform.map((h, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`w-1 rounded-full flex-shrink-0 ${animatingVoice === voice.id || selectedVoice === voice.id ? "wave-bar" : ""}`}
                                                                    style={{
                                                                        height: `${h * 3}px`,
                                                                        backgroundColor: selectedVoice === voice.id ? voice.color : "rgba(240,244,250,0.15)",
                                                                        animationDelay: `${i * 0.07}s`,
                                                                        animationPlayState: selectedVoice === voice.id ? "running" : "paused",
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="text-sm font-semibold text-white mb-0.5">{voice.name}</div>
                                                        <div className="text-[11px] text-[rgba(240,244,250,0.4)] leading-relaxed">{voice.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm fade-slide-up">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Launch Button */}
                            <button
                                onClick={handleLaunch}
                                disabled={saving || !name.trim() || !systemPrompt.trim()}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group mt-4"
                                style={{
                                    background: (!name.trim() || !systemPrompt.trim()) ? "rgba(255,255,255,0.05)" :
                                        "linear-gradient(135deg, #14b8a6 0%, #0891b2 50%, #6366f1 100%)",
                                    boxShadow: (!name.trim() || !systemPrompt.trim()) ? "none" : "0 4px 24px rgba(20,184,166,0.3)",
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
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                                <div className="glass-card rounded-2xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: voiceModel.color }} />
                                            <span className="text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider">Live Preview</span>
                                        </div>
                                        <span className="text-[10px] text-[rgba(240,244,250,0.2)] font-mono">v0.1-draft</span>
                                    </div>

                                    {/* Agent Card */}
                                    <div className="p-5">
                                        {/* Avatar + Name */}
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                                                    style={{ background: `linear-gradient(135deg, ${voiceModel.color}30, ${voiceModel.color}10)`, border: `1px solid ${voiceModel.color}30` }}>
                                                    {name.trim() ? name.trim()[0].toUpperCase() : "?"}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                                    style={{ background: voiceModel.color }}>
                                                    <svg width="8" height="8" fill="white" viewBox="0 0 24 24">
                                                        <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
                                                        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-tight">
                                                    {name.trim() || <span className="text-[rgba(240,244,250,0.2)] font-normal">Agent Name</span>}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                        style={{ background: `${voiceModel.color}20`, color: voiceModel.color }}>
                                                        {voiceModel.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Waveform Preview */}
                                        <div className="flex items-center justify-center gap-1 h-12 mb-5 rounded-xl"
                                            style={{ background: `${voiceModel.color}08`, border: `1px solid ${voiceModel.color}15` }}>
                                            {voiceModel.waveform.map((h, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1 rounded-full ${isTalking ? "wave-bar" : ""}`}
                                                    style={{
                                                        height: `${h * 3.5}px`,
                                                        backgroundColor: voiceModel.color,
                                                        opacity: isTalking ? 1 : 0.4,
                                                        animationDelay: `${i * 0.07}s`,
                                                        animationPlayState: isTalking ? "running" : "paused",
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Talk Button Action */}
                                        <div className="mb-5 flex flex-col items-center">
                                            {isTalking ? (
                                                <button
                                                    onClick={stopTalking}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-colors"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                    Stop Talking
                                                </button>
                                            ) : isConnecting ? (
                                                <button
                                                    disabled
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-white/10 border border-white/20 transition-colors opacity-70 cursor-wait"
                                                >
                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Connecting...
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={startTalking}
                                                    disabled={!systemPrompt.trim() || !agentId}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
                                                    style={{
                                                        background: (!systemPrompt.trim() || !agentId) ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${voiceModel.color} 0%, ${voiceModel.color}bb 100%)`,
                                                    }}
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                    </svg>
                                                    Talk
                                                </button>
                                            )}

                                            {connectionError && (
                                                <div className="text-red-400 text-xs mt-2 text-center bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                                                    {connectionError}
                                                </div>
                                            )}
                                        </div>

                                        {/* Prompt Preview */}
                                        <div className="mb-5">
                                            <div className="text-[10px] font-semibold text-[rgba(240,244,250,0.3)] uppercase tracking-widest mb-2">Persona</div>
                                            <div className="text-xs text-[rgba(240,244,250,0.5)] leading-relaxed bg-white/[0.02] rounded-xl p-3 border border-white/[0.05] min-h-[60px] max-h-[100px] overflow-hidden relative">
                                                {systemPrompt.trim() ? (
                                                    <>
                                                        {systemPrompt.slice(0, 180)}
                                                        {systemPrompt.length > 180 && <span className="text-[rgba(240,244,250,0.2)]">...</span>}
                                                    </>
                                                ) : (
                                                    <span className="text-[rgba(240,244,250,0.15)] italic">Persona will appear here...</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Capabilities */}
                                        <div>
                                            <div className="text-[10px] font-semibold text-[rgba(240,244,250,0.3)] uppercase tracking-widest mb-2">Capabilities</div>
                                            <div className="flex flex-wrap gap-2">
                                                {["Voice AI", "Real-time", "Gemini 2.5"].map((cap) => (
                                                    <span key={cap} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] text-[rgba(240,244,250,0.4)] border border-white/[0.06]">
                                                        {cap}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ready Status */}
                                    <div className="px-5 py-3 border-t border-white/[0.05] flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full transition-colors ${name.trim() && systemPrompt.trim() ? "bg-green-400 animate-pulse" : "bg-[rgba(240,244,250,0.15)]"}`} />
                                        <span className="text-[10px] text-[rgba(240,244,250,0.3)]">
                                            {name.trim() && systemPrompt.trim() ? "Ready to launch" : "Fill in the details to continue"}
                                        </span>
                                    </div>
                                </div>

                                {/* Tips Card */}
                                <div className="mt-4 glass-card rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg width="14" height="14" fill="none" stroke="#14b8a6" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                                        </svg>
                                        <span className="text-xs font-semibold text-[#14b8a6]">Pro Tips</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {[
                                            "Be specific about tone and personality",
                                            "Define what NOT to do, not just what to do",
                                            "Include escalation instructions",
                                        ].map((tip, i) => (
                                            <li key={i} className="text-[11px] text-[rgba(240,244,250,0.35)] flex items-start gap-2">
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
