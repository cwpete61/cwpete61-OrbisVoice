import { env } from "../env";
import { logger } from "../logger";

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private provider: string;

    constructor() {
        this.provider = env.EMAIL_PROVIDER;
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            if (this.provider === "console") {
                this.logToConsole(options);
                return true;
            }

            if (this.provider === "sendgrid") {
                return await this.sendViaSendGrid(options);
            }

            if (this.provider === "resend") {
                return await this.sendViaResend(options);
            }

            logger.warn({ provider: this.provider }, "Unknown email provider, falling back to console");
            this.logToConsole(options);
            return true;
        } catch (err) {
            logger.error({ err, to: options.to, subject: options.subject }, "Failed to send email");
            return false;
        }
    }

    private logToConsole(options: EmailOptions) {
        console.log("\n--- EMAIL SENT (MOCK) ---");
        console.log(`To: ${options.to}`);
        console.log(`From: ${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`);
        console.log(`Subject: ${options.subject}`);
        console.log("Body (HTML):");
        console.log(options.html);
        if (options.text) {
            console.log("Body (TEXT):");
            console.log(options.text);
        }
        console.log("-------------------------\n");
    }

    private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
        // TODO: Implement actual SendGrid logic when API key is provided
        logger.info({ to: options.to }, "SendGrid integration pending API key");
        this.logToConsole(options);
        return true;
    }

    private async sendViaResend(options: EmailOptions): Promise<boolean> {
        // TODO: Implement actual Resend logic when API key is provided
        logger.info({ to: options.to }, "Resend integration pending API key");
        this.logToConsole(options);
        return true;
    }

    async sendWelcomeEmail(to: string, name: string) {
        const subject = `Welcome to OrbisVoice, ${name}!`;
        const html = `<h1>Welcome to OrbisVoice</h1><p>Hi ${name}, we're excited to have you on board!</p>`;
        return this.sendEmail({ to, subject, html });
    }

    async sendUsageWarning(to: string, percentage: number) {
        const subject = `OrbisVoice Usage Alert: ${percentage}% Reached`;
        const html = `<p>Your monthly conversation usage has reached ${percentage}%. Consider upgrading to avoid service interruption.</p>`;
        return this.sendEmail({ to, subject, html });
    }
}

export const emailService = new EmailService();
