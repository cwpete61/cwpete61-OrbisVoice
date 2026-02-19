"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding database...");
    // Hash the admin password
    const passwordHash = await bcryptjs_1.default.hash("Orbis@8214@@!!", 10);
    // Create or get admin tenant
    const adminTenant = await prisma.tenant.upsert({
        where: { id: "admin-tenant-001" },
        update: {
            name: "Admin Workspace",
        },
        create: {
            id: "admin-tenant-001",
            name: "Admin Workspace",
            subscriptionTier: "enterprise",
        },
    });
    console.log("Admin tenant:", adminTenant);
    // Create or update admin user
    const adminUser = await prisma.user.upsert({
        where: { id: "admin-user-001" },
        update: {
            email: "admin@orbisvoice.app",
            name: "Admin",
            username: "Oadmin",
            passwordHash,
            isAdmin: true,
            role: "ADMIN",
        },
        create: {
            id: "admin-user-001",
            tenantId: adminTenant.id,
            email: "admin@orbisvoice.app",
            name: "Admin",
            username: "Oadmin",
            passwordHash,
            isAdmin: true,
            role: "ADMIN",
        },
    });
    console.log("Admin user created/updated:", {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        isAdmin: adminUser.isAdmin,
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
