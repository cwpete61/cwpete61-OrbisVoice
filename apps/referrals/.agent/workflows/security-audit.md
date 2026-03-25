---
description: Advanced Security Auditor for AI agent configurations. Powered by AgentShield.
---

# Security Audit (AgentShield)

This workflow invokes the **Security Auditor** to inspect all agent configurations, skills, and permissions for potential vulnerabilities, secret leaks, or permission misconfigurations.

## 🛡️ Execution Steps

1. **Vulnerability Scan**
   - Execute `npx -y ecc-agentshield scan --path .agent` to check my own brain.
   - Execute `npx -y ecc-agentshield scan --path .cursor` to check IDE rules.

2. **Secrets Detection**
   - Scan every `.env`, `.env.example`, and `.env.local` for hardcoded keys.
   - Check if any `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` are exposed in plaintext.

3. **Permission Review**
   - Audit `Bash(*)` or wildcard tool usage.
   - Enforce scoped permissions (e.g., `Bash(npm *)`, `Bash(pnpm *)`).

4. **Auto-Fix**
   - If findings are present, offer to run `ecc-agentshield scan --fix`.

5. **Reporting**
   - Generate a security report at `.agent/security-report.md`.

## 🛠️ Usage
Run this workflow BEFORE any major deployment or whenever you install a new community skill/agent.

---
*Powered by [affaan-m/agentshield](https://github.com/affaan-m/agentshield)*
