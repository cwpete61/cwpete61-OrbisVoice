import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Resetting non-admin workspaces to free tier...");

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
            select: { tenantId: true }
        });

        const adminTenantIds = new Set(admins.map(a => a.tenantId));
        
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
        
        const tenantsToReset: string[] = [];
        for (const tenantId of nonAdminTenantIds) {
            if (!adminTenantIds.has(tenantId)) {
                tenantsToReset.push(tenantId);
            }
        }

        if (tenantsToReset.length === 0) {
            console.log("No non-admin workspaces found to reset.");
            return;
        }

        console.log(`Resetting ${tenantsToReset.length} workspaces...`);

        const result = await prisma.tenant.updateMany({
            where: {
                id: { in: tenantsToReset }
            },
            data: {
                subscriptionTier: "free",
                subscriptionStatus: "none",
                usageLimit: 100,
                // Optional: usageCount: 0 // If we want to reset usage too
            }
        });

        console.log(`Successfully reset ${result.count} workspaces.`);

    } catch (e) {
        console.error("Error during reset:", e);
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
