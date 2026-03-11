"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const bcrypt = __importStar(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const logger_1 = require("../logger");
const referral_1 = require("../services/referral");
const affiliate_1 = require("../services/affiliate");
const isGmail = (email) => {
    const lower = email.toLowerCase();
    return lower.endsWith("@gmail.com") || lower.endsWith("@orbisvoice.app");
};
const SYSTEM_ADMIN_EMAILS = [
    "myorbislocal@gmail.com"
];
const ADMIN_EMAILS = [
    "myorbisvoice@gmail.com",
    "Crawford.peterson.sr@gmail.com"
];
const isSystemAdminEmail = (email) => {
    return SYSTEM_ADMIN_EMAILS.includes(email.toLowerCase());
};
const isAdminEmail = (email) => {
    return ADMIN_EMAILS.includes(email.toLowerCase()) || isSystemAdminEmail(email);
};
const SignupSchema = zod_1.z.object({
    email: zod_1.z.string().email().refine(isGmail, {
        message: "Only @gmail.com accounts are allowed at this time",
    }),
    name: zod_1.z.string().min(1),
    username: zod_1.z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    password: zod_1.z.string().min(8),
    referralCode: zod_1.z.string().optional(),
    affiliateSlug: zod_1.z.string().optional(),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string(),
    password: zod_1.z.string(),
});
async function authRoutes(fastify) {
    // Signup
    fastify.post("/auth/signup", async (request, reply) => {
        try {
            const body = SignupSchema.parse(request.body);
            // Check if user exists
            const existing = await db_1.prisma.user.findUnique({
                where: { email: body.email },
            });
            if (existing) {
                return reply.code(400).send({
                    ok: false,
                    message: "Email already registered",
                });
            }
            // Check if username exists
            const existingUsername = await db_1.prisma.user.findUnique({
                where: { username: body.username },
            });
            if (existingUsername) {
                return reply.code(400).send({
                    ok: false,
                    message: "Username already taken",
                });
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(body.password, 10);
            // Create tenant (for free signup, each user gets their own tenant)
            const tenant = await db_1.prisma.tenant.create({
                data: {
                    name: `${body.name}'s Workspace`,
                },
            });
            // Fetch system wide commission default
            const settings = await db_1.prisma.platformSettings.findUnique({
                where: { id: "global" }
            });
            // Create user
            const user = await db_1.prisma.user.create({
                data: {
                    email: body.email,
                    name: body.name,
                    username: body.username,
                    passwordHash: hashedPassword,
                    tenantId: tenant.id,
                    role: "USER",
                    isAdmin: false,
                    commissionLevel: settings?.defaultCommissionLevel || "LOW",
                },
            });
            if (body.affiliateSlug) {
                try {
                    logger_1.logger.info({ slug: body.affiliateSlug, userId: user.id }, "Recording affiliate referral on signup");
                    await affiliate_1.affiliateManager.recordReferral(body.affiliateSlug, user.id);
                }
                catch (err) {
                    logger_1.logger.error({ err, slug: body.affiliateSlug, userId: user.id }, "Affiliate referral recording failed");
                }
            }
            // Handle referral if provided
            if (body.referralCode) {
                try {
                    logger_1.logger.info({ code: body.referralCode, userId: user.id }, "Redeeming referral code on signup");
                    await referral_1.referralManager.redeemReferral(body.referralCode, user.id);
                }
                catch (err) {
                    logger_1.logger.error({ err, code: body.referralCode, userId: user.id }, "Referral redemption failed, but signup proceeding");
                }
            }
            // Generate JWT
            const token = fastify.jwt.sign({ userId: user.id, tenantId: tenant.id, email: user.email }, { expiresIn: "7d" });
            logger_1.logger.info({ userId: user.id, tenantId: tenant.id, referralCode: body.referralCode, affiliateSlug: body.affiliateSlug }, "User signed up successfully");
            return reply.code(201).send({
                ok: true,
                message: "Signup successful",
                data: { token, user: { id: user.id, email: user.email, name: user.name, username: user.username } },
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                logger_1.logger.warn({ err: err.errors }, "Signup validation error");
                return reply.code(400).send({
                    ok: false,
                    message: "Validation error",
                    data: err.errors,
                });
            }
            logger_1.logger.error(err, "Signup error");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Login
    fastify.post("/auth/login", async (request, reply) => {
        try {
            const body = LoginSchema.parse(request.body);
            // Find user
            const user = await db_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: body.email },
                        { username: body.email }
                    ]
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    passwordHash: true,
                    isBlocked: true,
                    tenantId: true,
                    role: true,
                    isAdmin: true
                }
            });
            if (!user) {
                return reply.code(401).send({
                    ok: false,
                    message: "Invalid credentials",
                });
            }
            // Auto-promote hardcoded admin on login (Safe-guarded)
            try {
                if (isAdminEmail(user.email) && (!user.isAdmin || user.role === "USER")) {
                    logger_1.logger.info({ email: user.email }, "Auto-promoting existing user to Admin on login");
                    const isSystem = isSystemAdminEmail(user.email);
                    await db_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            isAdmin: true,
                            role: isSystem ? "SYSTEM_ADMIN" : "ADMIN"
                        }
                    });
                    user.isAdmin = true;
                    user.role = isSystem ? "SYSTEM_ADMIN" : "ADMIN";
                }
            }
            catch (promoErr) {
                logger_1.logger.error({ promoErr, email: user.email }, "Promotion logic failed but login proceeding");
            }
            // Enforce Gmail-only for the account (skip for admins)
            if (!isGmail(user.email) && !user.isAdmin) {
                return reply.code(403).send({
                    ok: false,
                    message: "Only @gmail.com accounts are allowed",
                });
            }
            if (!user.passwordHash) {
                return reply.code(401).send({
                    ok: false,
                    message: "Account uses Google login",
                });
            }
            // Verify password
            const valid = await bcrypt.compare(body.password, user.passwordHash);
            if (!valid) {
                return reply.code(401).send({
                    ok: false,
                    message: "Invalid credentials",
                });
            }
            // Check if blocked
            if (user.isBlocked) {
                return reply.code(403).send({
                    ok: false,
                    message: "Account is blocked. Please contact support.",
                });
            }
            // Generate JWT
            const token = fastify.jwt.sign({
                userId: user.id,
                tenantId: user.tenantId,
                email: user.email,
                isBlocked: user.isBlocked
            }, { expiresIn: "7d" });
            logger_1.logger.info({ userId: user.id }, "User logged in");
            return reply.code(200).send({
                ok: true,
                message: "Login successful",
                data: { token, user: { id: user.id, email: user.email, name: user.name, username: user.username } },
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
            logger_1.logger.error(err, "Login error");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Firebase Sign-in / Signup Unified
    fastify.post("/auth/firebase-signin", async (request, reply) => {
        try {
            const { token, referralCode, affiliateSlug } = request.body;
            if (!token) {
                return reply.code(400).send({ ok: false, message: "Firebase token is required" });
            }
            // 1. Verify Token
            const { auth } = await Promise.resolve().then(() => __importStar(require("../lib/firebase")));
            const decodedToken = await auth.verifyIdToken(token);
            const email = decodedToken.email;
            const name = decodedToken.name || email?.split('@')[0] || "User";
            if (!email || (!isGmail(email) && !isAdminEmail(email))) {
                return reply.code(403).send({
                    ok: false,
                    message: "Only @gmail.com accounts are permitted"
                });
            }
            // 2. Find or Create User
            let user = await db_1.prisma.user.findUnique({
                where: { email },
            });
            // Auto-promote hardcoded admin
            const isAdmin = isAdminEmail(email);
            const isSystemAdmin = isSystemAdminEmail(email);
            let tenantId = user?.tenantId;
            if (!user) {
                // Chaos-free Auto-Signup
                logger_1.logger.info({ email }, "Auto-creating user from Firebase sign-in");
                const tenant = await db_1.prisma.tenant.create({
                    data: { name: `${name}'s Workspace` },
                });
                tenantId = tenant.id;
                const settings = await db_1.prisma.platformSettings.findUnique({
                    where: { id: "global" }
                });
                const isSystemAdmin = isSystemAdminEmail(email);
                user = await db_1.prisma.user.create({
                    data: {
                        email,
                        name,
                        username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                        tenantId,
                        role: isSystemAdmin ? "SYSTEM_ADMIN" : (isAdmin ? "ADMIN" : "USER"),
                        isAdmin: isAdmin,
                        commissionLevel: settings?.defaultCommissionLevel || "LOW",
                    },
                });
                // Handle affiliate/referral for new user
                if (affiliateSlug) {
                    try {
                        logger_1.logger.info({ slug: affiliateSlug, userId: user.id }, "Recording affiliate referral from Google Signin");
                        await affiliate_1.affiliateManager.recordReferral(affiliateSlug, user.id);
                    }
                    catch (e) {
                        logger_1.logger.error({ err: e, slug: affiliateSlug, userId: user.id }, "Affiliate referral recording failed on Google Signin");
                    }
                }
                if (referralCode) {
                    try {
                        logger_1.logger.info({ code: referralCode, userId: user.id }, "Redeeming referral code from Google Signin");
                        await referral_1.referralManager.redeemReferral(referralCode, user.id);
                    }
                    catch (e) {
                        logger_1.logger.error({ err: e, code: referralCode, userId: user.id }, "Referral redemption failed on Google Signin");
                    }
                }
            }
            if (user.isBlocked) {
                return reply.code(403).send({ ok: false, message: "Account is blocked" });
            }
            // Auto-promote existing user if added to hardcoded list later (Safe-guarded)
            try {
                if (isAdmin && (!user.isAdmin || user.role === "USER")) {
                    logger_1.logger.info({ email }, "Auto-promoting existing user to Admin via Google Sign-in");
                    user = await db_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            isAdmin: true,
                            role: isSystemAdmin ? "SYSTEM_ADMIN" : "ADMIN"
                        }
                    });
                }
            }
            catch (promoErr) {
                logger_1.logger.error({ promoErr, email }, "Promotion logic failed via Google but sign-in proceeding");
            }
            // 3. Issue Native JWT
            const appToken = fastify.jwt.sign({ userId: user.id, tenantId, email: user.email, isBlocked: user.isBlocked }, { expiresIn: "7d" });
            return reply.send({
                ok: true,
                message: "Signed in successfully",
                data: { token: appToken, user: { id: user.id, email: user.email, name: user.name, username: user.username } }
            });
        }
        catch (err) {
            logger_1.logger.error({
                err: {
                    message: err.message,
                    stack: err.stack,
                    code: err.code,
                    details: err.details
                },
                body: request.body
            }, "Firebase sign-in error");
            // Return more specific error message if it's a known constraint issue
            let message = "Authentication failed";
            if (err.code === 'P2002') {
                message = "This email or username is already in use.";
            }
            return reply.code(401).send({ ok: false, message });
        }
    });
}
