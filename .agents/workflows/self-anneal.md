---
description: Automatically fix software errors and update system directives based on learnings.
---

# 🤖 Self-Annealing Workflow

Use this workflow when a script, command, or process fails. The goal is not just to fix the code, but to make the system smarter by updating directives to prevent future failures.

## 1. Analyze and Isolate
- Read the **full error message** and **stack trace**.
- Identify the root cause (syntax, logic, API limit, timing, etc.).

## 2. Iterative Fix & Test
- Implement the fix in the code/script.
- **Safety First**: If the test uses paid tokens/credits, pause and **check with the user** before re-running.
- Run the test/script again and verify the fix.

## 3. Knowledge Extraction
- Reflect on *why* it broke:
    - Was it a hidden API rate limit?
    - A timing condition that only happens in production?
    - An edge case in the data?
- Find the long-term solution (e.g., using a batch endpoint, adding retry logic, updating validation).

## 4. Directive Update
- Locate the relevant **Directive** or **Workflow** document.
- Update it with the new constraint or "best practice" learned.
- *Self-Annealing Loop*: Fix -> Update Tool/Directives -> Test -> Stronger System.

## 5. Verify & Close
- Ensure the system is now "annealed" against this specific failure.
