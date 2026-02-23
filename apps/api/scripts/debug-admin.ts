import { prisma } from "../src/db";
import * as bcrypt from "bcryptjs";

async function checkAdmin() {
    const email = "admin@orbisvoice.app";
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log(`User ${email} NO EXISTE`);
        return;
    }

    console.log(`User ${email} found:`, {
        id: user.id,
        email: user.email,
        username: user.username,
        hasPassword: !!user.passwordHash
    });

    const isValid = await bcrypt.compare("admin123", user.passwordHash || "");
    console.log(`Password "admin123" is ${isValid ? "VALID" : "INVALID"}`);
}

checkAdmin().catch(console.error).finally(() => prisma.$disconnect());
