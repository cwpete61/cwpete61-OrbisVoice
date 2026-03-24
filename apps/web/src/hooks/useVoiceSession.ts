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
  const sessionReadyRef = useRef(false);

  const stopTalking = useCallback(() => {
    setIsTalking(false);
    setIsConnecting(false);
    sessionReadyRef.current = false;
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
    sessionReadyRef.current = false;

    try {
      // Step 1: Request microphone IMMEDIATELY to preserve user gesture
      // This is the most sensitive call and must happen as early as possible in the click handler.
      recorderRef.current = new AudioRecorder((audioData: ArrayBuffer) => {
        const sock = sessionRef.current;
        if (sock && sock.readyState === WebSocket.OPEN && sessionReadyRef.current) {
          sock.send(
            JSON.stringify({
              type: "audio",
              data: arrayBufferToBase64(audioData),
              timestamp: Date.now(),
            })
          );
        }
      });
      await recorderRef.current.start();

      // Step 2: Initialize player context (less sensitive than mic)
      const token = localStorage.getItem("token") || "";
      playerRef.current = new AudioPlayer();
      await playerRef.current.init();

      // Step 3: Open WebSocket
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
            sessionReadyRef.current = true;
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
      console.error(err);
      setIsConnecting(false);
      
      const isNotAllowed = err.name === "NotAllowedError" || err.message?.includes("denied");
      const inIframe = typeof window !== "undefined" && window.self !== window.top;

      if (isNotAllowed && inIframe) {
        setConnectionError("MICROPHONE_BLOCKED_IN_IFRAME");
      } else {
        setConnectionError("Microphone access denied or error: " + (err.message || String(err)));
      }
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
