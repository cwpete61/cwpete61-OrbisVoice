import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class ProductAgent implements Agent {
  name = "product";
  description = "Answers product questions and provides feature guidance.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "ProductAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
