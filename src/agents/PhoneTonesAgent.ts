import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class PhoneTonesAgent implements Agent {
  name = "phone_tones";
  description = "Handles phone tone playback cues and signaling.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "PhoneTonesAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
