/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyKey() {
    try {
        const tenants = await prisma.tenant.findMany();
        for (const tenant of tenants) {
            await prisma.tenantGoogleConfig.upsert({
                where: { tenantId: tenant.id },
                update: {
                    geminiApiKey: "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo",
                },
                create: {
                    tenantId: tenant.id,
                    clientId: "default",
                    clientSecret: "default",
                    geminiApiKey: "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo"
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
