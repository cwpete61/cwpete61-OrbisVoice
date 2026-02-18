"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarClient = void 0;
const logger_1 = require("../logger");
class GoogleCalendarClient {
    constructor(config) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.redirectUri = config.redirectUri;
    }
    /**
     * Get OAuth2 authorization URL
     */
    getAuthUrl(state) {
        const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events");
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
                throw new Error(`Calendar token exchange failed: ${response.status}`);
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || "",
                expiresAt: Date.now() + data.expires_in * 1000,
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to exchange Calendar authorization code");
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
                throw new Error(`Calendar token refresh failed: ${response.status}`);
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: refreshToken,
                expiresAt: Date.now() + data.expires_in * 1000,
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to refresh Calendar token");
            throw err;
        }
    }
    /**
     * Get availability for a date
     */
    async getAvailability(accessToken, date, workingHours) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                `timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Calendar availability check failed: ${response.status}`);
            }
            const data = await response.json();
            const events = data.items || [];
            // Calculate free slots
            const start = workingHours?.start || "09:00";
            const end = workingHours?.end || "17:00";
            const slots = [];
            let currentTime = new Date(`${date}T${start}:00Z`);
            const endTime = new Date(`${date}T${end}:00Z`);
            while (currentTime < endTime) {
                const slotEnd = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1 hour slot
                const isAvailable = !events.some((e) => {
                    const eventStart = new Date(e.start.dateTime || e.start.date);
                    const eventEnd = new Date(e.end.dateTime || e.end.date);
                    return currentTime < eventEnd && slotEnd > eventStart;
                });
                if (isAvailable) {
                    slots.push({
                        start: currentTime.toISOString().split("T")[1].substring(0, 5),
                        end: slotEnd.toISOString().split("T")[1].substring(0, 5),
                    });
                }
                currentTime = slotEnd;
            }
            return slots;
        }
        catch (err) {
            logger_1.logger.error({ err, date }, "Failed to get calendar availability");
            throw err;
        }
    }
    /**
     * Create calendar event
     */
    async createEvent(accessToken, event) {
        try {
            const body = {
                summary: event.title,
                description: event.description,
                start: {
                    dateTime: event.startTime,
                    timeZone: event.timezone || "America/New_York",
                },
                end: {
                    dateTime: event.endTime,
                    timeZone: event.timezone || "America/New_York",
                },
            };
            if (event.attendees && event.attendees.length > 0) {
                body.attendees = event.attendees.map((email) => ({ email }));
            }
            const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Calendar event creation failed");
                throw new Error(`Calendar event creation failed: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.info({ eventId: data.id }, "Calendar event created");
            return data.id;
        }
        catch (err) {
            logger_1.logger.error({ err, title: event.title }, "Failed to create calendar event");
            throw err;
        }
    }
    /**
     * Get upcoming events
     */
    async getUpcomingEvents(accessToken, maxResults = 10) {
        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                `maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Calendar list failed: ${response.status}`);
            }
            const data = await response.json();
            return data.items || [];
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to get upcoming calendar events");
            throw err;
        }
    }
}
exports.GoogleCalendarClient = GoogleCalendarClient;
