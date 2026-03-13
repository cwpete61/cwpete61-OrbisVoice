import { env } from "../env";
import { logger } from "../logger";

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    logger.warn("TURNSTILE_SECRET_KEY not set - skipping verification");
    return true;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secret,
        response: token,
      }).toString(),
    });

    const data = (await response.json()) as { success: boolean; "error-codes"?: string[] };
    
    if (!data.success) {
      logger.warn({ errorCodes: data["error-codes"], token }, "Turnstile verification failed");
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err }, "Turnstile verification error");
    return false;
  }
}
