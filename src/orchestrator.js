"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const agents_1 = require("./agents");
class Orchestrator {
    constructor(agents = (0, agents_1.createAgents)()) {
        this.agents = new Map(agents.map((agent) => [agent.name, agent]));
    }
    listAgents() {
        return Array.from(this.agents.values());
    }
    async run(agentName, input, context) {
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
exports.Orchestrator = Orchestrator;
