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
const SignupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
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
            // Hash password
            const hashedPassword = await bcrypt.hash(body.password, 10);
            // Create tenant (for free signup, each user gets their own tenant)
            const tenant = await db_1.prisma.tenant.create({
                data: {
                    name: `${body.name}'s Workspace`,
                    subdomain: `tenant-${Date.now()}`,
                },
            });
            // Create user
            const user = await db_1.prisma.user.create({
                data: {
                    email: body.email,
                    name: body.name,
                    passwordHash: hashedPassword,
                    tenantId: tenant.id,
                },
            });
            // Generate JWT
            const token = fastify.jwt.sign({ userId: user.id, tenantId: tenant.id, email: user.email }, { expiresIn: "7d" });
            logger_1.logger.info({ userId: user.id, tenantId: tenant.id }, "User signed up");
            return reply.code(201).send({
                ok: true,
                message: "Signup successful",
                data: { token, user: { id: user.id, email: user.email, name: user.name } },
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
            const user = await db_1.prisma.user.findUnique({
                where: { email: body.email },
            });
            if (!user) {
                return reply.code(401).send({
                    ok: false,
                    message: "Invalid credentials",
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
            // Generate JWT
            const token = fastify.jwt.sign({ userId: user.id, tenantId: user.tenantId, email: user.email }, { expiresIn: "7d" });
            logger_1.logger.info({ userId: user.id }, "User logged in");
            return reply.code(200).send({
                ok: true,
                message: "Login successful",
                data: { token, user: { id: user.id, email: user.email, name: user.name } },
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
}
