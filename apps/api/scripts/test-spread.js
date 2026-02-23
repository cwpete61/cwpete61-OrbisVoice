"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Simulate the exact API logic for filter=referrers
    const users = await prisma.user.findMany({
        include: {
            affiliate: true
        },
        orderBy: { createdAt: "desc" },
    });
    const data = users.map(u => {
        if (u.affiliate) {
            const result = {
                ...u.affiliate,
                status: "ACTIVE",
                user: {
                    name: u.name,
                    email: u.email,
                    username: u.username,
                    isAffiliate: u.isAffiliate
                }
            };
            console.log(`User ${u.name} (has affiliate):`);
            console.log(`  affiliate.status = ${u.affiliate.status}`);
            console.log(`  result.status = ${result.status}`);
            return result;
        }
        const result = {
            id: u.id,
            userId: u.id,
            status: "ACTIVE",
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
        console.log(`User ${u.name} (virtual):`);
        console.log(`  result.status = ${result.status}`);
        return result;
    });
    console.log("\nFinal API response data:");
    data.forEach(d => {
        console.log(`  ${d.user.name}: status=${d.status}, isAffiliate=${d.user.isAffiliate}`);
    });
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
