import { Twilio } from "twilio";

interface TwilioConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
}

export const twilioTools = [
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

export async function handleTwilioToolCall(toolName: string, args: any, config: TwilioConfig) {
    if (!config) {
        throw new Error("Twilio not configured for this tenant");
    }

    const client = new Twilio(config.accountSid, config.authToken);

    if (toolName === "send_sms") {
        try {
            const result = await client.messages.create({
                body: args.message,
                from: config.phoneNumber,
                to: args.to,
            });
            return { success: true, sid: result.sid, status: result.status };
        } catch (error: any) {
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
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    throw new Error(`Unknown tool: ${toolName}`);
}
