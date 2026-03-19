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

export async function resolveAdminScopedTenantId(fallbackTenantId: string): Promise<string> {
  const adminTenantId = await getSystemAdminTenantId();
  return pickEffectiveTenantId(adminTenantId, fallbackTenantId);
}
