import { prisma } from "../src/db";

const GEMINI_API_KEY = "AIzaSyDUA_s8zhW_xKfPA-HmSrFIo6YRgS2nbRs";
const ADMIN_TENANT_ID = "admin-tenant-001";

async function main() {
    console.log("Configuring VoiceAgent for admin tenant...");

    // 1. Store the Gemini API key in TenantGoogleConfig
    const config = await prisma.tenantGoogleConfig.upsert({
        where: { tenantId: ADMIN_TENANT_ID },
        update: {
            geminiApiKey: GEMINI_API_KEY,
        },
        create: {
            tenantId: ADMIN_TENANT_ID,
            clientId: "placeholder-client-id",
            clientSecret: "placeholder-secret",
            geminiApiKey: GEMINI_API_KEY,
        },
    });

    console.log(`✅ Gemini API key saved for tenant ${config.tenantId}`);

    // 2. Create a default OrbisVoice agent (if none exists)
    const existingAgents = await prisma.agent.findMany({
        where: { tenantId: ADMIN_TENANT_ID },
    });

    if (existingAgents.length === 0) {
        const agent = await prisma.agent.create({
            data: {
                tenantId: ADMIN_TENANT_ID,
                name: "OrbisVoice Assistant",
                systemPrompt: `You are OrbisVoice Assistant, a helpful and professional AI voice agent for OrbisVoice. 
You help users with questions about our AI voice agent platform, including pricing, features, setup, and general support.
Be concise, friendly, and professional in all interactions.`,
                voiceId: "default",
            },
        });
        console.log(`✅ Default agent created: "${agent.name}" (ID: ${agent.id})`);
    } else {
        console.log(`ℹ️  ${existingAgents.length} agent(s) already exist for admin tenant — skipping creation.`);
        existingAgents.forEach(a => console.log(`   - ${a.name} (${a.id})`));
    }

    // 3. Ensure admin tenant has credits to use agents
    const tenant = await prisma.tenant.findUnique({
        where: { id: ADMIN_TENANT_ID },
        select: { creditBalance: true, subscriptionStatus: true },
    }) as any;

    console.log(`\nAdmin Tenant Status:`);
    console.log(`  Subscription: ${tenant?.subscriptionStatus || "none"}`);
    console.log(`  Credits: ${tenant?.creditBalance || 0}`);

    if ((tenant?.creditBalance || 0) === 0 && tenant?.subscriptionStatus !== "active") {
        console.log("\n⚠️  Adding 10,000 credits to admin tenant for testing...");
        await prisma.tenant.update({
            where: { id: ADMIN_TENANT_ID },
            data: { creditBalance: 10000 } as any,
        });
        console.log("✅ Credits added.");
    }

    console.log("\n🚀 VoiceAgent is ready!");
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
