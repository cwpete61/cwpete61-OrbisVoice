import { prisma } from "../src/db";
import * as bcrypt from "bcryptjs";

async function resetPassword() {
    const email = "admin@orbisvoice.app";
    const password = "admin123";
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { email },
        data: { passwordHash }
    });

    console.log(`Password for ${email} has been reset to ${password}`);
}

resetPassword().catch(console.error).finally(() => prisma.$disconnect());
