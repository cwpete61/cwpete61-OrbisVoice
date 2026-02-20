import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

export class GoogleCalendarAgent implements Agent {
  name = "google_calendar";
  description = "Schedules and manages calendar events via Google Calendar.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    return {
      ok: true,
      message: "GoogleCalendarAgent received input.",
      data: { input, requestId: context.requestId },
    };
  }
}
