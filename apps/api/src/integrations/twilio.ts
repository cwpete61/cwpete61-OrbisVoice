import { logger } from "../logger";

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneName: string; // For sending SMS
}

export interface SmSMessage {
  to: string;
  message: string;
  mediaUrl?: string[];
}

export interface CallConfig {
  to: string;
  from?: string;
  twiml?: string; // TwiML script for call behavior
  record?: boolean;
  timeout?: number;
}

class TwilioClient {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private baseUrl = "https://api.twilio.com/2010-04-01";

  constructor(config: TwilioConfig) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.phoneNumber = config.phoneName;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    return `Basic ${credentials}`;
  }

  /**
   * Send SMS message
   */
  async sendSms(message: SmSMessage): Promise<string> {
    try {
      const params = new URLSearchParams({
        From: this.phoneNumber,
        To: message.to,
        Body: message.message,
      });

      if (message.mediaUrl && message.mediaUrl.length > 0) {
        message.mediaUrl.forEach((url, index) => {
          params.append(`MediaUrl.${index + 1}`, url);
        });
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error }, "Twilio SMS send failed");
        throw new Error(`Twilio error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ messageSid: data.sid, to: message.to }, "SMS sent successfully");
      return data.sid;
    } catch (err) {
      logger.error({ err, to: message.to }, "Failed to send SMS via Twilio");
      throw err;
    }
  }

  /**
   * Initiate a phone call
   */
  async initiateCall(config: CallConfig): Promise<string> {
    try {
      const params = new URLSearchParams({
        To: config.to,
        From: config.from || this.phoneNumber,
      });

      // If TwiML provided, use it; otherwise use a basic answer and record
      if (config.twiml) {
        params.append("Twiml", config.twiml);
      } else {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Connecting you to an agent.</Say>
  ${config.record ? "<Record/>" : ""}
</Response>`;
        params.append("Twiml", twiml);
      }

      if (config.timeout) {
        params.append("Timeout", config.timeout.toString());
      }

      if (config.record) {
        params.append("Record", "true");
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error }, "Twilio call initiation failed");
        throw new Error(`Twilio error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      logger.info({ callSid: data.sid, to: config.to }, "Call initiated");
      return data.sid;
    } catch (err) {
      logger.error({ err, to: config.to }, "Failed to initiate Twilio call");
      throw err;
    }
  }

  /**
   * Get call information
   */
  async getCall(callSid: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Calls/${callSid}.json`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio call retrieval failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data;
    } catch (err) {
      logger.error({ err, callSid }, "Failed to get call information");
      throw err;
    }
  }

  /**
   * Get available phone numbers
   */
  async getPhoneNumbers(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio phone numbers retrieval failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.incoming_phone_numbers || [];
    } catch (err) {
      logger.error({ err }, "Failed to get Twilio phone numbers");
      throw err;
    }
  }
}

export { TwilioClient };
