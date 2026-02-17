import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class LeadQualificationAgent implements Agent {
  name = "lead_qualification";
  description = "Qualifies leads and captures intent and fit signals.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "LeadQualificationAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
