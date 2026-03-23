"use client";
import { useState, useRef, useEffect } from "react";
import { VOICE_GATEWAY_URL } from "@/lib/api";
import { AudioPlayer, AudioRecorder } from "@/lib/audio-utils";
import { base64ToArrayBuffer, arrayBufferToBase64 } from "@/lib/base64-utils";

export interface VoiceAgentWidgetProps {
    agentId: string;
    initialData: {
        name: string;
        systemPrompt: string;
        voiceId: string;
        voiceGender: "MALE" | "FEMALE";
        avatarUrl?: string | null;
        widgetPrimaryColor?: string | null;
    };
    isWidget?: boolean;
}

const VOICE_MODELS = [
  { id: "aoede", name: "Aoede", gender: "FEMALE", color: "#14b8a6", waveform: [12, 18, 14, 22, 16, 20, 15, 12, 10, 8] },
  { id: "charon", name: "Charon", gender: "MALE", color: "#6366f1", waveform: [10, 15, 12, 18, 14, 22, 16, 12, 10, 8] },
  { id: "puck", name: "Puck", gender: "MALE", color: "#f59e0b", waveform: [8, 12, 10, 16, 14, 20, 15, 12, 10, 6] },
  { id: "kore", name: "Kore", gender: "FEMALE", color: "#ec4899", waveform: [14, 20, 16, 24, 18, 22, 16, 14, 12, 10] },
  { id: "fenrir", name: "Fenrir", gender: "MALE", color: "#3b82f6", waveform: [12, 18, 14, 22, 16, 20, 15, 12, 10, 8] },
];

const AVATARS = [
  { id: "male1", url: "/avatars/male1.png", gender: "MALE" },
  { id: "male2", url: "/avatars/male2.png", gender: "MALE" },
  { id: "male3", url: "/avatars/male3.png", gender: "MALE" },
  { id: "male4", url: "/avatars/male4.png", gender: "MALE" },
  { id: "female1", url: "/avatars/female1.png", gender: "FEMALE" },
  { id: "female2", url: "/avatars/female2.png", gender: "FEMALE" },
  { id: "female3", url: "/avatars/female3.png", gender: "FEMALE" },
  { id: "female4", url: "/avatars/female4.png", gender: "FEMALE" },
];

