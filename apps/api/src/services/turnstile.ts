import { env } from "../env";
import { logger } from "../logger";
import { http } from "../lib/http";

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret || env.NODE_ENV === "development") {
    logger.warn("Skipping Turnstile verification: Not set or running in development");
    return true;
  }

  try {
    const result = await http.post<{ success: boolean; "error-codes"?: string[] }>(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: secret,
        response: token,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!result.ok) {
      logger.warn(
        { status: result.status, error: result.error, token },
        "Turnstile verification failed"
      );
      return false;
    }

    const data = result.data;
    if (!data || !data.success) {
      logger.warn({ errorCodes: data?.["error-codes"], token }, "Turnstile verification failed");
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err }, "Turnstile verification error");
    return false;
  }
}
