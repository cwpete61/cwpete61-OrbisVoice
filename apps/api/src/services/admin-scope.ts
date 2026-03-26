import { prisma } from "../db";
import { logger } from "../logger";

const SYSTEM_ADMIN_EMAIL = "admin@orbisvoice.app";

let cachedAdminTenantId: string | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60_000;

export function pickEffectiveTenantId(
  adminTenantId: string | null | undefined,
  fallbackTenantId: string
): string {
  return adminTenantId || fallbackTenantId;
}

export async function getSystemAdminTenantId(): Promise<string | null> {
  const now = Date.now();
  if (cachedAdminTenantId && now < cacheExpiresAt) {
    return cachedAdminTenantId;
  }

  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [{ role: "SYSTEM_ADMIN" }, { email: SYSTEM_ADMIN_EMAIL }],
    },
    select: { tenantId: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!adminUser?.tenantId) {
    logger.warn("System admin tenant not found; falling back to user tenant scope");
    return null;
  }

  cachedAdminTenantId = adminUser.tenantId;
  cacheExpiresAt = now + CACHE_TTL_MS;

  return adminUser.tenantId;
}

export async function resolveAdminScopedTenantId(user: { tenantId: string, isAdmin?: boolean, role?: string }): Promise<string> {
  // Only override if the user is an admin AND we have a system admin tenant to scope to
  if (user.isAdmin || user.role === "ADMIN" || user.role === "SYSTEM_ADMIN") {
    const adminTenantId = await getSystemAdminTenantId();
    return adminTenantId || user.tenantId;
  }
  return user.tenantId;
}

