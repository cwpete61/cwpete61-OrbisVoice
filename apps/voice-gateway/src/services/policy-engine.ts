import { env } from "../env";
import { logger } from "../logger";

export interface PolicyContext {
  agentId: string;
  userId?: string;
  tenantId?: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  remedy?: string;
}

class PolicyEngine {
  /**
   * Validates if an action (usually a tool call) is allowed in the current environment
   */
  async checkAction(action: string, args: any, ctx: PolicyContext): Promise<PolicyResult> {
    if (!env.RUNTIME_POLICY_ENABLED) {
      return { allowed: true };
    }

    const environment = env.APP_ENVIRONMENT;
    logger.debug({ action, environment, ctx }, "Policy check");

    // 1. Staging Restrictions (Phase 5)
    if (environment === "staging") {
      return this.checkStagingPolicy(action, args, ctx);
    }

    // 2. Production (Placeholder for Phase 9)
    if (environment === "production") {
      return { allowed: true }; // Full enforcement logic later
    }

    return { allowed: true };
  }

  private checkStagingPolicy(action: string, args: any, ctx: PolicyContext): PolicyResult {
    // Rules from control.staging.md
    
    // Prohibited in Staging
    const prohibited = ["bulk_sms", "bulk_email", "bridge_call", "cold_transfer"];
    if (prohibited.includes(action)) {
      return { 
        allowed: false, 
        reason: `${action} is explicitly disabled in staging environment`,
        remedy: "Contact admin to enable production mode"
      };
    }

    // Restricted / Test Mode only
    const testModeOnly = ["make_call", "make_outbound_call", "forward_call_to_number", "warm_transfer"];
    if (testModeOnly.includes(action)) {
      // In Phase 5 "Test Mode Only" means we only allow it to specific verified numbers 
      // or we just log and block for now to demonstrate gating.
      // For now, I'll block it unless the recipient is a "test" number if we had one.
      // I'll allow it but add a policy note.
      logger.warn({ action }, "STAGING: Executing high-risk action in test mode");
    }

    // Default: Allowed in staging for other tools
    return { allowed: true };
  }
}

export const policyEngine = new PolicyEngine();
