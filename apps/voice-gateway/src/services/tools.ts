import { Tool, Type } from "@google/genai";

export const ALL_VOICE_TOOL_NAMES = [
  "get_cart",
  "add_to_cart",
  "clear_cart",
  "list_products",
  "search_products",
  "remove_from_cart",
  "create_checkout_session",
  "send_sms",
  "make_call",
  "send_reminder_sms",
] as const;

export const COMMERCE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "get_cart",
        description: "Get the current items in the user's shopping cart.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "add_to_cart",
        description: "Add a product to the user's shopping cart.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: {
              type: Type.STRING,
              description: "The ID of the product to add (usually a Stripe Product ID).",
            },
            quantity: {
              type: Type.NUMBER,
              description: "The quantity to add (default is 1).",
            },
          },
          required: ["productId"],
        },
      },
      {
        name: "clear_cart",
        description: "Remove all items from the user's shopping cart.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "list_products",
        description: "Get a list of available products in the store.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "search_products",
        description: "Search for specific products by name or description.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The name or keywords to search for.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "remove_from_cart",
        description: "Remove a specific product from the user's cart.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: {
              type: Type.STRING,
              description: "The ID of the product to remove.",
            },
          },
          required: ["productId"],
        },
      },
      {
        name: "create_checkout_session",
        description: "Start the checkout process and get a link to pay.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            priceId: {
              type: Type.STRING,
              description:
                "The Stripe Price ID for the product to checkout with (for non-cart scenarios) or a generic value if using cart.",
            },
          },
        },
      },
      {
        name: "send_sms",
        description: "Send an SMS message to a phone number.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: {
              type: Type.STRING,
              description: "The destination phone number in E.164 format.",
            },
            message: {
              type: Type.STRING,
              description: "The SMS message body to send.",
            },
          },
          required: ["to", "message"],
        },
      },
      {
        name: "make_call",
        description: "Place a phone call and speak a short message.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: {
              type: Type.STRING,
              description: "The destination phone number in E.164 format.",
            },
            message: {
              type: Type.STRING,
              description: "The message to read when the call is answered.",
            },
          },
          required: ["to", "message"],
        },
      },
      {
        name: "send_reminder_sms",
        description: "Send a reminder SMS message for an appointment or follow-up.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: {
              type: Type.STRING,
              description: "The destination phone number in E.164 format.",
            },
            reminderText: {
              type: Type.STRING,
              description: "The specific reminder content.",
            },
            appointmentDate: {
              type: Type.STRING,
              description: "The date and time of the appointment (optional).",
            },
          },
          required: ["to", "reminderText"],
        },
      },
    ],
  },
];

export function buildToolsForNames(enabledToolNames: string[]): Tool[] {
  const enabled = new Set(enabledToolNames);
  return COMMERCE_TOOLS.map((tool) => ({
    ...tool,
    functionDeclarations: (tool.functionDeclarations || []).filter((fn) =>
      enabled.has(fn.name || "")
    ),
  })).filter((tool) => (tool.functionDeclarations || []).length > 0);
}
