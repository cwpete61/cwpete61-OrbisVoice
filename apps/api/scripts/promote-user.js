"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Promote Will Brown to Professional Partner
    const updated = await prisma.user.update({
        where: { email: "wbrown@browncorp.com" },
        data: { isAffiliate: true },
    });
    console.log(`Promoted ${updated.name} to Professional Partner (isAffiliate: ${updated.isAffiliate})`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
