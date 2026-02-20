export interface AudioMessage {
  type: "audio" | "text" | "control";
  data: string;
  timestamp: number;
  sessionId?: string;
}

export interface GatewayClient {
  sessionId: string;
  userId: string;
  agentId: string;
  connectedAt: Date;
  apiKey?: string;
}

export interface GeminiResponse {
  outputAudio?: {
    data: string; // base64 encoded
  };
  text?: string;
  stopReason?: string;
}
