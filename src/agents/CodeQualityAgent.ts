import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

type CheckItem = {
  name: string;
  status: "pass" | "warn";
  detail: string;
};

export class CodeQualityAgent implements Agent {
  name = "code_quality";
  description = "Performs pre-commit checks to keep code production ready.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    const checks: CheckItem[] = [
      {
        name: "Lint",
        status: "warn",
        detail: "No lint runner configured yet.",
      },
      {
        name: "Tests",
        status: "warn",
        detail: "No test runner configured yet.",
      },
      {
        name: "Typecheck",
        status: "warn",
        detail: "No typecheck script configured yet.",
      },
    ];

    const hasWarnings = checks.some((check) => check.status !== "pass");

    return {
      ok: !hasWarnings,
      message: hasWarnings
        ? "CodeQualityAgent found checks that need configuration."
        : "All checks passed.",
      data: { input, requestId: context.requestId, checks },
    };
  }
}
