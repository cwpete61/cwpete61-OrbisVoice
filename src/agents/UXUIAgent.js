"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UXUIAgent = void 0;
class UXUIAgent {
    constructor() {
        this.name = "ux_ui";
        this.description = "Creates UX and UI direction aligned to the OrbisLocal brand.";
    }
    async run(input, context) {
        const plan = {
            brandSource: "https://orbislocal.com/",
            brandUse: "inspiration",
            brief: input ||
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
exports.UXUIAgent = UXUIAgent;
