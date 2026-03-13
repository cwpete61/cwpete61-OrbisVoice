import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing users and tenants for reset...");

    try {
        // Find all users who have any admin privileges
        const admins = await prisma.user.findMany({
            where: {
                OR: [
                    { role: "ADMIN" },
                    { role: "SYSTEM_ADMIN" },
                    { isAdmin: true }
                ]
            },
            select: { tenantId: true, email: true }
        });

        const adminTenantIds = new Set(admins.map(a => a.tenantId));
        console.log(`Found ${admins.length} Admin users across ${adminTenantIds.size} unique Workspaces.`);

        // Find all users who are NOT admins
        const nonAdmins = await prisma.user.findMany({
            where: {
                NOT: {
                    OR: [
                        { role: "ADMIN" },
                        { role: "SYSTEM_ADMIN" },
                        { isAdmin: true }
                    ]
                }
            },
            select: { tenantId: true, email: true }
        });

        const nonAdminTenantIds = new Set(nonAdmins.map(u => u.tenantId));
        console.log(`Found ${nonAdmins.length} Non-Admin users across ${nonAdminTenantIds.size} unique Workspaces.`);

        // Identify tenants that ONLY have non-admin users
        const tenantsToReset: string[] = [];
        for (const tenantId of nonAdminTenantIds) {
            if (!adminTenantIds.has(tenantId)) {
                tenantsToReset.push(tenantId);
            }
        }

        console.log(`\nResults:`);
        console.log(`- Total unique workspaces with non-admin users: ${nonAdminTenantIds.size}`);
        console.log(`- Workspaces to be reset (no admin users): ${tenantsToReset.length}`);
        
        if (tenantsToReset.length > 0) {
            const sampleTenants = await prisma.tenant.findMany({
                where: { id: { in: tenantsToReset.slice(0, 5) } },
                select: { id: true, name: true, subscriptionTier: true }
            });
            console.log("\nSample of workspaces to be reset:");
            sampleTenants.forEach(t => console.log(`  - [${t.subscriptionTier}] ${t.name} (${t.id})`));
        }

    } catch (e) {
        console.error("Error during analysis:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
