export enum AgentType {
  WIDGET = "WIDGET",
  INBOUND_TWILIO = "INBOUND_TWILIO",
  OUTBOUND_TWILIO = "OUTBOUND_TWILIO",
}

export enum VoiceGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export interface VoiceModel {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  color: string;
  waveform: number[];
  description?: string;
  badge?: string;
}

export const VOICE_MODELS: VoiceModel[] = [
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

export const AVATARS = [
  { id: "male1", url: "/avatars/male1.png", gender: VoiceGender.MALE },
  { id: "male2", url: "/avatars/male2.png", gender: VoiceGender.MALE },
  { id: "male3", url: "/avatars/male3.png", gender: VoiceGender.MALE },
  { id: "male4", url: "/avatars/male4.png", gender: VoiceGender.MALE },
  { id: "male5", url: "/avatars/male5.png", gender: VoiceGender.MALE },
  { id: "male6", url: "/avatars/male6.png", gender: VoiceGender.MALE },
  { id: "male7", url: "/avatars/male7.png", gender: VoiceGender.MALE },
  { id: "male8", url: "/avatars/male8.png", gender: VoiceGender.MALE },
  { id: "female1", url: "/avatars/female1.png", gender: VoiceGender.FEMALE },
  { id: "female2", url: "/avatars/female2.png", gender: VoiceGender.FEMALE },
  { id: "female3", url: "/avatars/female3.png", gender: VoiceGender.FEMALE },
  { id: "female4", url: "/avatars/female4.png", gender: VoiceGender.FEMALE },
  { id: "female5", url: "/avatars/female5.png", gender: VoiceGender.FEMALE },
  { id: "female6", url: "/avatars/female6.png", gender: VoiceGender.FEMALE },
];

export const PERSONA_TEMPLATES = [
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
