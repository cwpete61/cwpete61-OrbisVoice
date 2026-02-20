"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarAgent = void 0;
class GoogleCalendarAgent {
    constructor() {
        this.name = "google_calendar";
        this.description = "Schedules and manages calendar events via Google Calendar.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "GoogleCalendarAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.GoogleCalendarAgent = GoogleCalendarAgent;
