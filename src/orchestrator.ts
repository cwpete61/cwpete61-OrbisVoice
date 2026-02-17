import type { Agent, AgentContext, AgentResult } from "./multi_agent_system";
import { createAgents } from "./agents";

export class Orchestrator {
  private agents: Map<string, Agent>;

  constructor(agents: Agent[] = createAgents()) {
    this.agents = new Map(agents.map((agent) => [agent.name, agent]));
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async run(agentName: string, input: string, context: AgentContext): Promise<AgentResult> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return {
        ok: false,
        message: `Unknown agent: ${agentName}`,
      };
    }

    return agent.run(input, context);
  }
}
