export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

export const AGENT_TOOLS: Record<string, ToolDefinition[]> = {
  CommunicationAgent: [
    {
      name: "escalate_to_human",
      description: "Escalate conversation to human support agent",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["reason"],
      },
    },
    {
      name: "send_message",
      description: "Send a message to the user",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Message content" },
          channel: { type: "string", enum: ["email", "sms", "chat"] },
        },
        required: ["message"],
      },
    },
  ],
  LeadQualificationAgent: [
    {
      name: "score_lead",
      description: "Score a lead based on engagement and fit",
      parameters: {
        type: "object",
        properties: {
          engagement_level: { type: "number", minimum: 0, maximum: 100 },
          budget_fit: { type: "string", enum: ["low", "medium", "high"] },
          timeline: { type: "string", enum: ["immediate", "30days", "90days"] },
        },
        required: ["engagement_level"],
      },
    },
  ],
  ProductAgent: [
    {
      name: "get_product_info",
      description: "Retrieve detailed product information",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          category: { type: "string" },
        },
        required: ["product_id"],
      },
    },
    {
      name: "check_inventory",
      description: "Check product availability and stock",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          location: { type: "string" },
        },
        required: ["product_id"],
      },
    },
  ],
  GoogleCalendarAgent: [
    {
      name: "check_availability",
      description: "Check available time slots for scheduling",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD format" },
          duration_minutes: { type: "number", minimum: 15 },
        },
        required: ["date"],
      },
    },
    {
      name: "create_event",
      description: "Schedule a calendar event",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          start_time: { type: "string", description: "ISO 8601 format" },
          duration_minutes: { type: "number" },
          attendees: { type: "array", items: { type: "string" } },
        },
        required: ["title", "start_time"],
      },
    },
  ],
  GmailAgent: [
    {
      name: "send_email",
      description: "Send an email",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Email address" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["to", "subject", "body"],
      },
    },
  ],
  StripeAgent: [
    {
      name: "create_payment",
      description: "Create a payment charge",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount in cents" },
          currency: { type: "string", default: "usd" },
          description: { type: "string" },
        },
        required: ["amount"],
      },
    },
    {
      name: "get_subscription",
      description: "Retrieve subscription details",
      parameters: {
        type: "object",
        properties: {
          subscription_id: { type: "string" },
        },
        required: ["subscription_id"],
      },
    },
  ],
  TwilioAgent: [
    {
      name: "send_sms",
      description: "Send SMS message",
      parameters: {
        type: "object",
        properties: {
          phone_number: { type: "string", description: "E.164 format +1234567890" },
          message: { type: "string" },
        },
        required: ["phone_number", "message"],
      },
    },
    {
      name: "initiate_call",
      description: "Initiate outbound call",
      parameters: {
        type: "object",
        properties: {
          phone_number: { type: "string" },
          script: { type: "string" },
        },
        required: ["phone_number"],
      },
    },
  ],
  PhoneTonesAgent: [
    {
      name: "generate_tone",
      description: "Generate DTMF phone tone",
      parameters: {
        type: "object",
        properties: {
          tone: { type: "string", enum: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#"] },
          duration_ms: { type: "number", default: 100 },
        },
        required: ["tone"],
      },
    },
  ],
};
