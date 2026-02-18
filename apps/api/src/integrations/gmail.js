"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailClient = void 0;
const logger_1 = require("../logger");
class GmailClient {
    constructor(config) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.redirectUri = config.redirectUri;
    }
    /**
     * Get OAuth2 authorization URL
     */
    getAuthUrl(state) {
        const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly");
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline`;
    }
    /**
     * Exchange authorization code for tokens
     */
    async getTokens(code) {
        try {
            const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: this.redirectUri,
                }).toString(),
            });
            if (!response.ok) {
                throw new Error(`Gmail token exchange failed: ${response.status}`);
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || "",
                expiresAt: Date.now() + data.expires_in * 1000,
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to exchange Gmail authorization code");
            throw err;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        try {
            const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: refreshToken,
                    grant_type: "refresh_token",
                }).toString(),
            });
            if (!response.ok) {
                throw new Error(`Gmail token refresh failed: ${response.status}`);
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: refreshToken, // refresh token stays the same
                expiresAt: Date.now() + data.expires_in * 1000,
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to refresh Gmail token");
            throw err;
        }
    }
    /**
     * Send email via Gmail API
     */
    async sendEmail(accessToken, message) {
        try {
            // Create RFC 2822 formatted message
            const headers = {
                "To": message.to,
                "Subject": message.subject,
                "Content-Type": `text/${message.html ? "html" : "plain"}; charset=utf-8`,
            };
            if (message.cc) {
                headers["Cc"] = message.cc.join(", ");
            }
            if (message.bcc) {
                headers["Bcc"] = message.bcc.join(", ");
            }
            const headerString = Object.entries(headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join("\r\n");
            const body = message.html || message.body;
            const rawMessage = `${headerString}\r\n\r\n${body}`;
            const encodedMessage = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
            const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    raw: encodedMessage,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Gmail send failed");
                throw new Error(`Gmail send failed: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ messageId: data.id }, "Email sent successfully");
            return data.id;
        }
        catch (err) {
            logger_1.logger.error({ err, to: message.to }, "Failed to send email via Gmail");
            throw err;
        }
    }
    /**
     * Get list of messages
     */
    async getMessages(accessToken, query, maxResults = 10) {
        try {
            const params = new URLSearchParams({
                maxResults: maxResults.toString(),
            });
            if (query) {
                params.append("q", query);
            }
            const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Gmail list failed: ${response.status}`);
            }
            const data = await response.json();
            return data.messages || [];
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to list Gmail messages");
            throw err;
        }
    }
}
exports.GmailClient = GmailClient;
