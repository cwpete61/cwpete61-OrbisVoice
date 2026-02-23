import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "@fastify/jwt";
import { AuthPayload } from "../types";
import { prisma } from "../db";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authenticate;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ ok: false, message: "Unauthorized" });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ ok: false, message: "Unauthorized" });
    return;
  }

  const user = (request as unknown as { user: AuthPayload }).user;
  if (!user?.userId) {
    reply.code(401).send({ ok: false, message: "Unauthorized" });
    return;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true, role: true },
    }) as { isAdmin: boolean; role: string } | null;

    if (!dbUser || (!dbUser.isAdmin && dbUser.role !== "ADMIN")) {
      reply.code(403).send({ ok: false, message: "Forbidden" });
      return;
    }
  } catch (err) {
    reply.code(500).send({ ok: false, message: "Internal server error" });
    return;
  }
}

export async function requireNotBlocked(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ ok: false, message: "Unauthorized" });
    return;
  }

  const user = (request as unknown as { user: AuthPayload }).user;
  if (!user?.userId) {
    reply.code(401).send({ ok: false, message: "Unauthorized" });
    return;
  }

  // Optimization: Check JWT payload first
  if ((user as AuthPayload & { isBlocked?: boolean }).isBlocked) {
    reply.code(403).send({ ok: false, message: "Account is blocked from accessing agents" });
    return;
  }

  try {
    // DB check for consistency (in case block happened after token issuance)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isBlocked: true },
    }) as { isBlocked: boolean } | null;

    if (dbUser?.isBlocked) {
      reply.code(403).send({ ok: false, message: "Account is blocked from accessing agents" });
      return;
    }
  } catch (err) {
    reply.code(500).send({ ok: false, message: "Internal server error" });
    return;
  }
}

export function decodeToken(token: string, secret: string): AuthPayload | null {
  try {
    // @ts-expect-error - jwt.verify is available at runtime
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}
