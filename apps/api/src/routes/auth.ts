import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse, AuthPayload } from "../types";
import { verifyAppCheck } from "../middleware/app-check";
import { referralManager } from "../services/referral";
import { affiliateManager } from "../services/affiliate";

const isGmail = (email: string) => {
  return email.toLowerCase().endsWith("@gmail.com");
};

const SignupSchema = z.object({
  email: z.string().email().refine(isGmail, {
    message: "Only @gmail.com accounts are allowed at this time",
  }),
  name: z.string().min(1),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8),
  referralCode: z.string().optional(),
  affiliateSlug: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Signup
  fastify.post<{ Body: z.infer<typeof SignupSchema> }>(
    "/auth/signup",
    { preHandler: [verifyAppCheck] },
    async (request, reply) => {
      try {
        const body = SignupSchema.parse(request.body);

        // Check if user exists
        const existing = await prisma.user.findUnique({
          where: { email: body.email },
        });
        if (existing) {
          return reply.code(400).send({
            ok: false,
            message: "Email already registered",
          } as ApiResponse);
        }

        // Check if username exists
        const existingUsername = await prisma.user.findUnique({
          where: { username: body.username } as any,
        });
        if (existingUsername) {
          return reply.code(400).send({
            ok: false,
            message: "Username already taken",
          } as ApiResponse);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Create tenant (for free signup, each user gets their own tenant)
        const tenant = await prisma.tenant.create({
          data: {
            name: `${body.name}'s Workspace`,
          },
        });

        // Fetch system wide commission default
        const settings = await prisma.platformSettings.findUnique({
          where: { id: "global" }
        });

        // Create user
        const user = await prisma.user.create({
          data: {
            email: body.email,
            name: body.name,
            username: body.username,
            passwordHash: hashedPassword,
            tenantId: tenant.id,
            commissionLevel: settings?.defaultCommissionLevel || "LOW",
          } as any,
        });

        // Handle affiliate if provided
        if ((body as any).affiliateSlug) {
          try {
            await affiliateManager.recordReferral((body as any).affiliateSlug, user.id);
          } catch (err) {
            logger.error({ err, slug: (body as any).affiliateSlug, userId: user.id }, "Affiliate referral recording failed");
          }
        }

        // Handle referral if provided
        if (body.referralCode) {
          try {
            await referralManager.redeemReferral(body.referralCode, user.id);
          } catch (err) {
            logger.error({ err, code: body.referralCode, userId: user.id }, "Referral redemption failed, but signup proceeding");
          }
        }

        // Generate JWT
        const token = fastify.jwt.sign(
          { userId: user.id, tenantId: tenant.id, email: user.email },
          { expiresIn: "7d" }
        );

        logger.info({ userId: user.id, tenantId: tenant.id }, "User signed up");
        return reply.code(201).send({
          ok: true,
          message: "Signup successful",
          data: { token, user: { id: user.id, email: user.email, name: user.name, username: (user as any).username } },
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }
        logger.error(err, "Signup error");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Login
  fastify.post<{ Body: z.infer<typeof LoginSchema> }>(
    "/auth/login",
    { preHandler: [verifyAppCheck] },
    async (request, reply) => {
      try {
        const body = LoginSchema.parse(request.body);

        // Find user
        const user = await prisma.user.findFirst({
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
            tenantId: true
          }
        }) as any;

        if (!user) {
          return reply.code(401).send({
            ok: false,
            message: "Invalid credentials",
          } as ApiResponse);
        }

        // Enforce Gmail-only for the account
        if (!isGmail(user.email)) {
          return reply.code(403).send({
            ok: false,
            message: "Only @gmail.com accounts are allowed",
          } as ApiResponse);
        }

        if (!user.passwordHash) {
          return reply.code(401).send({
            ok: false,
            message: "Account uses Google login",
          } as ApiResponse);
        }

        // Verify password
        const valid = await bcrypt.compare(body.password, user.passwordHash);
        if (!valid) {
          return reply.code(401).send({
            ok: false,
            message: "Invalid credentials",
          } as ApiResponse);
        }

        // Check if blocked
        if (user.isBlocked) {
          return reply.code(403).send({
            ok: false,
            message: "Account is blocked. Please contact support.",
          } as ApiResponse);
        }

        // Generate JWT
        const token = fastify.jwt.sign(
          {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            isBlocked: user.isBlocked
          },
          { expiresIn: "7d" }
        );

        logger.info({ userId: user.id }, "User logged in");
        return reply.code(200).send({
          ok: true,
          message: "Login successful",
          data: { token, user: { id: user.id, email: user.email, name: user.name, username: (user as any).username } },
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }
        logger.error(err, "Login error");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Firebase Sign-in / Signup Unified
  fastify.post<{ Body: { token: string; referralCode?: string; affiliateSlug?: string } }>(
    "/auth/firebase-signin",
    { preHandler: [verifyAppCheck] },
    async (request, reply) => {
      try {
        const { token, referralCode, affiliateSlug } = request.body;
        if (!token) {
          return reply.code(400).send({ ok: false, message: "Firebase token is required" });
        }

        // 1. Verify Token
        const { auth } = await import("../lib/firebase");
        const decodedToken = await auth.verifyIdToken(token);
        const email = decodedToken.email;
        const name = decodedToken.name || email?.split('@')[0] || "User";

        if (!email || !isGmail(email)) {
          return reply.code(403).send({
            ok: false,
            message: "Only @gmail.com accounts are permitted"
          });
        }

        // 2. Find or Create User
        let user = await prisma.user.findUnique({
          where: { email },
        }) as any;

        let tenantId = user?.tenantId;

        if (!user) {
          // Chaos-free Auto-Signup
          logger.info({ email }, "Auto-creating user from Firebase sign-in");

          const tenant = await prisma.tenant.create({
            data: { name: `${name}'s Workspace` },
          });
          tenantId = tenant.id;

          const settings = await prisma.platformSettings.findUnique({
            where: { id: "global" }
          });

          user = await prisma.user.create({
            data: {
              email,
              name,
              username: email.split('@')[0] + Math.floor(Math.random() * 1000),
              tenantId,
              commissionLevel: settings?.defaultCommissionLevel || "LOW",
            } as any,
          });

          // Handle affiliate/referral for new user
          if (affiliateSlug) {
            try { await affiliateManager.recordReferral(affiliateSlug, user.id); } catch (e) { }
          }
          if (referralCode) {
            try { await referralManager.redeemReferral(referralCode, user.id); } catch (e) { }
          }
        }

        if (user.isBlocked) {
          return reply.code(403).send({ ok: false, message: "Account is blocked" });
        }

        // 3. Issue Native JWT
        const appToken = fastify.jwt.sign(
          { userId: user.id, tenantId, email: user.email, isBlocked: user.isBlocked },
          { expiresIn: "7d" }
        );

        return reply.send({
          ok: true,
          message: "Signed in successfully",
          data: { token: appToken, user: { id: user.id, email: user.email, name: user.name } }
        });
      } catch (err: any) {
        logger.error({
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
    }
  );
}
