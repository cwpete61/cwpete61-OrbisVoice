import { env } from "../env";
import { logger } from "../logger";
import { handleTwilioToolCall } from "../tools/twilio";

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
  static async execute(toolName: string, args: any, token: string): Promise<any> {
    logger.info({ toolName, args }, "Executing tool call");

    try {
      if (toolName === "get_cart") {
        const res = await fetch(`${env.COMMERCE_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      }

      if (toolName === "add_to_cart") {
        const res = await fetch(`${env.COMMERCE_URL}/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(args),
        });
        return await res.json();
      }

      if (toolName === "clear_cart") {
        const res = await fetch(`${env.COMMERCE_URL}/cart`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      }

      if (toolName === "remove_from_cart") {
        const { productId } = args;
        const res = await fetch(`${env.COMMERCE_URL}/cart/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      }

      if (toolName === "list_products") {
        const res = await fetch(`${env.COMMERCE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
      }

      if (toolName === "search_products") {
        const { query } = args;
        const res = await fetch(
          `${env.COMMERCE_URL}/products/search?q=${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return await res.json();
      }

      if (toolName === "create_checkout_session") {
        const { priceId } = args;
        const res = await fetch(`${env.COMMERCE_URL}/checkout/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId: priceId || "price_default", // Ideally this should be more robust
            successUrl: "http://localhost:3000/success",
            cancelUrl: "http://localhost:3000/cancel",
          }),
        });
        return await res.json();
      }

      if (toolName === "send_sms" || toolName === "make_call") {
        const twilioConfig = await getTwilioConfig(token);
        if (!twilioConfig) {
          return { error: "Twilio not configured for this tenant" };
        }

        return await handleTwilioToolCall(toolName, args, twilioConfig);
      }

      return { error: `Tool ${toolName} not implemented` };
    } catch (err) {
      logger.error({ err, toolName }, "Tool execution failed");
      return { error: String(err) };
    }
  }
}
