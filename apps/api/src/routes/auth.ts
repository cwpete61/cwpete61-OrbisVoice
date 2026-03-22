import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse, AuthPayload } from "../types";
import { env } from "../env";
import { referralManager } from "../services/referral";
import { affiliateManager } from "../services/affiliate";
import { verifyTurnstileToken } from "../services/turnstile";
import { resolveUsageLimitForTier } from "../services/usage-service";

const isGmail = (email: string) => {
  return true; // Allowing all email domains for standard login
};

const SYSTEM_ADMIN_EMAILS = [
  "myorbislocal@gmail.com",
  "admin@orbisvoice.app",
  "talk@myorbisvoice.com",
];

const ADMIN_EMAILS = ["myorbisvoice@gmail.com", "Crawford.peterson.sr@gmail.com"];

const isSystemAdminEmail = (email: string) => {
  return SYSTEM_ADMIN_EMAILS.includes(email.toLowerCase());
};

const isAdminEmail = (email: string) => {
  return ADMIN_EMAILS.includes(email.toLowerCase()) || isSystemAdminEmail(email);
};

const SignupSchema = z.object({
  email: z.string().email().refine(isGmail, {
    message: "Only @gmail.com accounts are allowed at this time",
  }),
  name: z.string().min(1),
  username: z
    .string()
    .min(3)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  password: z.string().min(8),
  referralCode: z.string().optional(),
  affiliateSlug: z.string().optional(),
  captchaToken: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
  captchaToken: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Signup
  fastify.post<{ Body: z.infer<typeof SignupSchema> }>("/auth/signup", async (request, reply) => {
    try {
      const body = SignupSchema.parse(request.body);

      // Verify Turnstile
      if (body.captchaToken) {
        const valid = await verifyTurnstileToken(body.captchaToken);
        if (!valid) {
          return reply.code(400).send({
            ok: false,
            message: "Security check failed. Please try again.",
          } as ApiResponse);
        }
      }

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

      // Fetch system wide defaults
      const settings = await prisma.platformSettings.findUnique({
        where: { id: "global" },
      });
      const freeUsageLimit = resolveUsageLimitForTier("free", settings);

      // Create tenant (for free signup, each user gets their own tenant)
      // No subscription assigned until upgrade, with trial credits.
      const tenant = await prisma.tenant.create({
        data: {
          name: `${body.name}'s Workspace`,
          subscriptionTier: "free",
          subscriptionStatus: "none",
          usageLimit: freeUsageLimit,
          creditBalance: 3,
        },
      });

      // Generate secure verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          username: body.username,
          passwordHash: hashedPassword,
          tenantId: tenant.id,
          role: "USER",
          isAdmin: false,
          commissionLevel: settings?.defaultCommissionLevel || "LOW",
          emailVerificationToken: verificationToken,
        } as any,
      });

      // Send verification email (if enabled)
      try {
        if (settings?.emailVerificationEnabled) {
          const webUrl = env.WEB_URL;
          const verifyUrl = `${webUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(body.email)}`;
          const { createNotification, NotifType } = await import("../services/notification");

          await createNotification({
            userId: user.id,
            type: NotifType.EMAIL_VERIFICATION,
            title: "Verify your email address",
            body: `Welcome to OrbisVoice, ${body.name}! Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nIf you did not create an account, please ignore this email.`,
            sendEmail: true,
          });
          logger.info({ userId: user.id, email: body.email }, "Verification email sent on signup");
        } else {
          // Auto-verify if setting is disabled
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
          logger.info({ userId: user.id }, "Bypassing email verification (globally disabled)");
        }
      } catch (emailErr) {
        logger.error({ emailErr, userId: user.id }, "Failed to send verification email on signup");
      }

      if ((body as any).affiliateSlug) {
        try {
          logger.info(
            { slug: (body as any).affiliateSlug, userId: user.id },
            "Recording affiliate referral on signup"
          );
          await affiliateManager.recordReferral((body as any).affiliateSlug, user.id);
        } catch (err) {
          logger.error(
            { err, slug: (body as any).affiliateSlug, userId: user.id },
            "Affiliate referral recording failed"
          );
        }
      }

      // Handle referral if provided
      if (body.referralCode) {
        try {
          logger.info(
            { code: body.referralCode, userId: user.id },
            "Redeeming referral code on signup"
          );
          await referralManager.redeemReferral(body.referralCode, user.id);
        } catch (err) {
          logger.error(
            { err, code: body.referralCode, userId: user.id },
            "Referral redemption failed, but signup proceeding"
          );
        }
      }

      // We DO NOT sign them in immediately now. They must verify email first.
      // Or we decide to let them in but with a "limited" state.
      // Given the request "get email confirmation," it usually implies it's required.

      logger.info(
        { email: user.email, verificationRequired: !!settings?.emailVerificationEnabled },
        "Signup complete"
      );
      return reply.code(201).send({
        ok: true,
        message: settings?.emailVerificationEnabled
          ? "Signup successful! Please check your email to verify your account."
          : "Signup successful!",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: (user as any).username,
          },
          verificationRequired: !!settings?.emailVerificationEnabled,
        },
      } as ApiResponse);
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.warn({ err: err.errors }, "Signup validation error");
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
  });

  // Login
  fastify.post<{ Body: z.infer<typeof LoginSchema> }>("/auth/login", async (request, reply) => {
    try {
      const body = LoginSchema.parse(request.body);

      // Verify Turnstile
      if (body.captchaToken) {
        const valid = await verifyTurnstileToken(body.captchaToken);
        if (!valid) {
          return reply.code(400).send({
            ok: false,
            message: "Security check failed. Please try again.",
          } as ApiResponse);
        }
      }

      // Find user
      const user = (await prisma.user.findFirst({
        where: {
          OR: [{ email: body.email }, { username: body.email }],
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
          isAdmin: true,
          emailVerified: true,
          isEmailVerifiedByAdmin: true,
        },
      })) as any;

      if (!user) {
        return reply.code(401).send({
          ok: false,
          message: "Invalid credentials",
        } as ApiResponse);
      }

      // Auto-promote hardcoded admin on login (Safe-guarded)
      try {
        if (isAdminEmail(user.email) && (!user.isAdmin || user.role === "USER")) {
          logger.info({ email: user.email }, "Auto-promoting existing user to Admin on login");
          const isSystem = isSystemAdminEmail(user.email);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isAdmin: true,
              role: isSystem ? "SYSTEM_ADMIN" : "ADMIN",
            },
          });
          user.isAdmin = true;
          user.role = isSystem ? "SYSTEM_ADMIN" : "ADMIN";
        }
      } catch (promoErr) {
        logger.error(
          { promoErr, email: user.email },
          "Promotion logic failed but login proceeding"
        );
      }

      // Enforce Gmail-only for the account (skip for admins)
      // Disabled for now as per user request to use standard login
      /*
        if (!isGmail(user.email) && !user.isAdmin) {
          return reply.code(403).send({
            ok: false,
            message: "Only @gmail.com accounts are allowed",
          } as ApiResponse);
        }
        */

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

      // Check if email verified (if enabled)
      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      if (
        settings?.emailVerificationEnabled &&
        !user.emailVerified &&
        !user.isEmailVerifiedByAdmin &&
        !user.isAdmin
      ) {
        return reply.code(403).send({
          ok: false,
          message: "Please verify your email address before logging in.",
          data: { unverified: true, email: user.email },
        } as ApiResponse);
      }

      // Check if blocked
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
          isBlocked: user.isBlocked,
        },
        { expiresIn: "7d" }
      );

      return reply.code(200).send({
        ok: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: (user as any).username,
          },
        },
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
  });

  // Verify Email
  fastify.post<{ Body: { token: string } }>("/auth/verify-email", async (request, reply) => {
    try {
      const { token, email } = request.body as any;
      if (!token) {
        return reply.code(400).send({ ok: false, message: "Token is required" });
      }

      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
        },
      });

      if (!user) {
        // Robustness Check: If token not found, check if user is already verified
        if (email) {
          const alreadyVerified = await prisma.user.findFirst({
            where: {
              email: email,
              emailVerified: { not: null },
            },
          });

          if (alreadyVerified) {
            return reply.code(200).send({
              ok: true,
              message: "Email is already verified! You can now log in.",
            });
          }
        }

        return reply.code(400).send({
          ok: false,
          message: "Invalid or expired verification token",
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null,
        },
      });

      return reply.code(200).send({
        ok: true,
        message: "Email verified successfully! You can now log in.",
      });
    } catch (err) {
      logger.error(err, "Verify email error");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  // Resend Verification
  fastify.post<{ Body: { email: string } }>("/auth/resend-verification", async (request, reply) => {
    try {
      const { email } = request.body;
      if (!email) {
        return reply.code(400).send({ ok: false, message: "Email is required" });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { username: email }],
        },
      });

      if (!user) {
        // Success message for security
        return reply.code(200).send({
          ok: true,
          message: "If an account exists, a new verification link has been sent.",
        });
      }

      if (user.emailVerified) {
        return reply.code(400).send({
          ok: false,
          message: "Email is already verified.",
        });
      }
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: token,
        },
      });

      const webUrl = env.WEB_URL;
      const verifyUrl = `${webUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
      const { createNotification, NotifType } = await import("../services/notification");

      await createNotification({
        userId: user.id,
        type: NotifType.EMAIL_VERIFICATION,
        title: "Verify your email address",
        body: `Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nIf you did not request this, please ignore this email.`,
        sendEmail: true,
      });

      return reply.code(200).send({
        ok: true,
        message: "Verification link sent successfully",
      });
    } catch (err) {
      logger.error(err, "Resend verification error");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  // Forgot Password
  fastify.post<{ Body: { email: string } }>("/auth/forgot-password", async (request, reply) => {
    try {
      const { email } = request.body;
      if (!email) {
        return reply.code(400).send({ ok: false, message: "Email is required" });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { username: email }],
        },
      });

      if (!user) {
        // For security, always return success message
        return reply.code(200).send({
          ok: true,
          message: "If an account exists with that email, a reset link has been sent.",
        });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      });

      // Use the notification service to send email
      const webUrl = env.WEB_URL;
      const resetUrl = `${webUrl}/reset-password?token=${token}`;

      // We'll use createNotification which handles email sending
      // Note: We might need to import createNotification if it's not already
      const { createNotification } = await import("../services/notification");
      await createNotification({
        userId: user.id,
        type: "ADMIN_MANUAL",
        title: "Password Reset Request",
        body: `We received a request to reset your password. Click the link below to set a new one:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`,
        sendEmail: true,
      });

      return reply.code(200).send({
        ok: true,
        message: "Reset link sent successfully",
      });
    } catch (err) {
      logger.error(err, "Forgot password error");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  // Reset Password
  fastify.post<{ Body: { token: string; password: z.infer<typeof LoginSchema>["password"] } }>(
    "/auth/reset-password",
    async (request, reply) => {
      try {
        const { token, password } = request.body;
        if (!token || !password) {
          return reply.code(400).send({ ok: false, message: "Token and password are required" });
        }

        const user = await prisma.user.findFirst({
          where: {
            resetPasswordToken: token,
            resetPasswordExpires: { gte: new Date() },
          },
        });

        if (!user) {
          return reply.code(400).send({
            ok: false,
            message: "Invalid or expired reset token",
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
          },
        });

        return reply.code(200).send({
          ok: true,
          message: "Password has been reset successfully. You can now log in.",
        });
      } catch (err) {
        logger.error(err, "Reset password error");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );
}
