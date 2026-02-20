export type AgentContext = {
  requestId: string;
  userId?: string;
  metadata?: Record<string, string>;
};

export type AgentResult = {
  ok: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export interface Agent {
  name: string;
  description: string;
  run(input: string, context: AgentContext): Promise<AgentResult>;
}
