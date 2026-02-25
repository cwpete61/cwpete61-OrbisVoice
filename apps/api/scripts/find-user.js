"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({
        where: {
            username: "browncorp"
        }
    });
    if (user) {
        console.log("User found:");
        console.log("Email:", user.email);
        console.log("ID:", user.id);
    }
    else {
        console.log("User 'browncorp' not found by username. Searching by partial match...");
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: "browncorp" } },
                    { email: { contains: "browncorp" } }
                ]
            }
        });
        users.forEach((u) => console.log(`Found: ${u.email} (${u.username})`));
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
