import { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AudioRecorder, AudioPlayer } from './lib/audio-utils';
import { AudioVisualizer } from './components/AudioVisualizer';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    playerRef.current = new AudioPlayer();
    return () => {
      disconnect();
    };
  }, []);

  const connectWithCallbacks = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Initialize audio player context (must be user initiated)
      await playerRef.current?.init();

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful, witty, and concise voice assistant. Keep your responses relatively short and conversational.",
        },
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsConnected(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              playerRef.current?.play(bytes.buffer);
            }
            
            if (message.serverContent?.interrupted) {
              console.log("Interrupted");
              playerRef.current?.stop();
              // Re-initialize player to clear queue
              playerRef.current = new AudioPlayer();
              await playerRef.current.init();
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
            setIsConnecting(false);
          },
          onerror: (err) => {
            console.error("Session error:", err);
            setError(err.message || "Session error");
            setIsConnected(false);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = session;
      
      // Now that session is established, we can hook up the recorder to send data
      recorderRef.current = new AudioRecorder(
        (data) => {
          const base64Data = btoa(
            String.fromCharCode(...new Uint8Array(data))
          );
          session.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Data
            }
          });
        },
        (vol) => {
          setVolume(vol);
        }
      );
      await recorderRef.current.start();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect");
      setIsConnecting(false);
      disconnect();
    }
  };

  const disconnect = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stop();
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session", e);
      }
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff4e00] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3a1510] rounded-full mix-blend-screen filter blur-[100px] opacity-30" />
      </div>

      <main className="relative z-10 flex flex-col items-center gap-12 max-w-md w-full">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif tracking-tight text-white/90">Gemini Live</h1>
          <p className="text-white/50 font-light tracking-wide text-sm uppercase">Real-time Voice Agent</p>
        </div>

        {/* Visualizer / Status */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl" />
          
          <div className="relative z-10 w-full h-full flex items-center justify-center">
             <AudioVisualizer isActive={isConnected} volume={volume} />
          </div>
          
          {/* Status Indicator */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
            isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
            isConnecting ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            'bg-white/10 text-white/40 border border-white/10'
          }`}>
            {isConnecting ? 'Connecting...' : isConnected ? 'Listening' : 'Ready'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isConnected ? disconnect : connectWithCallbacks}
              disabled={isConnecting}
              aria-label={isConnected ? "Stop listening" : "Start listening"}
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                transition-all duration-300 shadow-lg z-10 relative
                ${isConnected 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40'
                }
              `}
            >
              {isConnecting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isConnected ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </motion.button>
            
            {/* Pulse effect when connecting */}
            {isConnecting && (
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
            )}
          </div>
          
          <p className="text-white/30 text-xs font-medium tracking-widest uppercase">
            {isConnecting ? 'Establishing Connection...' : isConnected ? 'Tap to Stop' : 'Tap to Start'}
          </p>
          
          {error && (
            <div className="text-red-400 text-sm text-center max-w-xs bg-red-950/30 p-3 rounded-lg border border-red-900/50">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 text-white/20 text-xs font-mono">
        POWERED BY GEMINI 2.5 FLASH
      </footer>
    </div>
  );
}