export default function VoiceAgentWidget({ agentId, initialData, isWidget = false }: VoiceAgentWidgetProps) {
  const [name, setName] = useState(initialData.name);
  const [systemPrompt, setSystemPrompt] = useState(initialData.systemPrompt);
  const [selectedVoice, setSelectedVoice] = useState(initialData.voiceId);
  const [voiceGender, setVoiceGender] = useState(initialData.voiceGender);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);
  const [isTalking, setIsTalking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [isPlayingSample, setIsPlayingSample] = useState<string | null>(null);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);

  // Audio refs
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<WebSocket | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const voiceModel = VOICE_MODELS.find((v) => v.id === selectedVoice) || VOICE_MODELS[0];
  const primaryColor = initialData.widgetPrimaryColor || voiceModel.color;

  useEffect(() => {
    setName(initialData.name);
    setSystemPrompt(initialData.systemPrompt);
    setSelectedVoice(initialData.voiceId);
    setVoiceGender(initialData.voiceGender);
    setAvatarUrl(initialData.avatarUrl);
  }, [initialData]);

  const stopTalking = () => {
    setIsTalking(false);
    setIsConnecting(false);
    if (recorderRef.current) { recorderRef.current.stop(); recorderRef.current = null; }
    if (playerRef.current) { playerRef.current.stop(); playerRef.current = null; }
    if (sessionRef.current) { try { sessionRef.current.close(); } catch (e) {} sessionRef.current = null; }
  };

  const startTalking = async () => {
    if (!agentId || agentId === "save-to-generate") {
      setConnectionError("Please save the agent first.");
      return;
    }
    setConnectionError("");
    setIsConnecting(true);
    try {
      const token = localStorage.getItem("token") || "";
      playerRef.current = new AudioPlayer();
      await playerRef.current.init();
      const socket = new WebSocket(VOICE_GATEWAY_URL);
      sessionRef.current = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "control",
          data: JSON.stringify({ event: "init", token, agentId, voiceId: selectedVoice, voiceGender }),
          timestamp: Date.now(),
        }));
      };
      socket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ok && msg.message === "Session initialized") {
            setIsConnecting(false);
            setIsTalking(true);
            recorderRef.current = new AudioRecorder((audioData: ArrayBuffer) => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "audio", data: arrayBufferToBase64(audioData), timestamp: Date.now() }));
                }
            });
            await recorderRef.current.start();
          }
          if (msg.type === "audio" && msg.data) {
            if (playerRef.current) {
              const audioBuffer = base64ToArrayBuffer(msg.data);
              playerRef.current.play(audioBuffer);
            }
          }
          if (msg.type === "control" && msg.data === "interrupted") {
            playerRef.current?.stop();
            playerRef.current = new AudioPlayer();
            await playerRef.current.init();
          }
          if (msg.error) {
            setConnectionError(msg.error);
            stopTalking();
          }
        } catch (e) {}
      };
      socket.onclose = () => stopTalking();
      socket.onerror = () => { setConnectionError("Gateway connection failed."); stopTalking(); };
    } catch (e: any) {
      setConnectionError("Microphone access denied or error: " + e.message);
      stopTalking();
    }
  };

  const playVoiceSample = (voiceId: string) => {
    if (isPlayingSample === voiceId) {
      if (sampleAudioRef.current) { sampleAudioRef.current.pause(); sampleAudioRef.current = null; }
      setIsPlayingSample(null);
      return;
    }
    if (sampleAudioRef.current) { sampleAudioRef.current.pause(); }
    setIsPlayingSample(voiceId);
    const capitalizedId = voiceId.charAt(0).toUpperCase() + voiceId.slice(1);
    const audio = new Audio(`/assets/audio/samples/${capitalizedId}.wav`);
    sampleAudioRef.current = audio;
    audio.play().catch(() => setIsPlayingSample(null));
    audio.onended = () => { setIsPlayingSample(null); sampleAudioRef.current = null; };
  };

  return (
    <div className={`flex flex-col h-full bg-[#05080f] text-white relative transition-all duration-500 ${isWidget ? '' : 'rounded-2xl overflow-hidden'}`}>
      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .wave-bar {
            animation: waveBar 1.2s ease-in-out infinite;
            transform-origin: bottom;
        }
        @keyframes waveBar {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
        }
      `}</style>
      {isWidget && (
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">OrbisVoice Live</span>
          </div>
          <button 
            onClick={() => window.parent.postMessage({ type: 'orbis-voice-close' }, '*')}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-white"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {!isWidget && (
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-xs font-semibold text-[rgba(240,244,250,0.5)] uppercase tracking-wider">Live Preview</span>
          </div>
          <span className="text-[10px] text-[rgba(240,244,250,0.2)] font-mono">v0.1-draft</span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)`,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name.trim() ? name.trim()[0].toUpperCase() : "?"
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#05080f]" style={{ background: primaryColor }}>
              <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{name.trim() || <span className="text-white/20">Agent Name</span>}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${primaryColor}20`, color: primaryColor }}>
                {voiceModel.name}
              </span>
            </div>
          </div>
        </div>

        {/* Voice Model Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Voice Model</label>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 scale-90 origin-right">
              {(["MALE", "FEMALE"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setVoiceGender(g);
                    const defaultAvatar = g === "MALE" ? "/avatars/male1.png" : "/avatars/female1.png";
                    setAvatarUrl(defaultAvatar);
                    setSelectedVoice(g === "MALE" ? "charon" : "aoede");
                  }}
                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${voiceGender === g ? "bg-[#14b8a6] text-white" : "text-white/40"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center justify-between hover:border-[#14b8a6]/40 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: voiceModel.color }} />
                <span className="text-sm font-semibold text-white">{voiceModel.name}</span>
              </div>
              <svg className={`transition-transform duration-300 ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} width="16" height="16" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isVoiceDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0a0e1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl py-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                {VOICE_MODELS.filter(v => v.gender === voiceGender).map((v) => (
                  <div key={v.id} className="flex items-center group/item hover:bg-white/5 px-1">
                    <button onClick={() => { setSelectedVoice(v.id); setIsVoiceDropdownOpen(false); }} className="flex-1 flex items-center gap-2 px-4 py-3 text-left">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                      <span className="text-sm font-medium text-white">{v.name}</span>
                    </button>
                    <button onClick={() => playVoiceSample(v.id)} className="p-2 mr-2 rounded-lg hover:bg-[#14b8a6]/20 text-[#14b8a6] transition">
                      {isPlayingSample === v.id ? <div className="w-4 h-4 rounded-full border-2 border-[#14b8a6]/30 border-t-[#14b8a6] animate-spin" /> : <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 22v-20l18 10-18 10z" /></svg>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Avatar Swap */}
        <div className="mb-8 px-1">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-3">Quick Avatar Swap</label>
          <div className="flex gap-2.5">
            {AVATARS.filter(a => a.gender === voiceGender).map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setAvatarUrl(avatar.url)}
                className={`relative w-11 h-11 rounded-xl border-2 transition-all ${avatarUrl === avatar.url ? "border-[#14b8a6] scale-110 shadow-lg shadow-[#14b8a6]/20" : "border-white/5 hover:border-white/20"}`}
              >
                <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
              </button>
            ))}
          </div>
        </div>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-16 mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          {voiceModel.waveform.map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full ${isTalking ? "wave-bar" : ""}`}
              style={{
                height: `${h * 3}px`,
                backgroundColor: primaryColor,
                opacity: isTalking ? 1 : 0.3,
                animationDelay: `${i * 0.1}s`,
                animationPlayState: isTalking ? "running" : "paused",
              }}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="mb-6">
          {isTalking ? (
            <button
              onClick={stopTalking}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base text-white bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/5"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Stop Conversation
            </button>
          ) : isConnecting ? (
            <button disabled className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base text-white bg-white/5 border border-white/10 opacity-70 cursor-wait">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </button>
          ) : (
            <button
              onClick={startTalking}
              disabled={!systemPrompt.trim() || !agentId || agentId === "save-to-generate"}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group shadow-xl"
              style={{
                background: (!systemPrompt.trim() || !agentId || agentId === "save-to-generate") ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                boxShadow: (!systemPrompt.trim() || !agentId || agentId === "save-to-generate") ? "none" : `0 8px 30px ${primaryColor}40`,
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Talk
            </button>
          )}

          {connectionError && (
            <div className="text-red-400 text-[11px] mt-4 text-center bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20 leading-tight">
              {connectionError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-center gap-2 opacity-30">
           <span className="text-[10px] font-bold tracking-widest text-[#14b8a6]">POWERED BY ORBISVOICE</span>
        </div>
      </div>
    </div>
  );
}
