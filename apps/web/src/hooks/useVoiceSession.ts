"use client";
import { useState, useRef, useCallback } from "react";
import { VOICE_GATEWAY_URL } from "@/lib/api";
import { AudioPlayer, AudioRecorder } from "@/lib/audio-utils";
import { base64ToArrayBuffer, arrayBufferToBase64 } from "@/lib/base64-utils";

interface UseVoiceSessionProps {
  agentId: string;
  selectedVoice: string;
  voiceGender: string;
  systemPrompt: string;
}

export function useVoiceSession({ agentId, selectedVoice, voiceGender, systemPrompt }: UseVoiceSessionProps) {
  const [isTalking, setIsTalking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<WebSocket | null>(null);

  const stopTalking = useCallback(() => {
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
      } catch (e) {}
      sessionRef.current = null;
    }
  }, []);

  const startTalking = useCallback(async () => {
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
        socket.send(
          JSON.stringify({
            type: "control",
            data: JSON.stringify({
              event: "init",
              token,
              agentId,
              voiceId: selectedVoice,
              voiceGender,
              systemPrompt,
            }),
            timestamp: Date.now(),
          })
        );
      };

      socket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.ok && msg.message === "Session initialized") {
            setIsConnecting(false);
            setIsTalking(true);
            recorderRef.current = new AudioRecorder((audioData: ArrayBuffer) => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(
                  JSON.stringify({
                    type: "audio",
                    data: arrayBufferToBase64(audioData),
                    timestamp: Date.now(),
                  })
                );
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
        } catch (e) {
          console.error("Error parsing socket message:", e);
        }
      };

      socket.onclose = () => stopTalking();
      socket.onerror = () => {
        setConnectionError("Gateway connection failed.");
        stopTalking();
      };
    } catch (err: any) {
      setIsConnecting(false);
      setConnectionError("Microphone access denied or error: " + (err.message || String(err)));
      stopTalking();
    }
  }, [agentId, selectedVoice, voiceGender, systemPrompt, stopTalking]);

  return {
    isTalking,
    isConnecting,
    connectionError,
    startTalking,
    stopTalking,
  };
}
