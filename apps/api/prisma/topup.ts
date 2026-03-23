import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany()
  for (const tenant of tenants) {
    console.log(`Giving 1000 credits to tenant: ${tenant.name} (${tenant.id})`)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        creditBalance: 1000,
        usageLimit: 10000,
        usageCount: 0
      }
    })
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
