import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class StripeAgent implements Agent {
  name = "stripe";
  description = "Handles billing and payment actions through Stripe.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "StripeAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
