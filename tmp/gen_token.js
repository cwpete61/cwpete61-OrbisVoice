const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const p = new PrismaClient();

async function main() {
    const admin = await p.user.findFirst({
        where: { isAdmin: true }
    });

    if (!admin) {
        console.error("Admin not found!");
        return;
    }

    const token = jwt.sign(
        { userId: admin.id, tenantId: admin.tenantId, email: admin.email },
        process.env.JWT_SECRET || "dev-secret-key-change-in-production",
        { expiresIn: "1h" }
    );

    console.log("==============");
    console.log("TOKEN_LOG_START" + token + "TOKEN_LOG_END");
    console.log("==============");
    console.log("Admin:", admin.email);
}

main().catch(console.error).finally(() => p.$disconnect());
