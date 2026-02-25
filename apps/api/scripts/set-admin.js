"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "admin@orbisvoice.app";
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        console.error(`User with email ${email} not found.`);
        process.exit(1);
    }
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current status: isAdmin = ${user.isAdmin}`);
    if (user.isAdmin) {
        console.log("User is already an admin.");
        return;
    }
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
    });
    console.log(`Updated user: isAdmin = ${updatedUser.isAdmin}`);
    console.log("Admin status granted successfully.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
