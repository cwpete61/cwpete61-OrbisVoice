import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class CommunicationAgent implements Agent {
  name = "communication";
  description = "Handles general user communications and messaging tasks.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "CommunicationAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
