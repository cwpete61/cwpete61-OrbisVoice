"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isAdmin: true,
            isBlocked: true
        }
    });
    console.log("Users in database:");
    users.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, Admin: ${u.isAdmin}, Blocked: ${u.isBlocked}`);
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
