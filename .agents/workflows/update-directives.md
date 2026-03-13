---
description: Maintain and evolve system directives as living documents.
---

# 📚 Update Directives Workflow

Directives are living documents. They are your primary instruction set and must be preserved and improved over time.

## 1. Monitor for Learnings
- Stay alert for new API constraints, better architectural approaches, common error patterns, or timing expectations.
- When you discover a pattern that isn't documented, it's time to update the directives.

## 2. Refine the Instruction Set
- Update the relevant directive with the new information.
- Focus on making the instructions more robust and prevent recurring issues.

## 3. Preservation & Evolution
- Do NOT extemporaneously discard directives.
- Improve them incrementally. They are the "long-term memory" of the project's engineering standards.

## 4. Communication Rules
- **CRITICAL**: Do NOT create or overwrite existing directives without **asking the user first**, unless explicitly told to do so for a specific task.
- When proposing an update, explain the reasoning (e.g., "I hit a rate limit, so I'm updating the API directive to suggest batching").
