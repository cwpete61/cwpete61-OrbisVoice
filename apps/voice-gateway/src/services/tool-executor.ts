import { env } from "../env";
import { logger } from "../logger";
import { handleTwilioToolCall } from "../tools/twilio";
import { policyEngine, PolicyContext } from "./policy-engine";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

async function getTwilioConfig(token: string): Promise<TwilioConfig | null> {
  try {
    const res = await fetch(`${env.API_URL}/twilio/config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "Failed to fetch Twilio config");
      return null;
    }

    const payload = (await res.json()) as any;
    const config = payload?.data;
    if (!config) return null;

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      return null;
    }

    return {
      accountSid: config.accountSid,
      authToken: config.authToken,
      phoneNumber: config.phoneNumber,
    };
  } catch (err) {
    logger.error({ err }, "Error fetching Twilio config");
    return null;
  }
}

export class ToolExecutor {
  static async execute(
    toolName: string,
    args: any,
    token: string,
    meta: { agentId: string; userId?: string }
  ): Promise<any> {
    const startTime = Date.now();
    logger.info({ toolName, args, agentId: meta.agentId }, "Executing tool call");

    let result: any;
    let errorMsg: string | undefined;
    let status: "success" | "failed" | "blocked" | "pending" = "pending";

    try {
      // 1. Policy Check (Phase 5: Staging Validation)
      const policyCtx: PolicyContext = {
        agentId: meta.agentId,
        userId: meta.userId,
      };
      
      const policy = await policyEngine.checkAction(toolName, args, policyCtx);
      
      if (!policy.allowed) {
        logger.warn({ toolName, reason: policy.reason }, "Action BLOCKED by policy");
        errorMsg = policy.reason || "Blocked by security policy";
        status = "blocked";
        result = { error: errorMsg, remedy: policy.remedy };
        return result; // SHORT-CIRCUIT
      }

      // 2. Execution logic
      if (toolName === "get_cart") {
        const res = await fetch(`${env.COMMERCE_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await res.json();
      } else if (toolName === "add_to_cart") {
        const res = await fetch(`${env.COMMERCE_URL}/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(args),
        });
        result = await res.json();
      } else if (toolName === "clear_cart") {
        const res = await fetch(`${env.COMMERCE_URL}/cart`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await res.json();
      } else if (toolName === "remove_from_cart") {
        const { productId } = args;
        const res = await fetch(`${env.COMMERCE_URL}/cart/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await res.json();
      } else if (toolName === "list_products") {
        const res = await fetch(`${env.COMMERCE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await res.json();
      } else if (toolName === "search_products") {
        const { query } = args;
        const res = await fetch(
          `${env.COMMERCE_URL}/products/search?q=${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        result = await res.json();
      } else if (toolName === "create_checkout_session") {
        const { priceId } = args;
        const res = await fetch(`${env.COMMERCE_URL}/checkout/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId: priceId || "price_default",
            successUrl: "http://localhost:3000/success",
            cancelUrl: "http://localhost:3000/cancel",
          }),
        });
        result = await res.json();
      } else if (toolName === "send_sms" || toolName === "make_call") {
        const twilioConfig = await getTwilioConfig(token);
        if (!twilioConfig) {
          result = { error: "Twilio not configured for this tenant" };
          errorMsg = result.error;
        } else {
          result = await handleTwilioToolCall(toolName, args, twilioConfig);
          if (result.error) errorMsg = result.error;
        }
      } else if (toolName === "send_reminder_sms") {
        const { to, reminderText, appointmentDate } = args;
        const enhancedBody = appointmentDate 
          ? `Reminder: ${reminderText} for your appointment on ${appointmentDate}`
          : `Reminder: ${reminderText}`;
        
        const twilioConfig = await getTwilioConfig(token);
        if (!twilioConfig) {
          result = { error: "Twilio not configured" };
          errorMsg = result.error;
        } else {
          result = await handleTwilioToolCall("send_sms", { to, message: enhancedBody }, twilioConfig);
          if (result.error) errorMsg = result.error;
        }
      } else {
        result = { error: `Tool ${toolName} not implemented` };
        errorMsg = result.error;
      }

      status = errorMsg ? "failed" : "success";

    } catch (err: any) {
      logger.error({ err, toolName }, "Tool execution crashed");
      errorMsg = err.message || String(err);
      result = { error: errorMsg };
      status = "failed";
    } finally {
      const executionTimeMs = Date.now() - startTime;
      
      // Async Audit Log (Don't await to avoid blocking response)
      this.reportAudit(toolName, args, result, errorMsg, executionTimeMs, status, token, meta).catch(err => {
        logger.error({ err }, "Failed to report audit log");
      });
    }

    return result;
  }

  private static async reportAudit(
    toolName: string,
    args: any,
    result: any,
    errorMessage: string | undefined,
    executionTimeMs: number,
    status: "success" | "failed" | "blocked" | "pending",
    token: string,
    meta: { agentId: string; userId?: string }
  ) {
    try {
      await fetch(`${env.API_URL}/audit-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: meta.agentId,
          userId: meta.userId,
          toolName,
          toolInput: args,
          toolOutput: result,
          status,
          errorMessage,
          executionTimeMs,
        }),
      });
    } catch (err) {
       // Just log, don't crash
       logger.error({ err }, "Network error reporting audit log");
    }
  }
}
