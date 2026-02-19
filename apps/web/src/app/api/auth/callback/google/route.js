"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const state = searchParams.get("state");
        // Handle errors from Google
        if (error) {
            const errorDescription = searchParams.get("error_description") || error;
            console.error("Google OAuth error:", errorDescription);
            return server_1.NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(errorDescription)}`, request.url));
        }
        // Validate code exists
        if (!code) {
            console.error("Missing authorization code from Google");
            return server_1.NextResponse.redirect(new URL("/auth/error?error=Missing+authorization+code", request.url));
        }
        // Exchange code for token with our Fastify API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const tokenResponse = await fetch(`${apiUrl}/auth/google/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json().catch(() => ({}));
            console.error("Token exchange failed:", errorData);
            return server_1.NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(errorData.message || "Authentication failed")}`, request.url));
        }
        const data = await tokenResponse.json();
        if (data.ok && data.data?.token) {
            // Redirect to dashboard with token in query param (client will move to localStorage)
            const dashboardUrl = new URL("/dashboard", request.url);
            dashboardUrl.searchParams.set("token", data.data.token);
            return server_1.NextResponse.redirect(dashboardUrl);
        }
        else {
            console.error("Invalid token response:", data);
            return server_1.NextResponse.redirect(new URL("/auth/error?error=Invalid+authentication+response", request.url));
        }
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("OAuth callback error:", errorMsg);
        return server_1.NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(errorMsg)}`, request.url));
    }
}
