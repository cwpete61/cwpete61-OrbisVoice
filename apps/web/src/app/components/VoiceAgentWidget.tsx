"use client";
import { useState, useRef, useEffect } from "react";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { VOICE_MODELS, VoiceGender, AgentType, AVATARS } from "@/types/agent";

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
  agentType?: AgentType;
}

export default function VoiceAgentWidget({ agentId, initialData, isWidget = false, agentType }: VoiceAgentWidgetProps) {
  const [name, setName] = useState(initialData.name || "");
  const [systemPrompt, setSystemPrompt] = useState(initialData.systemPrompt || "");
  const [selectedVoice, setSelectedVoice] = useState(initialData.voiceId || "aoede");
  const [voiceGender, setVoiceGender] = useState(initialData.voiceGender || "FEMALE");
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || "");
  const [isPlayingSample, setIsPlayingSample] = useState<string | null>(null);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);

  // Audio refs for UI samples
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const voiceModel = VOICE_MODELS.find((v) => v.id === selectedVoice) || VOICE_MODELS[0];
  const primaryColor = initialData.widgetPrimaryColor || voiceModel.color;

  const {
    isTalking,
    isConnecting,
    connectionError,
    startTalking,
    stopTalking,
  } = useVoiceSession({
    agentId,
    selectedVoice,
    voiceGender,
    systemPrompt,
  });

  useEffect(() => {
    setName(initialData.name || "");
    setSystemPrompt(initialData.systemPrompt || "");
    setSelectedVoice(initialData.voiceId || "aoede");
    setVoiceGender(initialData.voiceGender || "FEMALE");
    setAvatarUrl(initialData.avatarUrl || "");
  }, [initialData]);

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
    <div className={`flex flex-col h-full bg-[#05080f] text-white relative transition-all duration-500 ${isWidget ? "" : "rounded-2xl overflow-hidden shadow-2xl border border-white/5"}`}>
      <style>{`
        .glass-card {
          background: rgba(14, 18, 29, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .wave-bar {
          animation: waveBar 1.2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" style={{ backgroundColor: primaryColor }} />
          <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{isWidget ? "ORBISVOICE LIVE" : "WEBSITE WIDGET"}</span>
        </div>
        {isWidget ? (
          <button 
            onClick={() => window.parent.postMessage({ type: "orbis-voice-close" }, "*")}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-white"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">v0.1-draft</span>
        )}
      </div>

      <div className="p-8 flex-1 flex flex-col space-y-8">
        
        {/* Agent Info Profile */}
        <div className="flex items-center gap-5">
            <div className="relative shrink-0">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`,
                    border: `1px solid ${primaryColor}30`
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name ? name[0].toUpperCase() : "?"
                  )}
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-[#05080f] shadow-lg"
                  style={{ background: primaryColor }}
                >
                    <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                        <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
                    </svg>
                </div>
            </div>
                {!isWidget && (
                  <h3 className="text-xl font-black text-white leading-tight tracking-tight uppercase">
                    {name || "Unnamed Agent"}
                  </h3>
                )}
                <div className="mt-1 flex items-center">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: `${primaryColor}20`, color: primaryColor }}>
                      {voiceModel.name}
                    </span>
                </div>
            </div>
        </div>

        {/* Section 1: Voice Select */}
        {!isWidget && (
          <div>
              <div className="flex items-center justify-between mb-3 px-1">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Voice Model</label>
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 scale-90">
                      {(["MALE", "FEMALE"] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            setVoiceGender(g);
                            const defaultAvatar = g === "MALE" ? "/avatars/male1.png" : "/avatars/female1.png";
                            setAvatarUrl(defaultAvatar);
                            setSelectedVoice(g === "MALE" ? "charon" : "aoede");
                          }}
                          className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${voiceGender === g ? "bg-[#14b8a6] text-white shadow-lg" : "text-white/30 hover:text-white/60"}`}
                        >
                          {g}
                        </button>
                      ))}
                  </div>
              </div>

              <div className="relative">
                  <button
                    onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                    className="w-full h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 flex items-center justify-between hover:bg-white/[0.05] hover:border-[#14b8a6]/40 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: voiceModel.color }} />
                      <span className="text-sm font-bold text-white tracking-wide">{voiceModel.name}</span>
                    </div>
                    <svg className={`transition-transform duration-300 ${isVoiceDropdownOpen ? "rotate-180 text-[#14b8a6]" : "text-white/20"}`} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isVoiceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#0d121f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl py-2 max-h-[220px] overflow-y-auto">
                        {VOICE_MODELS.filter(v => v.gender === voiceGender).map((v) => (
                          <div key={v.id} className="flex items-center group/item hover:bg-white/5 px-2">
                             <button onClick={() => { setSelectedVoice(v.id); setIsVoiceDropdownOpen(false); }} className="flex-1 flex items-center gap-3 px-4 py-3 text-left">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                                <span className="text-sm font-bold text-white/80 group-hover/item:text-white">{v.name}</span>
                             </button>
                             <button onClick={() => playVoiceSample(v.id)} className="p-2.5 rounded-xl hover:bg-[#14b8a6]/20 text-[#14b8a6]/60 hover:text-[#14b8a6] transition">
                                {isPlayingSample === v.id ? <div className="w-5 h-5 border-2 border-[#14b8a6]/30 border-t-[#14b8a6] rounded-full animate-spin" /> : <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 22v-20l18 10-18 10z" /></svg>}
                             </button>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
          </div>
        )}

        {/* Section 2: Avatar Swap */}
        {!isWidget && (
          <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 block px-1">Quick Avatar Swap</label>
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                  {AVATARS.filter(a => a.gender === voiceGender).map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setAvatarUrl(avatar.url)}
                        className={`relative w-12 h-12 rounded-2xl border-2 transition-all shrink-0 ${avatarUrl === avatar.url ? "border-[#14b8a6] scale-105 shadow-xl shadow-[#14b8a6]/20" : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"}`}
                      >
                          <img src={avatar.url} alt="Avatar Option" className="w-full h-full object-cover rounded-xl" />
                      </button>
                  ))}
              </div>
          </div>
        )}

        {/* Waveform Section */}
        <div className="flex-1 flex flex-col justify-center">
            <div className="h-20 w-full rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center gap-2 px-6">
                {voiceModel.waveform.map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full ${isTalking ? "wave-bar" : ""}`}
                    style={{
                      height: `${h * 4}px`,
                      backgroundColor: primaryColor,
                      opacity: isTalking ? 1 : 0.15,
                      animationDelay: `${i * 0.08}s`,
                      boxShadow: isTalking ? `0 0 12px ${primaryColor}66` : "none",
                    }}
                  />
                ))}
            </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
            {isTalking ? (
              <button
                onClick={stopTalking}
                className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl font-black text-white bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all shadow-xl shadow-red-500/5 group"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="uppercase tracking-widest text-sm">End Conversation</span>
              </button>
            ) : isConnecting ? (
              <button disabled className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl font-black text-white/50 bg-white/5 border border-white/10 cursor-not-allowed">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="uppercase tracking-widest text-sm">Connecting...</span>
              </button>
            ) : (
              <button
                onClick={startTalking}
                disabled={!systemPrompt?.trim() || !agentId || agentId === "save-to-generate"}
                className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl font-black text-white transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed group shadow-2xl relative overflow-hidden"
                style={{
                  background: (!systemPrompt?.trim() || !agentId || agentId === "save-to-generate") 
                    ? "rgba(255,255,255,0.05)" 
                    : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}aa 100%)`,
                  boxShadow: (!systemPrompt?.trim() || !agentId || agentId === "save-to-generate") 
                    ? "none" 
                    : `0 8px 40px ${primaryColor}40`,
                }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="group-hover:scale-125 transition-transform duration-500">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="uppercase tracking-widest text-sm ml-1">Start Conversation</span>
              </button>
            )}

            {connectionError && (
              <div className="space-y-3 fade-slide-up">
                {connectionError === "MICROPHONE_BLOCKED_IN_IFRAME" ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                    <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-2">Microphone Restricted</div>
                    <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                      This website's security policy prevents the voice agent from accessing your microphone within this window.
                    </p>
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      Open in New Window to Talk
                    </button>
                  </div>
                ) : (
                  <div className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 px-4 py-3 rounded-2xl border border-red-500/20">
                    {connectionError.includes("NotAllowedError") || connectionError.includes("denied") 
                      ? "Microphone access denied. Please check your browser settings." 
                      : connectionError}
                  </div>
                )}
                
                {!window.isSecureContext && (
                  <div className="text-amber-400 text-[9px] font-bold text-center bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                    ⚠️ SECURE CONTEXT REQUIRED: Voice features only work over HTTPS or localhost.
                  </div>
                )}
                {(connectionError.includes("NotAllowedError") || connectionError.includes("denied")) && connectionError !== "MICROPHONE_BLOCKED_IN_IFRAME" && (
                  <p className="text-[9px] text-white/30 text-center px-4 leading-relaxed">
                    Click the camera/mic icon in your browser address bar to reset permissions.
                  </p>
                )}
              </div>
            )}
        </div>

        {/* Footer Branding */}
        <div className="pt-2 flex items-center justify-center gap-2 opacity-30 select-none pointer-events-none">
           <span className="text-[10px] font-black tracking-[0.3em] text-[#14b8a6]">POWERED BY ORBISVOICE</span>
        </div>
      </div>
    );
}
