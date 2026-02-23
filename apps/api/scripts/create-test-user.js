"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "saasuser@example.com";
    const name = "SaaS User";
    // Create tenant first
    const tenant = await prisma.tenant.create({
        data: {
            name: `${name}'s Workspace`,
        }
    });
    const user = await prisma.user.create({
        data: {
            email,
            name,
            username: "saasuser",
            tenantId: tenant.id,
            role: "USER",
            isAdmin: false,
            isAffiliate: false
        }
    });
    console.log("Created SaaS User:", user);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
