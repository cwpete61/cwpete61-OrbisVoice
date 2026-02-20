"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = googleAuthRoutes;
const zod_1 = require("zod");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importDefault(require("axios"));
const db_js_1 = require("../db.js");
const env_js_1 = require("../env.js");
const auth_js_1 = require("../middleware/auth.js");
// Initialize Google OAuth client
const googleClient = new google_auth_library_1.OAuth2Client(env_js_1.env.GOOGLE_CLIENT_ID, env_js_1.env.GOOGLE_CLIENT_SECRET);
const getGoogleConfig = async (tenantId) => {
    try {
        let config;
        try {
            if (tenantId) {
                config = await db_js_1.prisma.tenantGoogleConfig.findUnique({
                    where: { tenantId },
                });
            }
            if (!config) {
                config = await db_js_1.prisma.googleAuthConfig.findUnique({
                    where: { id: "google-auth-config" },
                }); // Cast to match shape
            }
        }
        catch (dbError) {
            console.error("Database query error:", dbError);
            throw dbError;
        }
        return {
            clientId: config?.clientId || env_js_1.env.GOOGLE_CLIENT_ID,
            clientSecret: config?.clientSecret || env_js_1.env.GOOGLE_CLIENT_SECRET,
            redirectUri: config?.redirectUri ||
                env_js_1.env.GOOGLE_REDIRECT_URI ||
                "http://localhost:3000/auth/google/callback",
            enabled: config?.enabled ?? (!!config?.clientId || !!env_js_1.env.GOOGLE_CLIENT_ID),
        };
    }
    catch (error) {
        console.error("getGoogleConfig error:", error);
        throw error;
    }
};
const GoogleAuthTokenSchema = zod_1.z.object({
    token: zod_1.z.string().optional(),
    code: zod_1.z.string().optional(),
}).refine((data) => data.token || data.code, {
    message: "Token or code is required",
});
// Test endpoint to verify endpoint is working
async function googleAuthRoutes(fastify) {
    // Simple test endpoint
    fastify.get("/auth/test", async (request, reply) => {
        return reply.send({ ok: true, message: "API is working" });
    });
    // Get Google Auth URL for frontend
    fastify.get("/auth/google/url", async (request, reply) => {
        try {
            // First, log that we received the request
            console.log("DEBUG: /auth/google/url endpoint called");
            fastify.log.info("DEBUG: /auth/google/url endpoint called");
            // Try to get the config  
            console.log("DEBUG: Calling getGoogleConfig()...");
            let googleConfig;
            try {
                googleConfig = await getGoogleConfig();
                console.log("DEBUG: googleConfig result:", {
                    clientIdExists: !!googleConfig.clientId,
                    enabled: googleConfig.enabled
                });
            }
            catch (configErr) {
                console.error("DEBUG: Error in getGoogleConfig:", configErr);
                throw configErr;
            }
            if (!googleConfig.clientId || !googleConfig.enabled) {
                console.log("DEBUG: Missing clientId or not enabled");
                return reply.code(503).send({
                    ok: false,
                    message: "Google OAuth not configured",
                });
            }
            const redirectUrl = googleConfig.redirectUri;
            const scopes = [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ];
            console.log("DEBUG: Creating OAuth2Client...");
            const client = new google_auth_library_1.OAuth2Client(googleConfig.clientId, googleConfig.clientSecret, redirectUrl);
            console.log("DEBUG: Generating auth URL...");
            const url = client.generateAuthUrl({
                client_id: googleConfig.clientId,
                redirect_uri: redirectUrl,
                access_type: "online",
                scope: scopes,
            });
            console.log("DEBUG: Successfully generated URL, length:", url.length);
            return reply.send({
                ok: true,
                data: { url },
            });
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("DEBUG: Caught error:", errorMsg);
            console.error("DEBUG: Full error:", err);
            fastify.log.error({ message: errorMsg }, "Error in /auth/google/url");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Handle Google OAuth callback
    fastify.post("/auth/google/callback", async (request, reply) => {
        try {
            const body = GoogleAuthTokenSchema.parse(request.body);
            let googleProfile;
            let accessToken = body.token;
            if (body.code) {
                const googleConfig = await getGoogleConfig();
                if (!googleConfig.clientId || !googleConfig.clientSecret || !googleConfig.enabled) {
                    return reply.code(503).send({
                        ok: false,
                        message: "Google OAuth not configured",
                    });
                }
                const redirectUrl = googleConfig.redirectUri;
                googleClient.setCredentials({
                    access_token: undefined,
                });
                try {
                    const exchangeClient = new google_auth_library_1.OAuth2Client(googleConfig.clientId, googleConfig.clientSecret, redirectUrl);
                    const { tokens } = await exchangeClient.getToken({
                        code: body.code,
                        redirect_uri: redirectUrl,
                    });
                    accessToken = tokens.access_token || undefined;
                }
                catch (err) {
                    fastify.log.error({ err }, "Failed to exchange Google code");
                    return reply.code(401).send({
                        ok: false,
                        message: "Invalid Google code",
                    });
                }
            }
            if (!accessToken) {
                return reply.code(400).send({
                    ok: false,
                    message: "Token is required",
                });
            }
            try {
                const response = await axios_1.default.get("https://www.googleapis.com/oauth2/v2/userinfo", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                googleProfile = response.data;
            }
            catch (err) {
                fastify.log.error({ err }, "Failed to fetch Google profile");
                return reply.code(401).send({
                    ok: false,
                    message: "Invalid Google token",
                });
            }
            const googleId = googleProfile.id;
            const googleEmail = googleProfile.email;
            const googleName = googleProfile.name;
            const googleProfilePicture = googleProfile.picture;
            // Check if user with this Google ID exists
            let user = await db_js_1.prisma.user.findUnique({
                where: { googleId },
            });
            if (!user) {
                // Check if user with this email exists
                const existingUser = await db_js_1.prisma.user.findUnique({
                    where: { email: googleEmail },
                });
                if (existingUser) {
                    // Link Google account to existing user
                    user = await db_js_1.prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            googleId,
                            googleEmail,
                            googleName,
                            googleProfilePicture,
                            googleAuthProvider: "google",
                        },
                    });
                }
                else {
                    // Create new user with Google account
                    // Find or create tenant
                    const tenant = await db_js_1.prisma.tenant.create({
                        data: {
                            name: `${googleName}'s Workspace`,
                        },
                    });
                    user = await db_js_1.prisma.user.create({
                        data: {
                            tenantId: tenant.id,
                            email: googleEmail,
                            name: googleName,
                            googleId,
                            googleEmail,
                            googleName,
                            googleProfilePicture,
                            googleAuthProvider: "google",
                        },
                    });
                }
            }
            else if (!user.googleProfilePicture ||
                user.googleProfilePicture !== googleProfilePicture) {
                // Update profile picture if changed
                user = await db_js_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleProfilePicture,
                        googleName,
                    },
                });
            }
            // Generate JWT
            const token = fastify.jwt.sign({ userId: user.id, tenantId: user.tenantId, email: user.email }, { expiresIn: "7d" });
            fastify.log.info({ userId: user.id, googleId }, "User authenticated with Google");
            return reply.send({
                ok: true,
                message: "Google authentication successful",
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        username: user.username,
                        avatar: user.avatar || googleProfilePicture,
                    },
                },
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    ok: false,
                    message: "Validation error",
                    data: err.errors,
                });
            }
            fastify.log.error({ err }, "Google authentication error");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get Google Calendar authorization URL for authenticated users
    fastify.get("/auth/google/calendar-url", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user?.userId;
            if (!userId) {
                return reply.code(401).send({
                    ok: false,
                    message: "Unauthorized",
                });
            }
            const tenantId = request.user?.tenantId;
            const googleConfig = await getGoogleConfig(tenantId);
            if (!googleConfig.clientId || !googleConfig.enabled) {
                return reply.code(503).send({
                    ok: false,
                    message: "Google OAuth not configured",
                });
            }
            const redirectUrl = googleConfig.redirectUri;
            const scopes = [
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/userinfo.email",
            ];
            const client = new google_auth_library_1.OAuth2Client(googleConfig.clientId, googleConfig.clientSecret, redirectUrl);
            const state = JSON.stringify({
                type: "calendar",
                userId,
                timestamp: Date.now(),
            });
            const url = client.generateAuthUrl({
                client_id: googleConfig.clientId,
                redirect_uri: redirectUrl,
                access_type: "offline",
                scope: scopes,
                state: Buffer.from(state).toString("base64"),
            });
            return reply.send({
                ok: true,
                data: { url },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Error generating calendar auth URL");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Handle calendar authorization callback  
    fastify.post("/auth/google/calendar/callback", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const { code, state } = request.body;
            const user = request.user;
            const userId = user?.userId;
            const tenantId = user?.tenantId;
            if (!userId || !tenantId) {
                return reply.code(401).send({
                    ok: false,
                    message: "Unauthorized - Missing user context",
                });
            }
            if (!code || !state) {
                return reply.code(400).send({
                    ok: false,
                    message: "Code and state are required",
                });
            }
            // Verify state
            let stateData;
            try {
                stateData = JSON.parse(Buffer.from(state, "base64").toString());
                if (stateData.userId !== userId) {
                    throw new Error("State user mismatch");
                }
            }
            catch (err) {
                return reply.code(400).send({
                    ok: false,
                    message: "Invalid state",
                });
            }
            const googleConfig = await getGoogleConfig(tenantId);
            if (!googleConfig.clientId || !googleConfig.clientSecret) {
                return reply.code(503).send({
                    ok: false,
                    message: "Google OAuth not configured",
                });
            }
            const redirectUrl = googleConfig.redirectUri;
            const exchangeClient = new google_auth_library_1.OAuth2Client(googleConfig.clientId, googleConfig.clientSecret, redirectUrl);
            try {
                const { tokens } = await exchangeClient.getToken({
                    code,
                    redirect_uri: redirectUrl,
                });
                // Get user's email
                const response = await axios_1.default.get("https://www.googleapis.com/oauth2/v2/userinfo", {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                    },
                });
                const calendarEmail = response.data.email;
                // Save credentials to database
                await db_js_1.prisma.calendarCredentials.upsert({
                    where: {
                        userId_tenantId: {
                            userId,
                            tenantId,
                        },
                    },
                    update: {
                        accessToken: tokens.access_token || "",
                        refreshToken: tokens.refresh_token,
                        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        calendarEmail,
                        scope: tokens.scope || "",
                    },
                    create: {
                        userId,
                        tenantId,
                        accessToken: tokens.access_token || "",
                        refreshToken: tokens.refresh_token || null,
                        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        calendarEmail,
                        scope: tokens.scope || "",
                    },
                });
                fastify.log.info({ userId, calendarEmail }, "User calendar connected");
                return reply.send({
                    ok: true,
                    message: "Calendar connected successfully",
                    data: {
                        calendarEmail,
                    },
                });
            }
            catch (err) {
                fastify.log.error({ err }, "Failed to exchange calendar code");
                return reply.code(401).send({
                    ok: false,
                    message: "Failed to authorize calendar",
                });
            }
        }
        catch (err) {
            fastify.log.error({ err }, "Calendar callback error");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get Google Gmail authorization URL for authenticated users
    fastify.get("/auth/google/gmail-url", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user?.userId;
            if (!userId) {
                return reply.code(401).send({
                    ok: false,
                    message: "Unauthorized",
                });
            }
            const tenantId = request.user?.tenantId;
            const googleConfig = await getGoogleConfig(tenantId);
            if (!googleConfig.clientId || !googleConfig.enabled) {
                return reply.code(503).send({
                    ok: false,
                    message: "Google OAuth not configured",
                });
            }
            const redirectUrl = googleConfig.redirectUri;
            const scopes = [
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/userinfo.email",
            ];
            const client = new google_auth_library_1.OAuth2Client(googleConfig.clientId, googleConfig.clientSecret, redirectUrl);
            const state = JSON.stringify({
                type: "gmail",
                userId,
                timestamp: Date.now(),
            });
            const url = client.generateAuthUrl({
                client_id: googleConfig.clientId,
                redirect_uri: redirectUrl,
                access_type: "offline",
                scope: scopes,
                state: Buffer.from(state).toString("base64"),
            });
            return reply.send({
                ok: true,
                data: { url },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Error generating Gmail auth URL");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Handle Gmail authorization callback
    fastify.post("/auth/google/gmail/callback", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const { code, state } = request.body;
            const userId = request.user?.userId;
            const tenantId = request.user?.tenantId;
            if (!userId || !tenantId) {
                return reply.code(401).send({
                    ok: false,
                    message: "Unauthorized",
                });
            }
            if (!code || !state) {
                return reply.code(400).send({
                    ok: false,
                    message: "Code and state are required",
                });
            }
            // Verify state
            let stateData;
            try {
                stateData = JSON.parse(Buffer.from(state, "base64").toString());
                if (stateData.userId !== userId) {
                    throw new Error("State user mismatch");
                }
            }
            catch (err) {
                return reply.code(400).send({
                    ok: false,
                    message: "Invalid state",
                });
            }
            const googleConfig = await getGoogleConfig(tenantId);
            if (!googleConfig.clientId || !googleConfig.clientSecret) {
                return reply.code(503).send({
                    ok: false,
                    message: "Google OAuth not configured",
                });
            }
            const redirectUrl = googleConfig.redirectUri;
            const exchangeClient = new google_auth_library_1.OAuth2Client(googleConfig.clientId, googleConfig.clientSecret, redirectUrl);
            try {
                const { tokens } = await exchangeClient.getToken({
                    code,
                    redirect_uri: redirectUrl,
                });
                // Get user's email
                const response = await axios_1.default.get("https://www.googleapis.com/oauth2/v2/userinfo", {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                    },
                });
                const gmailEmail = response.data.email;
                // Save credentials to database
                await db_js_1.prisma.gmailCredentials.upsert({
                    where: {
                        userId_tenantId: {
                            userId,
                            tenantId,
                        },
                    },
                    update: {
                        accessToken: tokens.access_token || "",
                        refreshToken: tokens.refresh_token,
                        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        gmailEmail,
                        scope: tokens.scope || "",
                        verified: true,
                    },
                    create: {
                        userId,
                        tenantId,
                        accessToken: tokens.access_token || "",
                        refreshToken: tokens.refresh_token || null,
                        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        gmailEmail,
                        scope: tokens.scope || "",
                        verified: true,
                    },
                });
                fastify.log.info({ userId, gmailEmail }, "User Gmail connected");
                return reply.send({
                    ok: true,
                    message: "Gmail connected successfully",
                    data: {
                        gmailEmail,
                    },
                });
            }
            catch (err) {
                fastify.log.error({ err }, "Failed to exchange Gmail code");
                return reply.code(401).send({
                    ok: false,
                    message: "Failed to authorize Gmail",
                });
            }
        }
        catch (err) {
            fastify.log.error({ err }, "Gmail callback error");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
