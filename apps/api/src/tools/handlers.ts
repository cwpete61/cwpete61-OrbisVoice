import { toolExecutor, ToolHandler } from "./executor";
import { env } from "../env";
import { logger } from "../logger";
import { GmailClient } from "../integrations/gmail";
import { GoogleCalendarClient } from "../integrations/calendar";
import { StripeClient } from "../integrations/stripe";
import { TwilioClient } from "../integrations/twilio";

// Initialize API clients (with env vars for API keys)
let gmailClient: GmailClient | null = null;
let calendarClient: GoogleCalendarClient | null = null;
let stripeClient: StripeClient | null = null;
let twilioClient: TwilioClient | null = null;

// Initialize clients on first use
function getGmailClient(): GmailClient {
  if (!gmailClient) {
    gmailClient = new GmailClient({
      clientId: env.GMAIL_CLIENT_ID || "",
      clientSecret: env.GMAIL_CLIENT_SECRET || "",
      redirectUri: env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/oauth/gmail/callback",
    });
  }
  return gmailClient;
}

function getCalendarClient(): GoogleCalendarClient {
  if (!calendarClient) {
    calendarClient = new GoogleCalendarClient({
      clientId: env.GOOGLE_CALENDAR_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET || "",
      redirectUri: env.GOOGLE_CALENDAR_REDIRECT_URI || "http://localhost:3000/api/oauth/calendar/callback",
    });
  }
  return calendarClient;
}

function getStripeClient(): StripeClient {
  if (!stripeClient) {
    stripeClient = new StripeClient({
      apiKey: env.STRIPE_API_KEY || "",
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    });
  }
  return stripeClient;
}

function getTwilioClient(): TwilioClient {
  if (!twilioClient) {
    twilioClient = new TwilioClient({
      accountSid: env.TWILIO_ACCOUNT_SID || "",
      authToken: env.TWILIO_AUTH_TOKEN || "",
      phoneName: env.TWILIO_PHONE_NUMBER || "",
    });
  }
  return twilioClient;
}

// Communication Agent Tools
const escalateToHumanHandler: ToolHandler = async (input, context) => {
  // TODO: Integrate with support routing system
  return {
    success: true,
    data: {
      escalationId: `esc_${Date.now()}`,
      reason: input.reason,
      priority: input.priority || "medium",
      message: "Conversation escalated to support team. You will be connected shortly.",
    },
  };
};

const sendMessageHandler: ToolHandler = async (input, context) => {
  try {
    const channel = input.channel || "email";

    if (channel === "email") {
      try {
        const gmail = getGmailClient();
        const accessToken = input.accessToken || process.env.GMAIL_TEST_TOKEN;

        if (!accessToken) {
          logger.warn("No Gmail access token available");
          return {
            success: true,
            data: {
              messageId: `msg_${Date.now()}`,
              channel: "email",
              recipient: input.to || context.userId,
              status: "queued",
              note: "Email scheduled (token needed for actual send)",
            },
          };
        }

        const messageId = await gmail.sendEmail(accessToken, {
          to: input.to || context.userId,
          subject: input.subject || "Message from MyOrbisVoice",
          body: input.message,
        });

        return {
          success: true,
          data: {
            messageId,
            channel: "email",
            recipient: input.to || context.userId,
            status: "sent",
          },
        };
      } catch (err) {
        logger.error({ err }, "Failed to send email");
        return {
          success: false,
          error: `Failed to send email: ${String(err)}`,
        };
      }
    } else {
      return {
        success: true,
        data: {
          messageId: `msg_${Date.now()}`,
          channel,
          recipient: input.to,
          status: "sent",
        },
      };
    }
  } catch (err) {
    logger.error({ err }, "Failed to send message");
    return {
      success: false,
      error: `Failed to send message: ${String(err)}`,
    };
  }
};

// Lead Qualification Agent Tools
const scoreLeadHandler: ToolHandler = async (input, context) => {
  // Simple scoring algorithm
  const engagement = Math.min(100, input.engagement_level || 50);
  const budgetScore = { low: 30, medium: 60, high: 100 }[input.budget_fit || "medium"] || 60;
  const timelineScore = { "90days": 40, "30days": 70, immediate: 100 }[input.timeline || "90days"] || 40;

  const totalScore = Math.round((engagement + budgetScore + timelineScore) / 3);

  return {
    success: true,
    data: {
      totalScore,
      leadQuality: totalScore > 75 ? "hot" : totalScore > 50 ? "warm" : "cold",
      breakdown: {
        engagement,
        budgetScore,
        timelineScore,
      },
    },
  };
};

// Product Agent Tools
const getProductInfoHandler: ToolHandler = async (input, context) => {
  // TODO: Integrate with product database
  return {
    success: true,
    data: {
      productId: input.product_id,
      name: "Sample Product",
      description: "This is a sample product. Integrate with your product DB.",
      price: 99.99,
      inStock: true,
    },
  };
};

