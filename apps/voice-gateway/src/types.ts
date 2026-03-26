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
  startTime: number;
  transcript: string;
  apiKey?: string;
  token?: string;
  liveSession?: any; // Using any for now to avoid complex type exports from SDK
  inputTokens: number;
  outputTokens: number;
  toolsCalled: number;
  isTwilio?: boolean;
  streamSid?: string;
  inbound?: boolean | string;
}

export interface GeminiResponse {
  outputAudio?: {
    data: string; // base64 encoded
  };
  text?: string;
  stopReason?: string;
}
