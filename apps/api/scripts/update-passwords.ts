import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
    const emails = ["admin@orbisvoice.app", "wbrown@browncorp.com"];
    const passwords = ["admin123", "Orbis@123"];

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const newPassword = passwords[i];

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email } as any
                ]
            }
        });

        if (user) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: hashedPassword,
                    isBlocked: false, // Ensure they are not blocked
                }
            });
            console.log(`Updated password for ${email}`);
        } else {
            console.log(`User not found: ${email}`);
        }
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
