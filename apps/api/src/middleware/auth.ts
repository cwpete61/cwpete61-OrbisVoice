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

/**
 * Firebase ID Token Verification Middleware
 */
export async function verifyFirebaseToken(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401).send({ ok: false, message: "No Firebase token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const { auth } = await import("../lib/firebase");
    const decodedToken = await auth.verifyIdToken(token);

    // Attach the decoded token to the request object
    (request as any).firebaseUser = decodedToken;
  } catch (err) {
    reply.code(401).send({ ok: false, message: "Invalid or expired Firebase token" });
    return;
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

    if (!dbUser || (!dbUser.isAdmin && dbUser.role !== "ADMIN" && dbUser.role !== "SYSTEM_ADMIN")) {
      reply.code(403).send({ ok: false, message: "Forbidden" });
      return;
    }
  } catch (err) {
    reply.code(500).send({ ok: false, message: "Internal server error" });
    return;
  }
}

export async function requireSystemAdmin(request: FastifyRequest, reply: FastifyReply) {
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
      select: { role: true },
    }) as { role: string } | null;

    if (!dbUser || dbUser.role !== "SYSTEM_ADMIN") {
      reply.code(403).send({ ok: false, message: "Forbidden: System Admin only" });
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
