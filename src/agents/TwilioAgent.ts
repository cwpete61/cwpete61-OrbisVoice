import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class TwilioAgent implements Agent {
  name = "twilio";
  description = "Handles telephony actions and messaging through Twilio.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "TwilioAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
