"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioTools = void 0;
exports.handleTwilioToolCall = handleTwilioToolCall;
const twilio_1 = require("twilio");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.twilioTools = [
    {
        name: "send_sms",
        description: "Send an SMS message to a phone number",
        parameters: {
            type: "OBJECT",
            properties: {
                to: { type: "STRING", description: "The phone number to send the SMS to" },
                message: { type: "STRING", description: "The message body" },
            },
            required: ["to", "message"],
        },
    },
    {
        name: "make_call",
        description: "Make a phone call to a number",
        parameters: {
            type: "OBJECT",
            properties: {
                to: { type: "STRING", description: "The phone number to call" },
                message: { type: "STRING", description: "The message to speak when the call is answered" },
            },
            required: ["to", "message"],
        },
    },
];
async function handleTwilioToolCall(toolName, args, tenantId) {
    // Fetch config
    const config = await prisma.tenantTwilioConfig.findUnique({
        where: { tenantId },
    });
    if (!config) {
        throw new Error("Twilio not configured for this tenant");
    }
    const client = new twilio_1.Twilio(config.accountSid, config.authToken);
    if (toolName === "send_sms") {
        try {
            const result = await client.messages.create({
                body: args.message,
                from: config.phoneNumber,
                to: args.to,
            });
            return { success: true, sid: result.sid, status: result.status };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    if (toolName === "make_call") {
        try {
            const result = await client.calls.create({
                twiml: `<Response><Say>${args.message}</Say></Response>`,
                to: args.to,
                from: config.phoneNumber,
            });
            return { success: true, sid: result.sid, status: result.status };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    throw new Error(`Unknown tool: ${toolName}`);
}
