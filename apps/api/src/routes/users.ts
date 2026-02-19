import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { ApiResponse } from "../types.js";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

const AdminUpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  isAdmin: z.boolean().optional(),
  tier: z.enum(["starter", "professional", "enterprise", "ai-revenue-infrastructure"]).optional(),
  commissionLevel: z.enum(["LOW", "MED", "HIGH"]).optional(),
});

const AdminCreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8),
  tier: z.enum(["starter", "professional", "enterprise", "ai-revenue-infrastructure"]).optional(),
  commissionLevel: z.enum(["LOW", "MED", "HIGH"]).default("LOW"),
});

const PlatformSettingsSchema = z.object({
  lowCommission: z.number().min(0),
  medCommission: z.number().min(0),
  highCommission: z.number().min(0),
  starterLimit: z.number().int().min(0),
  professionalLimit: z.number().int().min(0),
  enterpriseLimit: z.number().int().min(0),
  ltdLimit: z.number().int().min(0),
  aiInfraLimit: z.number().int().min(0),
});

const AdminBlockUserSchema = z.object({
  isBlocked: z.boolean(),
});

const AdminPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export default async function userRoutes(fastify: FastifyInstance) {
  // Get current user profile
  fastify.get(
    "/users/me",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            isAdmin: true,
            isBlocked: true,
            avatar: true,
            tenantId: true,
            commissionLevel: true,
            referralCodeUsed: true,
            referralRewardTotal: true,
            createdAt: true,
            tenant: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        } as any) as any;

        if (!user) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        return reply.send({
          ok: true,
          data: user,
        } as ApiResponse<typeof user>);
      } catch (err) {
        fastify.log.error({ err }, "Failed to fetch user profile");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Update user profile
  fastify.put<{ Body: z.infer<typeof UpdateProfileSchema> }>(
    "/users/me",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const body = UpdateProfileSchema.parse(request.body);

        // Get current user to verify they exist
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!currentUser) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        // If email is being changed, check if it's already taken
        if (body.email) {
          const existing = await prisma.user.findUnique({
            where: { email: body.email },
          });
          if (existing && existing.id !== userId) {
            return reply.code(400).send({
              ok: false,
              message: "Email already in use",
            } as ApiResponse);
          }
        }

        const user = await prisma.user.update({
          where: { id: userId },
          data: body,
          select: {
            id: true,
            email: true,
            name: true,
          },
        }) as any;

        return reply.send({
          ok: true,
          data: user,
          message: "Profile updated successfully",
        } as ApiResponse<typeof user>);
      } catch (err) {
        fastify.log.error({ err }, "Failed to update user profile");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Update password
  fastify.put<{ Body: z.infer<typeof UpdatePasswordSchema> }>(
    "/users/me/password",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const body = UpdatePasswordSchema.parse(request.body);

        // Get current user
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        if (!user.passwordHash) {
          return reply.code(400).send({
            ok: false,
            message: "Account has no password set",
          } as ApiResponse);
        }

        // Verify current password
        const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
        if (!valid) {
          return reply.code(401).send({
            ok: false,
            message: "Current password is incorrect",
          } as ApiResponse);
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(body.newPassword, 10);

        // Update password
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash },
        });

        return reply.send({
          ok: true,
          message: "Password updated successfully",
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to update password");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Upload avatar
  fastify.post<{ Body: { avatarData: string } }>(
    "/users/me/avatar",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const body = request.body as any;

        if (!body || !body.avatarData) {
          return reply.code(400).send({
            ok: false,
            message: "No avatar data provided",
          } as ApiResponse);
        }

        const avatarData = body.avatarData;

        // Validate base64 data size (max 5MB = ~6.7MB base64)
        if (avatarData.length > 7 * 1024 * 1024) {
          return reply.code(400).send({
            ok: false,
            message: "Avatar data exceeds size limit",
          } as ApiResponse);
        }

        // Validate it's a data URL or base64
        if (!avatarData.startsWith("data:image/") && !avatarData.match(/^[A-Za-z0-9+/=]+$/)) {
          return reply.code(400).send({
            ok: false,
            message: "Invalid avatar data format",
          } as ApiResponse);
        }

        // Update user avatar
        const user = await prisma.user.update({
          where: { id: userId },
          data: { avatar: avatarData } as any,
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          } as any,
        }) as any;

        return reply.send({
          ok: true,
          data: user,
          message: "Avatar updated successfully",
        } as ApiResponse<typeof user>);
      } catch (err) {
        fastify.log.error({ err }, "Failed to upload avatar");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: list users
  fastify.get(
    "/admin/users",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const filter = (request.query as any)?.filter as string | undefined;
        const paidFilter = {
          tenant: { subscriptionStatus: "active" },
        } as any;
        const where =
          filter === "paid"
            ? paidFilter
            : filter === "free"
              ? { NOT: paidFilter }
              : undefined;

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            isAdmin: true,
            role: true,
            isBlocked: true,
            tenantId: true,
            googleId: true,
            googleEmail: true,
            commissionLevel: true,
            createdAt: true,
            updatedAt: true,
            tenant: {
              select: {
                subscriptionStatus: true,
                subscriptionTier: true,
              },
            },
            affiliate: {
              select: {
                id: true,
                status: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        } as any);

        return reply.send({
          ok: true,
          data: users,
        } as ApiResponse<typeof users>);
      } catch (err) {
        fastify.log.error({ err }, "Failed to list users");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: create user
  fastify.post<{ Body: z.infer<typeof AdminCreateUserSchema> }>(
    "/admin/users",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const body = AdminCreateUserSchema.parse(request.body);
        const tier = body.tier || "starter";

        const existing = await prisma.user.findUnique({
          where: { email: body.email },
        });
        if (existing) {
          return reply.code(400).send({
            ok: false,
            message: "Email already in use",
          } as ApiResponse);
        }

        const existingUsername = await prisma.user.findUnique({
          where: { username: body.username } as any,
        });
        if (existingUsername) {
          return reply.code(400).send({
            ok: false,
            message: "Username already taken",
          } as ApiResponse);
        }

        const passwordHash = await bcrypt.hash(body.password, 10);

        const tenant = await prisma.tenant.create({
          data: {
            name: `${body.name}'s Workspace`,
            subscriptionTier: tier as any,
            subscriptionStatus: "active",
          } as any,
        });

        const user = await prisma.user.create({
          data: {
            email: body.email,
            name: body.name,
            username: body.username,
            passwordHash,
            tenantId: tenant.id,
            commissionLevel: body.commissionLevel,
          } as any,
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            isAdmin: true,
            isBlocked: true,
            commissionLevel: true,
            tenant: {
              select: {
                subscriptionStatus: true,
                subscriptionTier: true,
              },
            },
          },
        } as any);

        return reply.code(201).send({
          ok: true,
          data: user,
          message: "User created successfully",
        } as ApiResponse<typeof user>);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        fastify.log.error({ err }, "Failed to create user");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: get user by id
  fastify.get<{ Params: { id: string } }>(
    "/admin/users/:id",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const userId = request.params.id;
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            isAdmin: true,
            role: true,
            isBlocked: true,
            avatar: true,
            tenantId: true,
            googleId: true,
            googleEmail: true,
            googleName: true,
            googleProfilePicture: true,
            commissionLevel: true,
            createdAt: true,
            updatedAt: true,
            tenant: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                subscriptionStatus: true,
                subscriptionTier: true,
              },
            },
          },
        } as any);

        if (!user) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        return reply.send({
          ok: true,
          data: user,
        } as ApiResponse<typeof user>);
      } catch (err) {
        fastify.log.error({ err }, "Failed to fetch user");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: update user
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof AdminUpdateUserSchema> }>(
    "/admin/users/:id",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const targetId = request.params.id;
        const body = AdminUpdateUserSchema.parse(request.body);

        const targetUser = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, email: true, username: true, isAdmin: true, role: true, tenantId: true },
        } as any);

        if (!targetUser) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        if (targetUser.username === "Oadmin") {
          if (body.username) {
            return reply.code(403).send({
              ok: false,
              message: "Admin username cannot be changed",
            } as ApiResponse);
          }

          if (body.role && body.role !== "ADMIN") {
            return reply.code(403).send({
              ok: false,
              message: "Admin role cannot be changed",
            } as ApiResponse);
          }

          if (body.isAdmin === false) {
            return reply.code(403).send({
              ok: false,
              message: "Admin privileges cannot be removed",
            } as ApiResponse);
          }
        }

        if (body.email && body.email !== targetUser.email) {
          const existingEmail = await prisma.user.findUnique({
            where: { email: body.email },
          });
          if (existingEmail) {
            return reply.code(400).send({
              ok: false,
              message: "Email already in use",
            } as ApiResponse);
          }
        }

        if (body.username && body.username !== targetUser.username) {
          const existingUsername = await prisma.user.findUnique({
            where: { username: body.username } as any,
          });
          if (existingUsername) {
            return reply.code(400).send({
              ok: false,
              message: "Username already taken",
            } as ApiResponse);
          }
        }

        const { tier, ...userData } = body;
        const userSelect = {
          id: true,
          email: true,
          name: true,
          username: true,
          isAdmin: true,
          role: true,
          isBlocked: true,
          commissionLevel: true,
          tenant: {
            select: {
              subscriptionStatus: true,
              subscriptionTier: true,
            },
          },
        } as any;

        const operations = [] as any[];
        if (Object.keys(userData).length > 0) {
          operations.push(
            prisma.user.update({
              where: { id: targetId },
              data: userData as any,
              select: userSelect,
            } as any)
          );
        } else {
          operations.push(
            prisma.user.findUnique({
              where: { id: targetId },
              select: userSelect,
            } as any)
          );
        }

        if (tier) {
          operations.push(
            prisma.tenant.update({
              where: { id: targetUser.tenantId },
              data: {
                subscriptionTier: tier as any,
                subscriptionStatus: "active",
              } as any,
            } as any)
          );
        }

        const [user] = await prisma.$transaction(operations);

        return reply.send({
          ok: true,
          data: user,
          message: "User updated successfully",
        } as ApiResponse<typeof user>);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        fastify.log.error({ err }, "Failed to update user");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: block or unblock user
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof AdminBlockUserSchema> }>(
    "/admin/users/:id/block",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const targetId = request.params.id;
        const body = AdminBlockUserSchema.parse(request.body);

        const targetUser = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, username: true },
        } as any);

        if (!targetUser) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        if (targetUser.username === "Oadmin") {
          return reply.code(403).send({
            ok: false,
            message: "Admin account cannot be blocked",
          } as ApiResponse);
        }

        const user = await prisma.user.update({
          where: { id: targetId },
          data: { isBlocked: body.isBlocked } as any,
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            isAdmin: true,
            role: true,
            isBlocked: true,
            commissionLevel: true,
          },
        } as any);

        return reply.send({
          ok: true,
          data: user,
          message: body.isBlocked ? "User blocked" : "User unblocked",
        } as ApiResponse<typeof user>);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        fastify.log.error({ err }, "Failed to update user block status");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: reset user password
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof AdminPasswordSchema> }>(
    "/admin/users/:id/password",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const targetId = request.params.id;
        const body = AdminPasswordSchema.parse(request.body);

        const targetUser = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, username: true },
        } as any);

        if (!targetUser) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        const passwordHash = await bcrypt.hash(body.newPassword, 10);

        await prisma.user.update({
          where: { id: targetId },
          data: { passwordHash } as any,
        });

        return reply.send({
          ok: true,
          message: "Password updated successfully",
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        fastify.log.error({ err }, "Failed to update password");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: impersonate user (support access)
  fastify.post<{ Params: { id: string } }>(
    "/admin/users/:id/impersonate",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const targetId = request.params.id;
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            email: true,
            name: true,
            tenantId: true,
            username: true,
          },
        } as any);

        if (!user) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        const token = fastify.jwt.sign(
          { userId: user.id, tenantId: user.tenantId, email: user.email },
          { expiresIn: "1h" }
        );

        return reply.send({
          ok: true,
          message: "Impersonation token created",
          data: { token, user },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to impersonate user");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: delete user
  fastify.delete<{ Params: { id: string } }>(
    "/admin/users/:id",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const targetId = request.params.id;

        const targetUser = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, username: true },
        } as any);

        if (!targetUser) {
          return reply.code(404).send({
            ok: false,
            message: "User not found",
          } as ApiResponse);
        }

        if (targetUser.username === "Oadmin") {
          return reply.code(403).send({
            ok: false,
            message: "Admin account cannot be deleted",
          } as ApiResponse);
        }

        await prisma.user.delete({
          where: { id: targetId },
        } as any);

        return reply.send({
          ok: true,
          message: "User deleted successfully",
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to delete user");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: get Google auth configuration
  fastify.get(
    "/admin/google-auth/config",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const config = await prisma.googleAuthConfig.findUnique({
          where: { id: "google-auth-config" },
        } as any);

        return reply.send({
          ok: true,
          data: config || {
            id: "google-auth-config",
            clientId: null,
            clientSecret: null,
            redirectUri: null,
            enabled: false,
          },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to fetch Google auth config");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: update Google auth configuration
  fastify.put<{ Body: { clientId?: string; clientSecret?: string; redirectUri?: string; enabled?: boolean } }>(
    "/admin/google-auth/config",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const body = request.body || {};

        const config = await prisma.googleAuthConfig.upsert({
          where: { id: "google-auth-config" },
          update: {
            clientId: body.clientId,
            clientSecret: body.clientSecret,
            redirectUri: body.redirectUri,
            enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
          } as any,
          create: {
            id: "google-auth-config",
            clientId: body.clientId || null,
            clientSecret: body.clientSecret || null,
            redirectUri: body.redirectUri || null,
            enabled: body.enabled ?? false,
          } as any,
        });

        return reply.send({
          ok: true,
          data: config,
          message: "Google auth configuration updated",
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to update Google auth config");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get calendar connection status for current user
  fastify.get(
    "/users/me/calendar",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        const creds = await prisma.calendarCredentials.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
          select: {
            id: true,
            calendarEmail: true,
            createdAt: true,
            expiresAt: true,
          },
        }) as any;

        return reply.send({
          ok: true,
          data: {
            connected: !!creds,
            ...creds,
          },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to get calendar status");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Disconnect user's calendar
  fastify.delete(
    "/users/me/calendar",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        await prisma.calendarCredentials.deleteMany({
          where: {
            userId,
            tenantId,
          },
        });

        return reply.send({
          ok: true,
          message: "Calendar disconnected",
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to disconnect calendar");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get Gmail connection status for current user
  fastify.get(
    "/users/me/gmail",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        const creds = await prisma.gmailCredentials.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
          select: {
            id: true,
            gmailEmail: true,
            verified: true,
            createdAt: true,
            expiresAt: true,
          },
        }) as any;

        return reply.send({
          ok: true,
          data: {
            connected: !!creds,
            ...creds,
          },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to get Gmail status");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Disconnect user's Gmail
  fastify.delete(
    "/users/me/gmail",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        await prisma.gmailCredentials.deleteMany({
          where: {
            userId,
            tenantId,
          },
        });

        return reply.send({
          ok: true,
          message: "Gmail disconnected",
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to disconnect Gmail");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get Gmail OAuth connection URL
  fastify.get(
    "/users/me/gmail/connect-url",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { OAuth2Client } = await import("google-auth-library");
        const { env } = await import("../env.js");

        const client = new OAuth2Client(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          `${env.GOOGLE_REDIRECT_URI?.replace("/auth/google/callback", "") || "http://localhost:3000"}/auth/gmail/callback`
        );

        const url = client.generateAuthUrl({
          access_type: "offline",
          scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/gmail.send",
          ],
          prompt: "consent",
        });

        return reply.send({
          ok: true,
          data: { url },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to generate Gmail connect URL");
        return reply.code(500).send({
          ok: false,
          message: "Failed to generate Gmail connection URL",
        } as ApiResponse);
      }
    }
  );

  // Handle Gmail OAuth callback
  fastify.post(
    "/users/me/gmail/connect",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;
        const body = request.body as any;
        const { code } = body;

        if (!code) {
          return reply.code(400).send({
            ok: false,
            message: "Authorization code is required",
          } as ApiResponse);
        }

        const { OAuth2Client } = await import("google-auth-library");
        const { env } = await import("../env.js");

        const client = new OAuth2Client(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          `${env.GOOGLE_REDIRECT_URI?.replace("/auth/google/callback", "") || "http://localhost:3000"}/auth/gmail/callback`
        );

        // Exchange code for tokens
        const { tokens } = await client.getToken(code);

        if (!tokens.access_token) {
          throw new Error("No access token received");
        }

        // Get user's email from the token
        const { google } = await import("googleapis");
        const oauth2Api = google.oauth2({ version: "v2", auth: client as any });
        client.setCredentials(tokens);
        const userInfo = await oauth2Api.userinfo.get();

        // Store or update Gmail credentials
        await prisma.gmailCredentials.upsert({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
          create: {
            userId,
            tenantId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            gmailEmail: (userInfo.data as any).email,
            scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
            verified: true,
          },
          update: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            gmailEmail: (userInfo.data as any).email,
            verified: true,
          },
        });

        return reply.send({
          ok: true,
          message: "Gmail connected successfully",
          data: {
            gmailEmail: (userInfo.data as any).email,
          },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to connect Gmail");
        return reply.code(400).send({
          ok: false,
          message: "Failed to connect Gmail account",
        } as ApiResponse);
      }
    }
  );

  // Get Gmail credentials
  fastify.get(
    "/users/me/gmail/credentials",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        const creds = await prisma.gmailCredentials.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
          select: {
            gmailEmail: true,
            verified: true,
            expiresAt: true,
          },
        });

        return reply.send({
          ok: true,
          data: creds || { gmailEmail: null, verified: false },
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to fetch Gmail credentials");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Disconnect Gmail
  fastify.delete(
    "/users/me/gmail/disconnect",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        await prisma.gmailCredentials.delete({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
        });

        return reply.send({
          ok: true,
          message: "Gmail disconnected successfully",
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to disconnect Gmail");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Verify Gmail connectivity
  fastify.post(
    "/users/me/gmail/verify",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request as any).user.userId;
        const tenantId = (request as any).user.tenantId;

        const creds = await prisma.gmailCredentials.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId,
            },
          },
        }) as any;

        if (!creds) {
          return reply.code(400).send({
            ok: false,
            message: "Gmail not connected",
          } as ApiResponse);
        }

        try {
          // Test access by making a simple API call to Gmail
          const response = await fetch(
            "https://www.googleapis.com/gmail/v1/users/me/profile",
            {
              headers: {
                Authorization: `Bearer ${creds.accessToken}`,
              },
            }
          );

          if (!response.ok) {
            if (response.status === 401) {
              // Token might be expired, mark as not verified
              await prisma.gmailCredentials.update({
                where: { id: creds.id },
                data: { verified: false },
              });
              return reply.code(401).send({
                ok: false,
                message: "Gmail token expired. Please reconnect.",
              } as ApiResponse);
            }
            throw new Error(`Gmail API returned ${response.status}`);
          }

          const profile = await response.json();

          // Update verified status
          await prisma.gmailCredentials.update({
            where: { id: creds.id },
            data: {
              verified: true,
              gmailEmail: profile.emailAddress || creds.gmailEmail,
            },
          });

          return reply.send({
            ok: true,
            message: "Gmail connection verified successfully",
            data: {
              gmailEmail: profile.emailAddress || creds.gmailEmail,
              verified: true,
            },
          } as ApiResponse);
        } catch (err) {
          fastify.log.error({ err }, "Gmail verification failed");
          return reply.code(400).send({
            ok: false,
            message: "Gmail verification failed",
          } as ApiResponse);
        }
      } catch (err) {
        fastify.log.error({ err }, "Failed to verify Gmail");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: Get platform settings
  fastify.get(
    "/admin/platform-settings",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        let settings = await prisma.platformSettings.findUnique({
          where: { id: "global" },
        });

        if (!settings) {
          // Initialize default settings if not exists
          settings = await prisma.platformSettings.create({
            data: {
              id: "global",
              lowCommission: 10,
              medCommission: 20,
              highCommission: 30,
              starterLimit: 1000,
              professionalLimit: 10000,
              enterpriseLimit: 100000,
              ltdLimit: 1000,
              aiInfraLimit: 250000,
            },
          });
        }

        return reply.send({
          ok: true,
          data: settings,
        } as ApiResponse);
      } catch (err) {
        fastify.log.error({ err }, "Failed to fetch platform settings");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Admin: Update platform settings
  fastify.put<{ Body: z.infer<typeof PlatformSettingsSchema> }>(
    "/admin/platform-settings",
    { onRequest: [requireAdmin] },
    async (request, reply) => {
      try {
        const body = PlatformSettingsSchema.parse(request.body);

        const settings = await prisma.platformSettings.upsert({
          where: { id: "global" },
          update: body,
          create: {
            id: "global",
            ...body,
          },
        });

        return reply.send({
          ok: true,
          data: settings,
          message: "Platform settings updated successfully",
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        fastify.log.error({ err }, "Failed to update platform settings");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
