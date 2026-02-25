"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Starting local cleanup script...");
    try {
        // 1. Find all admin users so we know which Workspaces to keep
        const admins = await prisma.user.findMany({
            where: {
                OR: [
                    { role: "ADMIN" },
                    { role: "SYSTEM_ADMIN" },
                    { isAdmin: true },
                    { email: "myorbislocal@gmail.com" },
                    { email: "admin@orbisvoice.app" }
                ]
            },
            select: { tenantId: true, email: true, id: true }
        });
        console.log(`Found ${admins.length} Admin users. Preserving their workspaces.`);
        // Collect tenant IDs that belong to admins
        const adminTenantIds = admins.map(a => a.tenantId);
        // 2. Delete all Users who are not admins
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: {
                    notIn: admins.map(a => a.id)
                }
            }
        });
        console.log(`Deleted ${deletedUsers.count} non-admin users (this cascaded to Affiliates & Referrals).`);
        // 3. Delete all Tenants (Workspaces) that don't belong to any admins
        const deletedTenants = await prisma.tenant.deleteMany({
            where: {
                id: {
                    notIn: adminTenantIds
                }
            }
        });
        console.log(`Deleted ${deletedTenants.count} Workspaces (this cascaded to AI Agents, Leads, API Keys, etc).`);
        console.log("Cleanup complete! Only admin data remains in the local DB.");
    }
    catch (e) {
        console.error("Error during cleanup:", e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main()
    .then(() => process.exit(0))
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
