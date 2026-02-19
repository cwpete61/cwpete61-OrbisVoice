"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = "admin@orbisvoice.app";
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (user) {
        console.log("User found:", user);
    }
    else {
        console.log("User not found");
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
