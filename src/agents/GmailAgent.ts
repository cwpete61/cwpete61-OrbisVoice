import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class GmailAgent implements Agent {
  name = "gmail";
  description = "Sends, drafts, and tracks emails via Gmail.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "GmailAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
