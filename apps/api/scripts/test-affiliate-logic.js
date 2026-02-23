"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const prisma = new client_1.PrismaClient();
async function testList() {
    console.log("--- Testing Admin Referrer List ---");
    const users = await prisma.user.findMany({
        where: {
            isAffiliate: false,
        },
        include: {
            affiliate: true
        },
        orderBy: { createdAt: "desc" },
    });
    const data = users.map(u => {
        if (u.affiliate) {
            return {
                ...u.affiliate,
                user: {
                    name: u.name,
                    email: u.email,
                    username: u.username,
                    isAffiliate: u.isAffiliate
                }
            };
        }
        return {
            id: u.id,
            userId: u.id,
            status: "PENDING",
            balance: 0,
            totalEarnings: 0,
            totalPaid: 0,
            slug: u.username || u.email.split('@')[0],
            createdAt: u.createdAt,
            user: {
                name: u.name,
                email: u.email,
                username: u.username,
                isAffiliate: false
            }
        };
    });
    console.log("Virtualized Referrers List Size:", data.length);
    console.log("Full List Summary:");
    data.forEach(item => {
        console.log(` - ${item.user.name} (${item.user.email}) | status: ${item.status} | isAffiliate: ${item.user.isAffiliate}`);
    });
}
async function main() {
    await testList();
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