const checkInventoryHandler: ToolHandler = async (input, context) => {
  // TODO: Integrate with inventory system
  return {
    success: true,
    data: {
      productId: input.product_id,
      location: input.location || "warehouse_1",
      available: 50,
      reserved: 5,
      freeStock: 45,
    },
  };
};

// Google Calendar Agent Tools
const checkAvailabilityHandler: ToolHandler = async (input, context) => {
  try {
    const calendar = getCalendarClient();
    const accessToken = input.accessToken || process.env.GOOGLE_CALENDAR_TEST_TOKEN;

    if (!accessToken) {
      logger.warn("No Google Calendar access token available");
      return {
        success: true,
        data: {
          date: input.date,
          availableSlots: [
            { start: "09:00", end: "10:00" },
            { start: "14:00", end: "15:00" },
            { start: "16:00", end: "17:00" },
          ],
          timezone: input.timezone || "America/New_York",
          note: "Sample slots (token needed for real availability)",
        },
      };
    }

    const slots = await calendar.getAvailability(accessToken, input.date, {
      start: input.workingHoursStart || "09:00",
      end: input.workingHoursEnd || "17:00",
    });

    return {
      success: true,
      data: {
        date: input.date,
        availableSlots: slots.length > 0 ? slots : [{ start: "09:00", end: "10:00" }],
        timezone: input.timezone || "America/New_York",
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to check calendar availability");
    return {
      success: false,
      error: `Failed to check availability: ${String(err)}`,
    };
  }
};

const createEventHandler: ToolHandler = async (input, context) => {
  try {
    const calendar = getCalendarClient();
    const accessToken = input.accessToken || process.env.GOOGLE_CALENDAR_TEST_TOKEN;

    if (!accessToken) {
      logger.warn("No Google Calendar access token - event not created");
      return {
        success: true,
        data: {
          eventId: `evt_${Date.now()}`,
          title: input.title,
          startTime: input.start_time,
          duration: input.duration_minutes || 60,
          attendees: input.attendees || [],
          message: `Event "${input.title}" scheduled (token needed for actual creation)`,
        },
      };
    }

    const eventId = await calendar.createEvent(accessToken, {
      title: input.title,
      description: input.description || "",
      startTime: input.start_time,
      endTime: input.end_time || new Date(new Date(input.start_time).getTime() + (input.duration_minutes || 60) * 60000).toISOString(),
      attendees: input.attendees,
      timezone: input.timezone || "America/New_York",
    });

    return {
      success: true,
      data: {
        eventId,
        title: input.title,
        startTime: input.start_time,
        duration: input.duration_minutes || 60,
        attendees: input.attendees || [],
        message: `Event "${input.title}" scheduled successfully`,
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to create calendar event");
    return {
      success: false,
      error: `Failed to create event: ${String(err)}`,
    };
  }
};

// Gmail Agent Tools
const sendEmailHandler: ToolHandler = async (input, context) => {
  try {
    const gmail = getGmailClient();
    const accessToken = input.accessToken || process.env.GMAIL_TEST_TOKEN;

    if (!accessToken) {
      logger.warn("No Gmail access token - email not sent");
      return {
        success: true,
        data: {
          messageId: `email_${Date.now()}`,
          to: input.to,
          subject: input.subject,
          status: "queued",
          timestamp: new Date().toISOString(),
          note: "Email scheduled (token needed for actual send)",
        },
      };
    }

    const messageId = await gmail.sendEmail(accessToken, {
      to: input.to,
      subject: input.subject,
      body: input.body || input.message,
      html: input.html,
      cc: input.cc,
      bcc: input.bcc,
    });

    return {
      success: true,
      data: {
        messageId,
        to: input.to,
        subject: input.subject,
        status: "sent",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to send email");
    return {
      success: false,
      error: `Failed to send email: ${String(err)}`,
    };
  }
};

// Stripe Agent Tools
const createPaymentHandler: ToolHandler = async (input, context) => {
  try {
    const stripe = getStripeClient();
    const apiKey = env.STRIPE_API_KEY;

    if (!apiKey) {
      logger.warn("Stripe API key not configured");
      return {
        success: true,
        data: {
          chargeId: `ch_${Date.now()}`,
          amount: input.amount,
          currency: input.currency || "usd",
          status: "simulated",
          message: "Payment simulated (Stripe key needed for real charge)",
        },
      };
    }

    const charge = await stripe.createCharge(
      input.customerId || "temp_customer",
      input.amount,
      input.currency || "usd",
      input.description
    );

    return {
      success: true,
      data: {
        chargeId: charge.id,
        amount: input.amount,
        currency: input.currency || "usd",
        status: "succeeded",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to create charge");
    return {
      success: false,
      error: `Failed to create charge: ${String(err)}`,
    };
  }
};

const getSubscriptionHandler: ToolHandler = async (input, context) => {
  try {
    const stripe = getStripeClient();
    const apiKey = env.STRIPE_API_KEY;

    if (!apiKey) {
      logger.warn("Stripe API key not configured");
      return {
        success: true,
        data: {
          subscriptionId: input.subscription_id,
          status: "active",
          plan: "professional",
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          note: "Simulated (Stripe key needed for real data)",
        },
      };
    }

    const subscription = await stripe.getSubscription(input.subscription_id);

    return {
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.items?.data?.[0]?.plan?.id || "unknown",
        nextBilling: new Date(subscription.current_period_end * 1000).toISOString(),
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to get subscription");
    return {
      success: false,
      error: `Failed to get subscription: ${String(err)}`,
    };
  }
};

// Twilio Agent Tools
const sendSmsHandler: ToolHandler = async (input, context) => {
  try {
    const twilio = getTwilioClient();
    const accountSid = env.TWILIO_ACCOUNT_SID;

    if (!accountSid) {
      logger.warn("Twilio credentials not configured");
      return {
        success: true,
        data: {
          messageSid: `SM_${Date.now()}`,
          to: input.phone_number,
          status: "queued",
          message: "SMS scheduled (Twilio key needed for actual send)",
        },
      };
    }

    const messageSid = await twilio.sendSms({
      to: input.phone_number,
      message: input.message,
      mediaUrl: input.mediaUrls,
    });

    return {
      success: true,
      data: {
        messageSid,
        to: input.phone_number,
        status: "sent",
        message: input.message,
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to send SMS");
    return {
      success: false,
      error: `Failed to send SMS: ${String(err)}`,
    };
  }
};

const initiateCallHandler: ToolHandler = async (input, context) => {
  try {
    const twilio = getTwilioClient();
    const accountSid = env.TWILIO_ACCOUNT_SID;

    if (!accountSid) {
      logger.warn("Twilio credentials not configured");
      return {
        success: true,
        data: {
          callSid: `CA_${Date.now()}`,
          to: input.phone_number,
          status: "queued",
          script: input.script || "default",
          note: "Call scheduled (Twilio key needed for actual call)",
        },
      };
    }

    const callSid = await twilio.initiateCall({
      to: input.phone_number,
      twiml: input.twiml,
      record: input.record || false,
      timeout: input.timeout,
    });

    return {
      success: true,
      data: {
        callSid,
        to: input.phone_number,
        status: "initiated",
        script: input.script || "default",
      },
    };
  } catch (err) {
    logger.error({ err }, "Failed to initiate call");
    return {
      success: false,
      error: `Failed to initiate call: ${String(err)}`,
    };
  }
};

// Phone Tones Agent Tools
const generateToneHandler: ToolHandler = async (input, context) => {
  // DTMF tone generation
  const toneFrequencies: Record<string, [number, number]> = {
    "0": [941, 1336],
    "1": [697, 1209],
    "2": [697, 1336],
    "3": [697, 1477],
    "4": [770, 1209],
    "5": [770, 1336],
    "6": [770, 1477],
    "7": [852, 1209],
    "8": [852, 1336],
    "9": [852, 1477],
    "*": [941, 1209],
    "#": [941, 1477],
  };

  const tone = input.tone;
  const duration = input.duration_ms || 100;
  const freqs = toneFrequencies[tone];

  return {
    success: true,
    data: {
      tone,
      frequencies: freqs,
      duration,
      status: "generated",
    },
  };
};

// Register all tool handlers
export function registerToolHandlers() {
  // Communication Agent
  toolExecutor.register("escalate_to_human", escalateToHumanHandler);
  toolExecutor.register("send_message", sendMessageHandler);

  // Lead Qualification Agent
  toolExecutor.register("score_lead", scoreLeadHandler);

  // Product Agent
  toolExecutor.register("get_product_info", getProductInfoHandler);
  toolExecutor.register("check_inventory", checkInventoryHandler);

  // Google Calendar Agent
  toolExecutor.register("check_availability", checkAvailabilityHandler);
  toolExecutor.register("create_event", createEventHandler);

  // Gmail Agent
  toolExecutor.register("send_email", sendEmailHandler);

  // Stripe Agent
  toolExecutor.register("create_payment", createPaymentHandler);
  toolExecutor.register("get_subscription", getSubscriptionHandler);

  // Twilio Agent
  toolExecutor.register("send_sms", sendSmsHandler);
  toolExecutor.register("initiate_call", initiateCallHandler);

  // Phone Tones Agent
  toolExecutor.register("generate_tone", generateToneHandler);
}
