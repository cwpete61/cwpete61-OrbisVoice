# OrbisVoice Global Workflow & Directives

This document serves as the master instruction set for all AI agents working on OrbisVoice. It incorporates the self-annealing feedback loop to ensure the system becomes stronger with every error.

---

## 🛡️ 1. Self-Annealing Agent
**Description**: Automatically fix software errors by learning from stack traces and updating directives.

- **Process**:
    1. Read error message and full stack trace.
    2. Fix the script and test again.
    3. **Precondition**: If the fix involves paid tokens/credits, get explicit USER approval before testing.
    4. **Extraction**: Identify API limits, timing issues, or edge cases.
    5. **Hardening**: Rewrite script/logic to accommodate the new knowledge.

## 📚 2. Living Directives
**Description**: Treat all project directives as living documents that evolve with new knowledge.

- **Discovery**: When encountering API constraints or better patterns, capture them immediately.
- **Workflow**: 
    - Ask the USER before creating or overwriting directives.
    - Improve instructions over time; do not discard them.
- **Goal**: Build a persistent, improving instruction set for the project.

## 🔄 3. The Self-Annealing Loop
**Description**: Convert errors into localized system improvements.

1. **Fix it**: Patch the immediate bug.
2. **Update the Tool**: Improve the script or utility if applicable.
3. **Test Tool**: Verify the fix is robust.
4. **Update Directive**: Include the new flow/rule in the project's documentation.
5. **Result**: The system is now stronger against this failure mode.

---

## 🛠️ Usage
- Run `/self-anneal` when encountering any bug.
- Run `/update-directives` whenever new technical secrets or patterns are uncovered.
