import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { referralManager } from "../services/referral";

const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8),
  referralCode: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Signup
  fastify.post<{ Body: z.infer<typeof SignupSchema> }>(
    "/auth/signup",
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

        // Create user
        const user = await prisma.user.create({
          data: {
            email: body.email,
            name: body.name,
            username: body.username,
            passwordHash: hashedPassword,
            tenantId: tenant.id,
          } as any,
        });

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
        });
        if (!user) {
          return reply.code(401).send({
            ok: false,
            message: "Invalid credentials",
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

        // Generate JWT
        const token = fastify.jwt.sign(
          { userId: user.id, tenantId: user.tenantId, email: user.email },
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
}
