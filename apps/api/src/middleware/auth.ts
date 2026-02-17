import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "@fastify/jwt";
import { AuthPayload } from "../types";

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

export function decodeToken(token: string, secret: string): AuthPayload | null {
  try {
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}
