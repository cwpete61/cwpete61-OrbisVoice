const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyKey() {
    try {
        const tenants = await prisma.tenant.findMany();
        for (const tenant of tenants) {
            await prisma.tenantGoogleConfig.upsert({
                where: { tenantId: tenant.id },
                update: {
                    geminiApiKey: "AIzaSyDUA_s8zhW_xKfPA-HmSrFIo6YRgS2nbRs",
                },
                create: {
                    tenantId: tenant.id,
                    clientId: "default",
                    clientSecret: "default",
                    geminiApiKey: "AIzaSyDUA_s8zhW_xKfPA-HmSrFIo6YRgS2nbRs"
                }
            });
            console.log(`Updated Gemini API Key for tenant ${tenant.id}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
applyKey();
