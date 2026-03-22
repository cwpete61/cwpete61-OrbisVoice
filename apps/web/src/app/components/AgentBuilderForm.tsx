"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import Link from "next/link";
import { VOICE_GATEWAY_URL, API_BASE } from "@/lib/api";
import { readApiBody } from "@/lib/response-utils";
import { AudioRecorder, AudioPlayer } from "@/lib/audio-utils";
import { arrayBufferToBase64, base64ToArrayBuffer } from "@/lib/base64-utils";

const VOICE_MODELS = [
  {
    id: "aoede",
    name: "Aoede",
    description: "Clear and rhythmic female voice, perfect for storytelling",
    badge: "Versatile",
    waveform: [4, 8, 3, 9, 5, 7, 4, 8, 6, 9, 3, 7, 5, 8, 4],
    color: "#14b8a6",
    gender: "FEMALE",
  },
  {
    id: "autonoe",
    name: "Autonoe",
    description: "Precise and crystalline female voice for technical clarity",
    badge: "Clear",
    waveform: [5, 4, 7, 3, 8, 4, 6, 5, 8, 4, 7, 3, 5, 4, 6],
    color: "#0d9488",
    gender: "FEMALE",
  },
  {
    id: "callirrhoe",
    name: "Callirrhoe",
    description: "Flowing and melodic female voice, ideal for creative work",
    badge: "Creative",
    waveform: [3, 6, 9, 4, 7, 3, 6, 9, 4, 7, 3, 6, 9, 4, 7],
    color: "#ec4899",
    gender: "FEMALE",
  },
  {
    id: "kore",
    name: "Kore",
    description: "Calm and professional female voice for business assistants",
    badge: "Balanced",
    waveform: [3, 5, 4, 6, 3, 5, 4, 6, 3, 5, 4, 6, 3, 5, 4],
    color: "#6366f1",
    gender: "FEMALE",
  },
  {
    id: "leda",
    name: "Leda",
    description: "Authoritative yet kind female voice for leadership",
    badge: "Authority",
    waveform: [2, 8, 4, 7, 3, 9, 4, 6, 2, 8, 5, 7, 3, 9, 4],
    color: "#8b5cf6",
    gender: "FEMALE",
  },
  {
    id: "zephyr",
    name: "Zephyr",
    description: "Soft and airy female voice for wellness and meditation",
    badge: "Breezy",
    waveform: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    color: "#06b6d4",
    gender: "FEMALE",
  },
  {
    id: "charon",
    name: "Charon",
    description: "Deep and resonant male voice for an authoritative presence",
    badge: "Premium",
    waveform: [8, 9, 7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 8, 9, 7],
    color: "#3b82f6",
    gender: "MALE",
  },
  {
    id: "enceladus",
    name: "Enceladus",
    description: "Giant and booming male voice for maximum impact",
    badge: "Powerful",
    waveform: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    color: "#f97316",
    gender: "MALE",
  },
  {
    id: "fenrir",
    name: "Fenrir",
    description: "Strong and energetic male voice with bold personality",
    badge: "Dynamic",
    waveform: [9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9, 3, 9],
    color: "#ef4444",
    gender: "MALE",
  },
  {
    id: "lapetus",
    name: "Lapetus",
    description: "Steady and ancient male voice full of wisdom",
    badge: "Wise",
    waveform: [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
    color: "#71717a",
    gender: "MALE",
  },
  {
    id: "orus",
    name: "Orus",
    description: "Crisp and modern male voice for tech support",
    badge: "Modern",
    waveform: [6, 2, 8, 3, 7, 2, 6, 4, 8, 3, 7, 2, 6, 4, 8],
    color: "#f59e0b",
    gender: "MALE",
  },
  {
    id: "puck",
    name: "Puck",
    description: "Youthful and upbeat male voice for casual contexts",
    badge: "Friendly",
    waveform: [6, 4, 8, 5, 7, 4, 6, 5, 8, 4, 7, 5, 6, 4, 8],
    color: "#10b981",
    gender: "MALE",
  },
  {
    id: "umbriel",
    name: "Umbriel",
    description: "Subtle and sophisticated male voice for high-end hospitality",
    badge: "Elite",
    waveform: [4, 5, 6, 5, 4, 5, 6, 5, 4, 5, 6, 5, 4, 5, 6],
    color: "#64748b",
    gender: "MALE",
  },
];

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

const AVATARS = [
  { id: "male1", url: "/avatars/male1.png", gender: "MALE" },
  { id: "male2", url: "/avatars/male2.png", gender: "MALE" },
  { id: "male3", url: "/avatars/male3.png", gender: "MALE" },
  { id: "male4", url: "/avatars/male4.png", gender: "MALE" },
  { id: "male5", url: "/avatars/male5.png", gender: "MALE" },
  { id: "male6", url: "/avatars/male6.png", gender: "MALE" },
  { id: "male7", url: "/avatars/male7.png", gender: "MALE" },
  { id: "male8", url: "/avatars/male8.png", gender: "MALE" },
  { id: "female1", url: "/avatars/female1.png", gender: "FEMALE" },
  { id: "female2", url: "/avatars/female2.png", gender: "FEMALE" },
  { id: "female3", url: "/avatars/female3.png", gender: "FEMALE" },
  { id: "female4", url: "/avatars/female4.png", gender: "FEMALE" },
  { id: "female5", url: "/avatars/female5.png", gender: "FEMALE" },
  { id: "female6", url: "/avatars/female6.png", gender: "FEMALE" },
  { id: "female7", url: "/avatars/female7.png", gender: "FEMALE" },
  { id: "female8", url: "/avatars/female8.png", gender: "FEMALE" },
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
  type?: "WIDGET" | "INBOUND_TWILIO" | "OUTBOUND_TWILIO";
  voiceGender?: "MALE" | "FEMALE";
  avatarUrl?: string | null;
  autoStart?: boolean;
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
  const [agentType, setAgentType] = useState<"WIDGET" | "INBOUND_TWILIO" | "OUTBOUND_TWILIO">(initialData?.type || "WIDGET");
  const [voiceGender, setVoiceGender] = useState<"MALE" | "FEMALE">(initialData?.voiceGender || "FEMALE");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatarUrl || (initialData?.voiceGender === "MALE" ? "/avatars/male1.png" : "/avatars/female1.png"));
  const [autoStart, setAutoStart] = useState<boolean>(initialData?.autoStart ?? true);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const isCreatingRef = useRef(false);
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
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const maxChars = 2000;
  const voiceModel = VOICE_MODELS.find((v) => v.id === selectedVoice) || VOICE_MODELS[0];

  const steps = [
    { n: 1, label: "Identity" },
    { n: 2, label: "Persona" },
  ];

  // Background auto-save triggered when inputs change
  const triggerAutoSave = async (
    currentName: string,
    prompt: string,
    voice: string,
    type: string,
    gender: string,
    avatar: string | null,
    autostart: boolean
  ): Promise<boolean> => {
    if (!currentName.trim()) return false; // Name is required to save

    setAutoSaveStatus("saving");
    try {
      const token = localStorage.getItem("token");
      const payload = { 
        name: currentName, 
        systemPrompt: prompt, 
        voiceModel: voice,
        type: type,
        voiceGender: gender,
        avatarUrl: avatar,
        autoStart: autostart
      };
      
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
  const debouncedAutoSave = (nameVal: string, promptVal: string, voiceVal: string, typeVal: string, genderVal: string, avatarVal: string | null, autostartVal: boolean) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      triggerAutoSave(nameVal, promptVal, voiceVal, typeVal, genderVal, avatarVal, autostartVal);
    }, 1500); // Wait 1.5 seconds after typing stops
  };

  const handleTemplateSelect = (t: (typeof PERSONA_TEMPLATES)[0]) => {
    setSelectedTemplate(t.id);
    if (t.prompt) {
      setSystemPrompt(t.prompt);
      debouncedAutoSave(name, t.prompt, selectedVoice, agentType, voiceGender, avatarUrl, autoStart);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setAnimatingVoice(voiceId);
    setSelectedVoice(voiceId);
    setIsVoiceDropdownOpen(false);
    setTimeout(() => setAnimatingVoice(null), 800);
    triggerAutoSave(name, systemPrompt, voiceId, agentType, voiceGender, avatarUrl, autoStart);
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
      triggerAutoSave(name, systemPrompt, selectedVoice, agentType, voiceGender, avatarUrl, autoStart);
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
    triggerAutoSave(name, systemPrompt, selectedVoice, agentType, voiceGender, avatarUrl, autoStart).then((ok) => {
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
    const ok = await triggerAutoSave(name, systemPrompt, selectedVoice, agentType, voiceGender, avatarUrl, autoStart);
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

    setIsTalking(false);
    setIsConnecting(false);
  };

  const startTalking = async () => {
    if (!agentId) {
      setConnectionError("Please save the agent first.");
      return;
    }

    setConnectionError("");
    setIsConnecting(true);

    try {
      const token = localStorage.getItem("token") || "";

      // 1. Initialize Player
      playerRef.current = new AudioPlayer();
      await playerRef.current.init();

      // 2. Connect to Voice Gateway
      const socket = new WebSocket(VOICE_GATEWAY_URL);
      sessionRef.current = socket;

      socket.onopen = () => {
        console.log("Connected to Voice Gateway");
        // Authenticate and Initialize
        socket.send(
          JSON.stringify({
            type: "control",
            data: JSON.stringify({
              event: "init",
              token: token,
              agentId: agentId,
              voiceId: selectedVoice,
              voiceGender: voiceGender, // Pass gender to help with defaults
            }),
            timestamp: Date.now(),
          })
        );
      };

      socket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.ok && msg.message === "Session initialized") {
            console.log("Gateway session ready");
            setIsConnecting(false);
            setIsTalking(true);

            // Start recording once initialized
            if (recorderRef.current) {
              await recorderRef.current.start();
            }
          }

          if (msg.type === "audio" && msg.data) {
            if (playerRef.current) {
              const audioBuffer = base64ToArrayBuffer(msg.data);
              playerRef.current.play(audioBuffer);
            }
          }

          if (msg.type === "control") {
            if (msg.data === "interrupted") {
              console.log("Barge-in: AI interrupted");
              playerRef.current?.stop();
              playerRef.current = new AudioPlayer();
              await playerRef.current.init();
            } else if (msg.data === "closed") {
              stopTalking();
            }
          }

          if (msg.error) {
            setConnectionError(msg.error);
            stopTalking();
          }
        } catch (e) {
          console.error("Error parsing gateway message", e);
        }
      };

      socket.onerror = (err: any) => {
        console.error("Gateway socket error:", {
          error: err,
          gatewayUrl: VOICE_GATEWAY_URL,
          readyState: socket.readyState,
        });
        setConnectionError("Failed to connect to voice gateway.");
        stopTalking();
      };

      socket.onclose = (event) => {
        console.log("Gateway connection closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        stopTalking();
      };

      // 3. Setup Recorder
      recorderRef.current = new AudioRecorder((data: ArrayBuffer) => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(
              JSON.stringify({
                type: "audio",
                data: arrayBufferToBase64(data),
                timestamp: Date.now(),
              })
            );
          } catch (e) {
            console.warn("Could not send audio chunk", e);
          }
        }
      });
    } catch (err: any) {
      console.error("Voice preparation error:", err);
      setConnectionError(err.message || "Failed to start conversation.");
      stopTalking();
    }
  };

  useEffect(() => {
    return () => {
      stopTalking();
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
                <span className="text-[rgba(240,244,250,0.5)] text-xs">Gemini 2.5 Flash</span>
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
              <div
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${activeStep === 1 ? "ring-1 ring-[#14b8a6]/30" : ""}`}
              >
                <button
                  onClick={() => setActiveStep(1)}
                  suppressHydrationWarning
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeStep === 1
                        ? "bg-[#14b8a6] text-white"
                        : isStepComplete(1)
                          ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                          : "bg-white/[0.06] text-[rgba(240,244,250,0.4)]"
                    }`}
                  >
                    1
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Agent Identity</div>
                    <div className="text-xs text-[rgba(240,244,250,0.35)]">
                      Name and basic information
                    </div>
                  </div>
                  {name && (
                    <div className="ml-auto text-xs text-[#14b8a6] font-medium truncate max-w-[120px]">
                      {name}
                    </div>
                  )}
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
                          debouncedAutoSave(e.target.value, systemPrompt, selectedVoice, agentType, voiceGender, avatarUrl, autoStart);
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
                      <div className="grid grid-cols-1 gap-2">
                        {AGENT_TYPES.map((t) => (
                          <button
                            key={t.id}
                            suppressHydrationWarning
                            onClick={() => {
                              setAgentType(t.id as any);
                              triggerAutoSave(name, systemPrompt, selectedVoice, t.id, voiceGender, avatarUrl, autoStart);
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

                      <button
                        onClick={handleStep1Continue}
                        className="mt-6 w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm shadow-lg shadow-[#14b8a6]/20"
                        suppressHydrationWarning
                      >
                        Continue to Persona →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Persona */}
              <div
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${activeStep === 2 ? "ring-1 ring-[#14b8a6]/30" : ""}`}
              >
                <button
                  onClick={() => setActiveStep(2)}
                  suppressHydrationWarning
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeStep === 2
                        ? "bg-[#14b8a6] text-white"
                        : isStepComplete(2)
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
                          setSystemPrompt(e.target.value.slice(0, maxChars));
                          debouncedAutoSave(name, e.target.value.slice(0, maxChars), selectedVoice, agentType, voiceGender, avatarUrl, autoStart);
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

                    </div>
                  </div>
                )}
              </div>

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
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: voiceModel.color }}
                      />
                      <span className="text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider">
                        Live Preview
                      </span>
                    </div>
                    <span className="text-[10px] text-[rgba(240,244,250,0.2)] font-mono">
                      v0.1-draft
                    </span>
                  </div>

                  {/* Agent Card */}
                  <div className="p-5">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${voiceModel.color}30, ${voiceModel.color}10)`,
                            border: `1px solid ${voiceModel.color}30`,
                          }}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            name.trim() ? name.trim()[0].toUpperCase() : "?"
                          )}
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: voiceModel.color }}
                        >
                          <svg width="8" height="8" fill="white" viewBox="0 0 24 24">
                            <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
                            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">
                          {name.trim() || (
                            <span className="text-[rgba(240,244,250,0.2)] font-normal">
                              Agent Name
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: `${voiceModel.color}20`, color: voiceModel.color }}
                          >
                            {voiceModel.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Voice Selection Studio */}
                    <div className="mb-6 fade-slide-up">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-semibold text-[rgba(240,244,250,0.3)] uppercase tracking-wider">
                          Voice Model
                        </label>
                        <div className="flex bg-[#0a0e1a] p-1 rounded-lg border border-white/5 scale-90 origin-right">
                          {(["MALE", "FEMALE"] as const).map((g) => (
                            <button
                              key={g}
                              onClick={() => {
                                setVoiceGender(g);
                                const defaultAvatar = g === "MALE" ? "/avatars/male1.png" : "/avatars/female1.png";
                                setAvatarUrl(defaultAvatar);
                                const defaultVoice = g === "MALE" ? "charon" : "aoede";
                                setSelectedVoice(defaultVoice);
                                triggerAutoSave(name, systemPrompt, defaultVoice, agentType, g, defaultAvatar, autoStart);
                              }}
                              className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                                voiceGender === g
                                  ? "bg-[#14b8a6] text-white"
                                  : "text-[rgba(240,244,250,0.4)]"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                          className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 flex items-center justify-between hover:border-[#14b8a6]/30 transition group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: voiceModel.color }} />
                            <div className="text-left">
                              <span className="text-xs font-semibold text-white block truncate w-32">{voiceModel.name}</span>
                            </div>
                          </div>
                          <svg 
                            className={`transition-transform duration-300 ${isVoiceDropdownOpen ? 'rotate-180' : ''}`}
                            width="14" height="14" fill="none" stroke="rgba(240,244,250,0.3)" strokeWidth="2" viewBox="0 0 24 24"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>

                        {isVoiceDropdownOpen && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 z-50 glass-card border border-[#14b8a6]/20 rounded-xl overflow-hidden shadow-2xl py-1 fade-slide-up max-h-[300px] overflow-y-auto custom-scrollbar">
                            {VOICE_MODELS.filter(v => v.gender === voiceGender).map((v) => (
                              <div key={v.id} className="flex items-center group/item hover:bg-[#14b8a6]/10 px-1">
                                <button
                                  onClick={() => {
                                    handleVoiceSelect(v.id);
                                    setIsVoiceDropdownOpen(false);
                                  }}
                                  className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left transition"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color }} />
                                  <div className="flex-1">
                                    <div className="text-[11px] font-semibold text-white">{v.name}</div>
                                  </div>
                                  {selectedVoice === v.id && (
                                    <div className="w-4 h-4 rounded-full bg-[#14b8a6] flex items-center justify-center">
                                      <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" /></svg>
                                    </div>
                                  )}
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playVoiceSample(v.id);
                                  }}
                                  className="p-2 mr-1 rounded-lg hover:bg-[#14b8a6]/20 text-[#14b8a6] transition"
                                >
                                  {isPlayingSample === v.id ? (
                                    <div className="w-3 h-3 rounded-full border-2 border-[#14b8a6]/30 border-t-[#14b8a6] animate-spin" />
                                  ) : (
                                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M3 22v-20l18 10-18 10z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Avatar Selection */}
                    <div className="mb-6 fade-slide-up">
                      <label className="block text-[10px] font-semibold text-[rgba(240,244,250,0.3)] uppercase tracking-wider mb-2">
                        Quick Avatar Swap
                      </label>
                      <div className="flex gap-2">
                        {AVATARS.filter(a => a.gender === voiceGender).map((avatar) => (
                          <button
                            key={avatar.id}
                            suppressHydrationWarning
                            onClick={() => {
                              setAvatarUrl(avatar.url);
                              triggerAutoSave(name, systemPrompt, selectedVoice, agentType, voiceGender, avatar.url, autoStart);
                            }}
                            className={`relative w-10 h-10 rounded-xl overflow-hidden border transition-all ${
                              avatarUrl === avatar.url
                                ? "border-[#14b8a6] ring-2 ring-[#14b8a6]/20"
                                : "border-white/5 hover:border-white/20"
                            }`}
                          >
                            <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Waveform Preview */}
                    <div
                      className="flex items-center justify-center gap-1 h-12 mb-5 rounded-xl"
                      style={{
                        background: `${voiceModel.color}08`,
                        border: `1px solid ${voiceModel.color}15`,
                      }}
                    >
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
                            background:
                              !systemPrompt.trim() || !agentId
                                ? "rgba(255,255,255,0.05)"
                                : `linear-gradient(135deg, ${voiceModel.color} 0%, ${voiceModel.color}bb 100%)`,
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            className="group-hover:scale-110 transition-transform"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
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
                      <div className="text-[10px] font-semibold text-[rgba(240,244,250,0.3)] uppercase tracking-widest mb-2">
                        Persona
                      </div>
                      <div className="text-xs text-[rgba(240,244,250,0.5)] leading-relaxed bg-white/[0.02] rounded-xl p-3 border border-white/[0.05] min-h-[60px] max-h-[100px] overflow-hidden relative">
                        {systemPrompt.trim() ? (
                          <>
                            {systemPrompt.slice(0, 180)}
                            {systemPrompt.length > 180 && (
                              <span className="text-[rgba(240,244,250,0.2)]">...</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[rgba(240,244,250,0.15)] italic">
                            Persona will appear here...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div>
                      <div className="text-[10px] font-semibold text-[rgba(240,244,250,0.3)] uppercase tracking-widest mb-2">
                        Capabilities
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["Voice AI", "Real-time", "Gemini 2.5"].map((cap) => (
                          <span
                            key={cap}
                            className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] text-[rgba(240,244,250,0.4)] border border-white/[0.06]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ready Status */}
                  <div className="px-5 py-3 border-t border-white/[0.05] flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${name.trim() && systemPrompt.trim() ? "bg-green-400 animate-pulse" : "bg-[rgba(240,244,250,0.15)]"}`}
                    />
                    <span className="text-[10px] text-[rgba(240,244,250,0.3)]">
                      {name.trim() && systemPrompt.trim()
                        ? "Ready to launch"
                        : "Fill in the details to continue"}
                    </span>
                  </div>
                </div>

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
