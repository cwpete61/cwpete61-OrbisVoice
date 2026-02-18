import type { Agent, AgentContext, AgentResult } from "../multi_agent_system";

type UXUIPlan = {
  brandSource: string;
  brandUse: "inspiration" | "mirror";
  brief: string;
  uxStrategy: string[];
  uiDirection: string[];
  deliverables: string[];
  openQuestions: string[];
};

export class UXUIAgent implements Agent {
  name = "ux_ui";
  description = "Creates UX and UI direction aligned to the OrbisLocal brand.";

  async run(input: string, context: AgentContext): Promise<AgentResult> {
    const plan: UXUIPlan = {
      brandSource: "https://orbislocal.com/",
      brandUse: "inspiration",
      brief:
        input ||
        "Define a UX/UI direction for OrbisVoice aligned to OrbisLocal brand cues.",
      uxStrategy: [
        "Clarify primary user journeys and success states.",
        "Map IA and navigation for core workflows.",
        "Define content hierarchy and copy tone guidelines.",
        "Establish interaction patterns for setup, monitoring, and outcomes.",
      ],
      uiDirection: [
        "Translate brand cues into a restrained palette and type pairing.",
        "Favor confident, editorial layout with clear hierarchy.",
        "Use ambient backgrounds and structured sections for depth.",
        "Add a minimal motion system for load and focus states.",
      ],
      deliverables: [
        "UX flow map for key tasks",
        "Page-level wireframes for dashboard and settings",
        "UI style tiles with color, type, and components",
        "Component inventory and spacing system",
      ],
      openQuestions: [
        "Which OrbisLocal pages or elements are must-keep references?",
        "Target users and primary conversion action?",
        "Any accessibility or compliance constraints?",
      ],
    };

    return {
      ok: true,
      message: "UXUIAgent prepared a brand-aligned UX/UI plan.",
      data: {
        input,
        requestId: context.requestId,
        plan,
      },
    };
  }
}
