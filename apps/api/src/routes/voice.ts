import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import * as jwt from "jsonwebtoken";
import { env } from "../env";

export async function voiceRoutes(fastify: FastifyInstance) {
  /**
   * Twilio Inbound Webhook
   * Hits here when someone calls a Twilio number.
   */
  fastify.post("/voice/inbound", async (request: FastifyRequest, reply) => {
    const body = request.body as any;
    const to = body.To;
    const from = body.From;
    const callSid = body.CallSid;

    logger.info({ to, from, callSid }, "Inbound call received");

    try {
      // 1. Find the agent associated with this phone number
      const agent = await prisma.agent.findUnique({
        where: { phoneNumber: to },
        include: { tenant: true }
      });

      if (!agent) {
        logger.warn({ to }, "No agent mapped to this phone number");
        return reply.type("text/xml").send(`
          <Response>
            <Say>I'm sorry, this number is not assigned to a voice agent.</Say>
            <Hangup/>
          </Response>
        `);
      }

      // 2. Generate a temporary session token for the Voice Gateway
      // This token allows the gateway to fetch agent config and record usage
      const sessionToken = jwt.sign(
        { 
          userId: "twilio-system", 
          tenantId: agent.tenantId, 
          agentId: agent.id,
          callSid 
        },
        env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // 3. Construct TwiML
      // We use <Connect><Stream> to bridge to our WebSocket Gateway
      const gatewayUrl = env.VOICE_GATEWAY_URL.replace("http", "ws"); // Ensure it uses ws/wss
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Connect>
            <ConversationRelay url="${gatewayUrl}" ttsProvider="google" voice="en-US-Journey-F">
              <Parameter name="token" value="${sessionToken}" />
              <Parameter name="agentId" value="${agent.id}" />
              <Parameter name="inbound" value="true" />
            </ConversationRelay>
          </Connect>
        </Response>
      `.trim();

      return reply.type("text/xml").send(twiml);
    } catch (err) {
      logger.error({ err }, "Error handling inbound call");
      return reply.type("text/xml").send(`
        <Response>
          <Say>System error. Please try again later.</Say>
        </Response>
      `);
    }
  });
}
