"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const env_1 = require("../env");
const logger_1 = require("../logger");
class EmailService {
    constructor() {
        this.provider = env_1.env.EMAIL_PROVIDER;
    }
    async sendEmail(options) {
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
            logger_1.logger.warn({ provider: this.provider }, "Unknown email provider, falling back to console");
            this.logToConsole(options);
            return true;
        }
        catch (err) {
            logger_1.logger.error({ err, to: options.to, subject: options.subject }, "Failed to send email");
            return false;
        }
    }
    logToConsole(options) {
        console.log("\n--- EMAIL SENT (MOCK) ---");
        console.log(`To: ${options.to}`);
        console.log(`From: ${env_1.env.EMAIL_FROM_NAME} <${env_1.env.EMAIL_FROM}>`);
        console.log(`Subject: ${options.subject}`);
        console.log("Body (HTML):");
        console.log(options.html);
        if (options.text) {
            console.log("Body (TEXT):");
            console.log(options.text);
        }
        console.log("-------------------------\n");
    }
    async sendViaSendGrid(options) {
        // TODO: Implement actual SendGrid logic when API key is provided
        logger_1.logger.info({ to: options.to }, "SendGrid integration pending API key");
        this.logToConsole(options);
        return true;
    }
    async sendViaResend(options) {
        // TODO: Implement actual Resend logic when API key is provided
        logger_1.logger.info({ to: options.to }, "Resend integration pending API key");
        this.logToConsole(options);
        return true;
    }
    async sendWelcomeEmail(to, name) {
        const subject = `Welcome to OrbisVoice, ${name}!`;
        const html = `<h1>Welcome to OrbisVoice</h1><p>Hi ${name}, we're excited to have you on board!</p>`;
        return this.sendEmail({ to, subject, html });
    }
    async sendUsageWarning(to, percentage) {
        const subject = `OrbisVoice Usage Alert: ${percentage}% Reached`;
        const html = `<p>Your monthly conversation usage has reached ${percentage}%. Consider upgrading to avoid service interruption.</p>`;
        return this.sendEmail({ to, subject, html });
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
