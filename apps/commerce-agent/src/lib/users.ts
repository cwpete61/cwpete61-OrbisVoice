import prisma from './prisma';

export async function ensureCommerceUser(userId: string) {
  // We use the core system's userId as our externalUserId
  return await prisma.commerceUser.upsert({
    where: { externalUserId: userId },
    update: {},
    create: { 
      externalUserId: userId 
    }
  });
}
